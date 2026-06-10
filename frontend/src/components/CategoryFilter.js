import React from 'react';

function CategoryFilter({ categories, onCategorySelect, selectedCategory }) {
  return (
    <div className="md:bg-white md:rounded-2xl md:p-5 md:border md:border-slate-200/80 md:shadow-xs w-full">
      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 hidden md:block select-none text-left">
        Categories
      </h3>

      {/* Category List */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none w-full -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
        {/* All News Chip */}
        <button
          onClick={() => onCategorySelect(null)}
          className={`flex-shrink-0 flex items-center px-4 py-2 md:py-2.5 text-xs md:text-sm font-semibold rounded-full border transition-all duration-200 cursor-pointer select-none text-left ${
            !selectedCategory
              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          📰 All News
        </button>

        {/* Category Chips */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`flex-shrink-0 flex items-center px-4 py-2 md:py-2.5 text-xs md:text-sm font-semibold rounded-full border transition-all duration-200 cursor-pointer select-none text-left ${
              selectedCategory === category.id
                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span 
              className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 flex-shrink-0" 
              style={{ backgroundColor: category.color || '#94a3b8' }}
            ></span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Trending Topics (Desktop only) */}
      <div className="hidden md:block border-t border-slate-100 pt-5 mt-4">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 select-none text-left">
          🔥 Trending Topics
        </h4>
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer text-left">#CommunityFestival</div>
          <div className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer text-left">#LocalSports</div>
          <div className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer text-left">#BusinessNews</div>
          <div className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer text-left">#Education</div>
        </div>
      </div>
    </div>
  );
}

export default CategoryFilter;
