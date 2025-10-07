# Recipe API Server

A lightweight RESTful API built with **Node.js**, **Express**, and **SQLite3** to manage and search a recipes database.  
It supports importing data from a JSON file, paginated listing, and powerful search filters (rating, calories, cuisine, etc).

---

## Features

- 📂 Import recipes in bulk from a JSON file  
- 🔍 Advanced search with comparison operators (`>=`, `<=`, `<`, `>`, `=`)  
- 📄 Pagination support (`page` and `limit`)  
- ⭐ Sorting by rating (descending by default)  
- 🥗 Nutrition data (calories) parsed from JSON fields  
- 🧱 Auto-creates database and indexes if missing  
- 🔒 Built-in CORS support for frontend apps  

---

## Tech Stack

- **Node.js** (v16+ recommended)
- **Express.js**
- **SQLite3** (with JSON1 functions)
- **CORS**

---

## Installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/your-username/recipe-api.git
   cd recipe-api
