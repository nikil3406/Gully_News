import React from 'react';

function CategoryFilter({ categories, onCategorySelect, selectedCategory, trendingPosts = [] }) {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);

  const topTrendingPosts = React.useMemo(() => {
    if (!Array.isArray(trendingPosts) || trendingPosts.length === 0) return [];

    return [...trendingPosts]
      .sort((a, b) => {
        const viewDiff = (Number(b.views_count) || 0) - (Number(a.views_count) || 0);
        if (viewDiff !== 0) return viewDiff;

        const likeDiff = (Number(b.likes_count) || 0) - (Number(a.likes_count) || 0);
        if (likeDiff !== 0) return likeDiff;

        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      })
      .slice(0, 4);
  }, [trendingPosts]);

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
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 18,
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
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
            color="#2563eb"
          />

          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              label={category.name}
              isActive={selectedCategory === category.id}
              onClick={() => onCategorySelect(category.id)}
              color={category.color || '#2563eb'}
              dot
            />
          ))}
        </div>

        {/* Trending section */}
        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 16, paddingTop: 16 }}>
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
              <path d="M12 12c0 3-2 4-2 7a2 2 0 004 0c0-3-2-4-2-7z" fill="#fde68a"/>
            </svg>
            Trending
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topTrendingPosts.length > 0 ? (
              topTrendingPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#475569',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '8px 11px',
                    transition: 'all 0.25s ease',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                    {post.title ? post.title.slice(0, 44) + (post.title.length > 44 ? '…' : '') : 'Untitled post'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                    {Number(post.views_count || 0)} views · {Number(post.likes_count || 0)} likes
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'var(--font-sans)' }}>
                No trending posts yet.
              </div>
            )}
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
            color="#2563eb"
          />
          {categories.map((category) => (
            <MobileChip
              key={category.id}
              label={category.name}
              isActive={selectedCategory === category.id}
              onClick={() => onCategorySelect(category.id)}
              color={category.color || '#2563eb'}
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
        transition: 'all 0.25s ease',
        background: isActive ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : hovered ? '#eef4ff' : 'transparent',
        color: isActive ? '#ffffff' : hovered ? '#2563eb' : '#475569',
        boxShadow: isActive ? '0 2px 6px rgba(37,99,235,0.20)' : 'none',
      }}
    >
      {dot && (
        <span style={{
          width: 8, height: 8,
          borderRadius: '50%',
          background: isActive ? '#f59e0b' : color,
          flexShrink: 0,
          transition: 'background 0.2s',
        }} />
      )}
      {icon && (
        <span style={{ color: isActive ? '#f59e0b' : color, display: 'flex' }}>
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
        borderColor: isActive ? '#2563eb' : '#e2e8f0',
        background: isActive ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#ffffff',
        color: isActive ? '#ffffff' : '#475569',
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        whiteSpace: 'nowrap',
        boxShadow: isActive ? '0 2px 6px rgba(37,99,235,0.20)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

export default CategoryFilter;
