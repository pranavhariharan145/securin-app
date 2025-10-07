// src/components/RecipeSearch.jsx
import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from './SearchBar.jsx'; // Updated import
import RecipeList from './RecipeList.jsx'; // Updated import

const API_BASE_URL = 'http://localhost:3000/api/recipes/search';

const RecipeSearch = () => {
  const [recipes, setRecipes] = useState([]);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch data from your API
  const fetchRecipes = useCallback(async (newFilters = filters, newPage = pagination.page) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    
    // Add pagination params
    queryParams.append('page', newPage);
    queryParams.append('limit', pagination.limit);

    // Add filters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}?${queryParams.toString()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      setRecipes(data.data || []);
      setPagination({ 
        page: data.page, 
        limit: data.limit, 
        total: data.total 
      });

    } catch (e) {
      console.error("Fetch error:", e);
      setError("Failed to fetch recipes. Please check the server connection.");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.page]);

  // Initial load and filter change trigger
  useEffect(() => {
    fetchRecipes(filters, pagination.page);
  }, [fetchRecipes]);

  // Handler for search bar submission (resets to page 1)
  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    setPagination(p => ({ ...p, page: 1 }));
    // No need to call fetchRecipes here if it's in the useEffect dependency array, 
    // but we call it explicitly to make sure the state updates trigger the fetch right away.
    fetchRecipes(newFilters, 1); 
  };

  // Handler for pagination change
  const handlePageChange = (newPage) => {
    setPagination(p => ({ ...p, page: newPage }));
    fetchRecipes(filters, newPage);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Recipe Search</h1>
      
      {/* Search Bar Component */}
      <SearchBar onSearch={handleSearch} initialFilters={filters} />
      
      {/* Status Messages */}
      {loading && <p>Loading recipes...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {/* Results List Component */}
      {!loading && !error && (
        <RecipeList 
          recipes={recipes} 
          pagination={pagination} 
          onPageChange={handlePageChange} 
        />
      )}
    </div>
  );
};

export default RecipeSearch;