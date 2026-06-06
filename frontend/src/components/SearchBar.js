import React, { useState, useEffect, useRef } from 'react';

function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isActive, setIsActive] = useState(false);
  const debounceTimer = useRef(null);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 300); // 300ms delay

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Immediate search on submit (bypass debounce)
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.searchForm}>
      <div style={styles.searchWrapper}>
        <div style={{
          ...styles.searchInputContainer,
          borderColor: isActive ? '#007bff' : '#e1e5e9',
        }}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search local news, events, topics..."
            value={searchTerm}
            onChange={handleChange}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            style={styles.searchInput}
          />
          <button
            type="button"
            onClick={handleClear}
            style={{
              ...styles.clearButton,
              opacity: searchTerm ? 1 : 0,
              pointerEvents: searchTerm ? 'auto' : 'none',
            }}
            title="Clear search"
          >
            ✕
          </button>
        </div>
        <button type="submit" style={styles.searchButton}>
          Search
        </button>
      </div>
    </form>
  );
}

const styles = {
  searchForm: {
    marginBottom: '16px',
    width: '100%',
  },
  searchWrapper: {
    display: 'flex',
    gap: '0',
    width: '100%',
  },
  searchInputContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    border: '2px solid #e1e5e9',
    borderRadius: '20px 0 0 20px',
    paddingLeft: '12px',
    paddingRight: '6px',
    backgroundColor: '#fff',
    height: '34px',
    transition: 'border-color 0.2s ease',
  },
  searchIcon: {
    fontSize: '14px',
    marginRight: '6px',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    padding: '6px 4px',
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    backgroundColor: 'transparent',
  },
  clearButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px 4px',
    color: '#999',
    transition: 'color 0.2s',
    marginRight: '2px',
    flexShrink: 0,
  },
  searchButton: {
    padding: '6px 10px',
    border: '2px solid #007bff',
    borderLeft: 'none',
    borderRadius: '0 20px 20px 0',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
};

// Responsive styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @media (max-width: 768px) {
    [class*="searchWrapper"] {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    [class*="searchForm"] {
      margin-bottom: 12px;
    }
    [class*="searchInputContainer"] {
      height: 32px;
      padding-left: 10px;
    }
    [class*="searchButton"] {
      padding: 5px 8px;
      font-size: 11px;
    }
  }
`;
if (!document.querySelector('[data-searchbar-styles]')) {
  styleSheet.setAttribute('data-searchbar-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default SearchBar;
