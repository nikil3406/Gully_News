import React from 'react';

function CategoryFilter({ categories, onCategorySelect, selectedCategory }) {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Desktop sidebar wrapper */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e7e5e4',
          borderRadius: 16,
          padding: 18,
          boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        }}
        className="hidden md:block"
      >
        <h3 style={{
          margin: '0 0 14px 0',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#94a3b8',
          fontFamily: 'var(--font-sans)',
        }}>
          Browse Topics
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* All News */}
          <CategoryButton
            label="All News"
            isActive={!selectedCategory}
            onClick={() => onCategorySelect(null)}
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M7 9h10M7 12h7M7 15h5"/>
              </svg>
            }
            color="#d97706"
          />

          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              label={category.name}
              isActive={selectedCategory === category.id}
              onClick={() => onCategorySelect(category.id)}
              color={category.color || '#94a3b8'}
              dot
            />
          ))}
        </div>

        {/* Trending section */}
        <div style={{ borderTop: '1px solid #f5f4f2', marginTop: 16, paddingTop: 16 }}>
          <h4 style={{
            margin: '0 0 10px 0',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-sans)',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b">
              <path d="M12 2c0 6-6 8-6 14a6 6 0 0012 0c0-6-6-8-6-14z"/>
              <path d="M12 12c0 3-2 4-2 7a2 2 0 004 0c0-3-2-4-2-7z" fill="#fcd34d"/>
            </svg>
            Trending
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {['#CommunityFestival', '#LocalSports', '#BusinessNews', '#Education'].map((tag) => (
              <div
                key={tag}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#475569',
                  background: '#fafaf9',
                  border: '1px solid #f0ede9',
                  borderRadius: 8,
                  padding: '7px 11px',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fef3c7'; e.currentTarget.style.color = '#d97706'; e.currentTarget.style.borderColor = '#fde68a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fafaf9'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#f0ede9'; }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isMobile && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 8,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <MobileChip
            label="All"
            isActive={!selectedCategory}
            onClick={() => onCategorySelect(null)}
            color="#d97706"
          />
          {categories.map((category) => (
            <MobileChip
              key={category.id}
              label={category.name}
              isActive={selectedCategory === category.id}
              onClick={() => onCategorySelect(category.id)}
              color={category.color || '#94a3b8'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryButton({ label, isActive, onClick, color, icon, dot }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        width: '100%',
        padding: '8px 11px',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: isActive ? 700 : 600,
        textAlign: 'left',
        transition: 'all 0.18s',
        background: isActive ? '#0f172a' : hovered ? '#fafaf9' : 'transparent',
        color: isActive ? '#ffffff' : hovered ? '#0f172a' : '#475569',
      }}
    >
      {dot && (
        <span style={{
          width: 8, height: 8,
          borderRadius: '50%',
          background: isActive ? '#fbbf24' : color,
          flexShrink: 0,
          transition: 'background 0.18s',
        }} />
      )}
      {icon && (
        <span style={{ color: isActive ? '#fbbf24' : color, display: 'flex' }}>
          {icon}
        </span>
      )}
      {label}
    </button>
  );
}

function MobileChip({ label, isActive, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '6px 14px',
        borderRadius: 999,
        border: '1.5px solid',
        borderColor: isActive ? '#0f172a' : '#e7e5e4',
        background: isActive ? '#0f172a' : '#ffffff',
        color: isActive ? '#ffffff' : '#475569',
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
        transition: 'all 0.18s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

export default CategoryFilter;
