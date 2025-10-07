// src/components/SearchBar.jsx
import React, { useState } from 'react';

const SearchBar = ({ onSearch, initialFilters }) => {
  const [formFilters, setFormFilters] = useState(initialFilters);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(formFilters);
  };
  
  const handleClear = () => {
    setFormFilters({});
    onSearch({}); 
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        
        {/* Title Filter (Text) */}
        <input
          type="text"
          name="title"
          placeholder="Title (e.g., pie)"
          value={formFilters.title || ''}
          onChange={handleChange}
        />
        
        {/* Cuisine Filter (Text) */}
        <input
          type="text"
          name="cuisine"
          placeholder="Cuisine (e.g., Southern Recipes)"
          value={formFilters.cuisine || ''}
          onChange={handleChange}
        />

        {/* Rating Filter (Accepts operators like >=4.5) */}
        <input
          type="text"
          name="rating"
          placeholder="Rating (e.g., >=4.5)"
          value={formFilters.rating || ''}
          onChange={handleChange}
        />
        
        {/* Total Time Filter (Accepts operators like <=120) */}
        <input
          type="text"
          name="total_time"
          placeholder="Max Time (e.g., <=120)"
          value={formFilters.total_time || ''}
          onChange={handleChange}
        />
        
        {/* Calories Filter (Accepts operators like <=400) */}
        <input
          type="text"
          name="calories"
          placeholder="Max Calories (e.g., <=400)"
          value={formFilters.calories || ''}
          onChange={handleChange}
        />
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button type="submit">Search Recipes</button>
        <button type="button" onClick={handleClear} style={{ marginLeft: '10px' }}>Clear Filters</button>
      </div>
    </form>
  );
};

export default SearchBar;