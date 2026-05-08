import React, { useState } from 'react';

function CategoryFilter({ categories, onCategorySelect, selectedCategory }) {
  return (
    <div style={styles.sidebar}>
      <h3 style={styles.title}>Categories</h3>
      <div style={styles.categoryList}>
        <button
          style={!selectedCategory ? styles.activeCategory : styles.category}
          onClick={() => onCategorySelect(null)}
        >
          📰 All News
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            style={selectedCategory === category.id ? styles.activeCategory : styles.category}
            onClick={() => onCategorySelect(category.id)}
          >
            <span style={{ color: category.color }}>●</span> {category.name}
          </button>
        ))}
      </div>
      
      <div style={styles.trendingSection}>
        <h4 style={styles.subtitle}>🔥 Trending Topics</h4>
        <div style={styles.trendingList}>
          <div style={styles.trendingItem}>#CommunityFestival</div>
          <div style={styles.trendingItem}>#LocalSports</div>
          <div style={styles.trendingItem}>#BusinessNews</div>
          <div style={styles.trendingItem}>#Education</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    height: 'fit-content',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  categoryList: {
    marginBottom: '25px',
  },
  category: {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '4px',
    marginBottom: '5px',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  activeCategory: {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '4px',
    marginBottom: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  trendingSection: {
    borderTop: '1px solid #e1e5e9',
    paddingTop: '20px',
  },
  trendingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  trendingItem: {
    backgroundColor: '#f8f9fa',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#666',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default CategoryFilter;
