// server.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.resolve('./recipes4.db');
const JSON_PATH = path.resolve('./US_recipes_null.json');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());                 // allow browser clients 
app.use(express.json());         // parse JSON bodies

// Open DB 
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) return console.error('DB open error:', err.message);
  console.log('Opened', DB_PATH);
});

// Ensure schema exists 
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cuisine TEXT NOT NULL,
      title TEXT NOT NULL,
      rating REAL CHECK (rating BETWEEN 0 AND 5),
      prep_time INTEGER CHECK (prep_time >= 0),
      cook_time INTEGER CHECK (cook_time >= 0),
      total_time INTEGER CHECK (total_time >= 0),
      description TEXT,
      nutrients TEXT,
      serves TEXT
    )
  `); // i am creating if its missing but still its optional
  db.run(`CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes (rating)`); 
  db.run(`CREATE INDEX IF NOT EXISTS idx_recipes_nutrients_cal ON recipes (json_extract(nutrients,'$.calories'))`); 
});

// util
const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const normalize = (rec) => ([
  rec.cuisine || '',
  rec.title || '',
  toNum(rec.rating),
  toNum(rec.prep_time) ?? 0,
  toNum(rec.cook_time) ?? 0,
  toNum(rec.total_time) ?? 0,
  rec.description ?? null,
  rec.nutrients ? JSON.stringify(rec.nutrients) : null,
  rec.serves ?? null
]);

function loadJsonList(filePath){
  const raw = fs.readFileSync(filePath, 'utf8');      // read file 
  const parsed = JSON.parse(raw);                      // parse JSON 
  if (Array.isArray(parsed)) return parsed;            // array input 
  if (parsed && typeof parsed === 'object') {
    const keys = Object.keys(parsed);                  // iterate keys 
    const numericKeys = keys.filter(k => /^\d+$/.test(k));
    if (numericKeys.length && numericKeys.length === keys.length) {
      numericKeys.sort((a,b) => Number(a) - Number(b)); // stable numeric order 
      return numericKeys.map(k => parsed[k]);           // collect all entries 
    }
    return [parsed];                                    // single object
  }
  return [parsed];
}

// optional
app.get('/api/recipes', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 200); // basic pagination
  const page = Math.max(Number(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;
  const minCal = req.query.minCalories ? Number(req.query.minCalories) : null;

  const baseCols = `id, title, cuisine, rating, total_time,
                    json_extract(nutrients,'$.calories') AS calories`; // JSON1 extract [web:181][web:32]

  const sql = minCal !== null
    ? `SELECT ${baseCols} FROM recipes
       WHERE json_extract(nutrients,'$.calories') >= ?
       ORDER BY id DESC LIMIT ? OFFSET ?`
    : `SELECT ${baseCols} FROM recipes
       ORDER BY id DESC LIMIT ? OFFSET ?`;

  const params = minCal !== null ? [minCal, limit, offset] : [limit, offset];

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ page, limit, count: rows.length, data: rows });
  });
});

// Bulk import from JSON file by using Post request
app.post('/api/recipes/import'  , (req, res) => {
  try {
    const list = loadJsonList(JSON_PATH);                    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare(`INSERT INTO recipes
        (cuisine, title, rating, prep_time, cook_time, total_time, description, nutrients, serves)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      let i = 0;
      for (const rec of list) {
        stmt.run(normalize(rec));
        i++;
      }
      stmt.finalize((err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        } 
        db.run('COMMIT', (e) => {
          if (e) return res.status(500).json({ error: e.message });
          res.status(201).json({ imported: i, source: path.basename(JSON_PATH) });
        });
      });
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// End-Point-1
// GET /api/recipes?page=1&limit=10  (sorted by rating desc)
app.get('/api/recipes', (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(parseInt(req.query.limit || '10', 10), 200);
  const offset = (page - 1) * limit;

  // 1) total count
  db.get(`SELECT COUNT(*) AS total FROM recipes`, [], (err1, row) => {
    if (err1) return res.status(500).json({ error: err1.message });
    const total = row.total;

    // 2) page data sorted by rating desc, tie-break by id desc
    const sql = `
      SELECT id, title, cuisine, rating, total_time
      FROM recipes
      ORDER BY rating DESC NULLS LAST, id DESC
      LIMIT ? OFFSET ?
    `;
    db.all(sql, [limit, offset], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({
        page,
        limit,
        total,
        data: rows
      });
    });
  });
});



// GET /api/recipes/search?calories=<=400&title=pie&rating=>=4.5&cuisine=Southern&total_time=<=120&page=1&limit=10
app.get('/api/recipes/search', (req, res) => {
  // to parse compact operators like ">=400"
  const parseOpVal = (raw) => {
    if (!raw) return null;
    const m = String(raw).match(/^\s*(<=|>=|=|<|>)\s*([^]+)\s*$/);
    if (!m) return null;
    const op = m[1];
    const num = Number(m[2]);
    if (!Number.isFinite(num)) return null;
    return { op, val: num };
  };
  const where = [];
  const params = [];
  const cal = parseOpVal(req.query.calories);
  if (cal) {
    where.push(`(CAST(REPLACE(REPLACE(json_extract(nutrients,'$.calories'),'kcal',''),' ','') AS REAL) + 0) ${cal.op} ?`);
    params.push(cal.val);
  } // Cast pattern ensures numeric comparison even if JSON stores "389 kcal"

  // title partial match, case-insensitive
  if (req.query.title && String(req.query.title).trim() !== '') {
    where.push(`title LIKE ? COLLATE NOCASE`);
    params.push(`%${String(req.query.title).trim()}%`);
  }

  if (req.query.cuisine && String(req.query.cuisine).trim() !== '') {
    where.push(`cuisine = ? COLLATE NOCASE`);
    params.push(String(req.query.cuisine).trim());
  } 

  const tt = parseOpVal(req.query.total_time);
  if (tt) {
    where.push(`total_time ${tt.op} ?`);
    params.push(tt.val);
  } 
  // rating comparison
  const rt = parseOpVal(req.query.rating);
  if (rt) {
    where.push(`rating ${rt.op} ?`);
    params.push(rt.val);
  } // Numeric comparison for rating [web:262]
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  // Pagination
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(parseInt(req.query.limit || '10', 10), 200);
  const offset = (page - 1) * limit;

  // Count it
  const countSql = `SELECT COUNT(*) AS total FROM recipes ${whereSQL}`;
  db.get(countSql, params, (err1, row) => {
    if (err1) return res.status(500).json({ error: err1.message });
    const total = row?.total ?? 0;

    // Fetch rows; include description and original nutrients JSON
    const sql = `
      SELECT
        id, title, cuisine, rating, prep_time, cook_time, total_time,
        description, nutrients,
        CAST(REPLACE(REPLACE(json_extract(nutrients,'$.calories'),'kcal',''),' ','') AS REAL) AS calories
      FROM recipes
      ${whereSQL}
      ORDER BY rating DESC NULLS LAST, id DESC
      LIMIT ? OFFSET ?
    `; // ORDER BY + pagination for stable pages 

    db.all(sql, [...params, limit, offset], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // Parse nutrients back to objects for JSON response
      const data = rows.map(r => ({
        ...r,
        nutrients: r.nutrients ? (() => { try { return JSON.parse(r.nutrients); } catch { return r.nutrients; } })() : null
      })); // Return full example-like structure

      res.json({ page, limit, total, data });
    });
  });
});
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));



//2nd API Search
// Sample things to search using api
//High Calorie Chicken
// http://localhost:3000/api/recipes/search?calories=>=500&title=chicken
// Quick High-Rated Dishes:

// http://localhost:3000/api/recipes/search?rating=>=4.8&total_time=<=30
// Quick Southern Recipes:

// http://localhost:3000/api/recipes/search?cuisine=Southern Recipes&total_time=<=60
// Exact 4.5 Rating:

// http://localhost:3000/api/recipes/search?rating=4.5
// Page 2, Limit 5 (No Filters):

// http://localhost:3000/api/recipes/search?page=2&limit=5