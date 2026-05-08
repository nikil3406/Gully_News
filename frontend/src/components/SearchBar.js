import React, { useState } from 'react';

function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.searchForm}>
      <input
        type="text"
        placeholder="Search local news, events, topics..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchInput}
      />
      <button type="submit" style={styles.searchButton}>
        🔍 Search
      </button>
    </form>
  );
}

const styles = {
  searchForm: {
    display: 'flex',
    marginBottom: '20px',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e1e5e9',
    borderRadius: '25px 0 0 25px',
    outline: 'none',
    fontSize: '14px',
    transition: 'border-color 0.2s',
  },
  searchButton: {
    padding: '12px 20px',
    border: '2px solid #007bff',
    borderLeft: 'none',
    borderRadius: '0 25px 25px 0',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
};

export default SearchBar;
