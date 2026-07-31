import React, { useState, useEffect, useRef } from 'react';

function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isActive, setIsActive] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (onSearch) onSearch(searchTerm);
    }, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchTerm, onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm);
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      style={{ width: '100%', marginBottom: 14 }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff',
        border: `1.5px solid ${isActive ? '#0f172a' : '#e7e5e4'}`,
        borderRadius: 12,
        padding: '0 12px',
        height: 40,
        gap: 8,
        transition: 'all 0.18s',
        boxShadow: isActive ? '0 0 0 3px rgba(15,23,42,0.06)' : 'none',
      }}>
        <span style={{ color: '#94a3b8', display: 'flex', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search news, topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            color: '#0f172a',
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', display: 'flex', padding: 2, flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            title="Clear search"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}

export default SearchBar;
