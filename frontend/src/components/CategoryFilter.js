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
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    height: 'fit-content',
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
    margin: '0 0 8px 0',
  },
  categoryList: {
    marginBottom: '20px',
  },
  category: {
    display: 'block',
    width: '100%',
    padding: '9px 10px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '4px',
    marginBottom: '4px',
    fontSize: '13px',
    transition: 'background-color 0.2s',
  },
  activeCategory: {
    display: 'block',
    width: '100%',
    padding: '9px 10px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '4px',
    marginBottom: '4px',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  trendingSection: {
    borderTop: '1px solid #e1e5e9',
    paddingTop: '16px',
  },
  trendingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  trendingItem: {
    backgroundColor: '#f8f9fa',
    padding: '7px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#666',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

// Responsive styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @media (max-width: 768px) {
    [class*="sidebar"] {
      padding: 12px;
    }
    [class*="trendingSection"] {
      padding-top: 12px;
    }
  }

  @media (max-width: 480px) {
    [class*="sidebar"] {
      padding: 12px;
      background-color: transparent;
      box-shadow: none;
      border-radius: 0;
    }
    [class*="title"] {
      font-size: 14px;
      font-weight: bold;
    }
    [class*="categoryList"] {
      margin-bottom: 16px;
    }
  }
`;
if (!document.querySelector('[data-categoryfilter-styles]')) {
  styleSheet.setAttribute('data-categoryfilter-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default CategoryFilter;
