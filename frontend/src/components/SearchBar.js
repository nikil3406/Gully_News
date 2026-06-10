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
    <form onSubmit={handleSubmit} className="w-full mb-4 md:mb-6" role="search">
      <div className={`flex w-full items-center border-2 rounded-full pl-4 pr-2 bg-white h-10 shadow-xs transition-colors duration-200 ${isActive ? 'border-blue-500' : 'border-slate-200'}`}>
        <span className="text-sm mr-2 select-none">🔍</span>
        <input
          type="text"
          placeholder="Search local news, events, topics..."
          value={searchTerm}
          onChange={handleChange}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          className="flex-1 py-1.5 border-none outline-none text-sm bg-transparent placeholder-slate-400"
        />
        <button
          type="button"
          onClick={handleClear}
          className={`text-slate-400 hover:text-slate-600 text-xs px-1.5 transition-opacity duration-200 cursor-pointer ${searchTerm ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          title="Clear search"
        >
          ✕
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
