// src/components/RecipeList.jsx
import React, { useState } from 'react';

// Basic styling for the grid and card
const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    backgroundColor: '#7ad1dbff',
    height: '200px', // Fixed height for consistent cards
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHover: {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 15px rgba(0,0,0,0.1)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#00656cff',
    padding: '30px',
    borderRadius: '10px',
    width: '80%',
    maxHeight: '90%',
    overflowY: 'auto',
    zIndex: 1001,
  },
};

const RecipeList = ({ recipes, pagination, onPageChange }) => {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  const handlePrev = () => { if (page > 1) onPageChange(page - 1); };
  const handleNext = () => { if (page < totalPages) onPageChange(page + 1); };

  // Component to display the full details of a recipe
  const DetailModal = ({ recipe, onClose }) => {
    if (!recipe) return null;

    // Helper to format JSON nutrients
    const NutrientDisplay = ({ nutrients }) => {
        if (!nutrients || typeof nutrients !== 'object') return <p>Nutritional data unavailable.</p>;
        return (
            <ul>
                {Object.entries(nutrients).map(([key, value]) => (
                    <li key={key}>
                        <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {value}
                    </li>
                ))}
            </ul>
        );
    };

    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}> {/* Prevent closing when clicking inside */}
          <button onClick={onClose} style={{ float: 'right', fontSize: '1.2em' }}>&times;</button>
          <h2>{recipe.title}</h2>
          <p><strong>Cuisine:</strong> {recipe.cuisine}</p>
          <p><strong>Rating:</strong> {recipe.rating || 'N/A'}</p>
          <p><strong>Total Time:</strong> {recipe.total_time} mins</p>
          
          <h3>Description</h3>
          <p>{recipe.description}</p>
          
          <h3>Nutrients (per serving)</h3>
          <NutrientDisplay nutrients={recipe.nutrients} />
          
          {/* Note: Instructions/Ingredients are not returned by the current search API, 
             so we only display data returned by your search endpoint. 
             If you change your API to return these, they would go here. */}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2>Results ({total} total)</h2>
      
      {selectedRecipe && <DetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}

      {total === 0 && <p>No recipes found matching your criteria.</p>}
      
      {/* Recipe Grid */}
      <div style={styles.grid}>
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            style={{
              ...styles.card,
              ...(hoveredId === recipe.id ? styles.cardHover : {})
            }}
            onClick={() => setSelectedRecipe(recipe)}
            onMouseEnter={() => setHoveredId(recipe.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div>
                <h3>{recipe.title}</h3>
                <p style={{ fontSize: '0.9em', color: '#555' }}>{recipe.cuisine}</p>
                <p>
                    **{recipe.rating || 'N/A'}** Rating 
                    | {recipe.total_time} mins
                </p>
                <p style={{ fontSize: '0.8em', color: '#888' }}>
                    {recipe.calories ? `${recipe.calories} calories` : 'Calories N/A'}
                </p>
            </div>
            <div style={{ alignSelf: 'flex-end', fontSize: '0.8em', color: '#007bff' }}>
                 ;
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {total > 0 && (
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button onClick={handlePrev} disabled={page === 1} style={{ padding: '10px 20px' }}>
            &larr; Previous Page
          </button>
          <span style={{ margin: '0 20px', fontWeight: 'bold' }}>
            Page {page} of {totalPages}
          </span>
          <button onClick={handleNext} disabled={page === totalPages} style={{ padding: '10px 20px' }}>
            Next Page &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeList;