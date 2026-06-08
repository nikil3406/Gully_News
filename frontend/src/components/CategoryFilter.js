import React from 'react';

function CategoryFilter({ categories, onCategorySelect, selectedCategory }) {
  return (
    <div className="categoryfilter__sidebar" style={styles.sidebar}>
      <h3 className="categoryfilter__title" style={styles.title}>Categories</h3>

      {/* Mobile dropdown */}
      <div className="categoryfilter__dropdownWrap">
        <select
          className="categoryfilter__dropdown"
          value={selectedCategory ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onCategorySelect(val === '' ? null : Number(val));
          }}
          aria-label="Filter by category"
          style={styles.dropdown}
        >
          <option value="">📰 All News</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop list (hidden on mobile) */}
      <div className="categoryfilter__categoryList categoryfilter__desktopOnly" style={styles.categoryList}>

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


      <div className="categoryfilter__trendingSection categoryfilter__desktopOnly" style={styles.trendingSection}>

        <h4 className="categoryfilter__subtitle" style={styles.subtitle}>🔥 Trending Topics</h4>


          <div className="categoryfilter__trendingItem" style={styles.trendingItem}>#CommunityFestival</div>
          <div className="categoryfilter__trendingItem" style={styles.trendingItem}>#LocalSports</div>
          <div className="categoryfilter__trendingItem" style={styles.trendingItem}>#BusinessNews</div>
          <div className="categoryfilter__trendingItem" style={styles.trendingItem}>#Education</div>
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
  dropdownWrap: {
    marginBottom: '20px',
  },
  dropdown: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #e1e5e9',
    backgroundColor: '#fff',
    fontSize: '13px',
    color: '#333',
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

export default CategoryFilter;
