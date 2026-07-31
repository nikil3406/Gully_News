import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toggleLikePost } from '../services/postService';
import { formatDate } from '../utils/dateFormatter';

const getUserColor = (username) => {
  if (!username) return '#d97706';
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 42%)`;
};

const CATEGORY_COLORS = {
  Politics: '#dc2626',
  Sports:   '#2563eb',
  Business: '#059669',
  Health:   '#7c3aed',
  Tech:     '#0891b2',
  Crime:    '#9f1239',
  Weather:  '#0284c7',
  default:  '#d97706',
};

function getCategoryColor(category) {
  if (!category) return CATEGORY_COLORS.default;
  const key = Object.keys(CATEGORY_COLORS).find(k => category.toLowerCase().includes(k.toLowerCase()));
  return key ? CATEGORY_COLORS[key] : CATEGORY_COLORS.default;
}

function ArticleCard({ article, currentUserId, onDelete }) {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const isPostCreator = currentUserId && article.user_id === currentUserId;
  const [likesCount, setLikesCount] = useState(article.likes_count || 0);
  const [isLiked, setIsLiked] = useState(article.is_liked_by_user || false);
  const [viewsCount, setViewsCount] = useState(article.views_count || 0);
  const [cardHovered, setCardHovered] = useState(false);

  useEffect(() => { setLikesCount(article.likes_count || 0); }, [article.likes_count]);
  useEffect(() => { setViewsCount(article.views_count || 0); }, [article.views_count]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      const data = await toggleLikePost(article.id);
      setIsLiked(data.liked);
      if (data.likes_count !== null) setLikesCount(data.likes_count);
    } catch (error) {
      console.error('Failed to toggle like', error);
    }
  };

  const navigateToDetail = () => navigate(`/post/${article.id}`);

  const handleOpenProfile = (e, userId) => {
    e.stopPropagation();
    if (userId) navigate(`/profile/${userId}`);
  };

  const catColor = getCategoryColor(article.category);

  return (
    <article
      style={{
        background: '#ffffff',
        border: '1px solid',
        borderColor: cardHovered ? '#d4d0cc' : '#e7e5e4',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        transform: cardHovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: cardHovered
          ? '0 8px 30px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)'
          : '0 1px 3px rgba(15,23,42,0.06), 0 2px 8px rgba(15,23,42,0.03)',
        transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        cursor: 'default',
        fontFamily: 'var(--font-sans)',
      }}
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      {/* Image with gradient overlay */}
      {article.image_url && (
        <div
          style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', height: 220 }}
          onClick={navigateToDetail}
        >
          <img
            src={article.image_url}
            alt={article.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.5s ease',
              transform: cardHovered ? 'scale(1.03)' : 'scale(1)',
            }}
          />
          {/* Gradient overlay at bottom */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 80,
            background: 'linear-gradient(to top, rgba(15,23,42,0.45) 0%, transparent 100%)',
          }} />
          {/* Category badge over image */}
          {article.category && (
            <div style={{
              position: 'absolute',
              top: 12, left: 12,
              background: 'rgba(255,255,255,0.96)',
              border: `1.5px solid ${catColor}22`,
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: catColor,
              backdropFilter: 'blur(4px)',
            }}>
              {article.category}
            </div>
          )}
        </div>
      )}

      {/* Card content */}
      <div style={{ padding: '16px 18px 14px' }}>

        {/* Tags row (no image case) */}
        {!article.image_url && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {article.category && (
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: catColor,
                background: catColor + '12',
                border: `1px solid ${catColor}28`,
                borderRadius: 999, padding: '3px 10px',
              }}>
                {article.category}
              </span>
            )}
            {article.city && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: '#64748b',
                background: '#f5f4f2', border: '1px solid #e7e5e4',
                borderRadius: 999, padding: '3px 10px',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2"/>
                </svg>
                {article.city}
              </span>
            )}
            {article.distance_km !== undefined && article.distance_km !== null && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#059669',
                background: '#ecfdf5', border: '1px solid #a7f3d0',
                borderRadius: 999, padding: '3px 10px',
              }}>
                {parseFloat(article.distance_km).toFixed(1)} km away
              </span>
            )}
          </div>
        )}

        {/* City badge below image */}
        {article.image_url && (article.city || (article.distance_km !== undefined && article.distance_km !== null)) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {article.city && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: '#64748b',
                background: '#f5f4f2', border: '1px solid #e7e5e4',
                borderRadius: 999, padding: '3px 10px',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2"/>
                </svg>
                {article.city}
              </span>
            )}
            {article.distance_km !== undefined && article.distance_km !== null && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#059669',
                background: '#ecfdf5', border: '1px solid #a7f3d0',
                borderRadius: 999, padding: '3px 10px',
              }}>
                {parseFloat(article.distance_km).toFixed(1)} km away
              </span>
            )}
          </div>
        )}

        {/* Headline */}
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: 17,
            fontWeight: 800,
            lineHeight: 1.35,
            color: cardHovered ? '#d97706' : '#0f172a',
            cursor: 'pointer',
            transition: 'color 0.2s',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-0.3px',
          }}
          onClick={navigateToDetail}
        >
          {article.title}
        </h3>

        {/* Excerpt */}
        <p style={{
          margin: '0 0 14px 0',
          fontSize: 13.5,
          lineHeight: 1.65,
          color: '#475569',
          fontFamily: 'var(--font-sans)',
        }}>
          {article.content && article.content.length > 140
            ? <>
                {article.content.substring(0, 140)}...{' '}
                <button
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: '#d97706', fontWeight: 700, fontSize: 13.5,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    textDecoration: 'underline', textDecorationColor: '#fbbf2480',
                    textUnderlineOffset: 2,
                  }}
                  onClick={navigateToDetail}
                >
                  Read more
                </button>
              </>
            : article.content}
        </p>

        {/* Byline row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 12,
          marginBottom: 12,
          borderBottom: '1px solid #f5f4f2',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Author avatar */}
            {article.author_image ? (
              <img
                src={article.author_image}
                alt={article.author}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  objectFit: 'cover', border: '1.5px solid #e7e5e4',
                  flexShrink: 0,
                }}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: getUserColor(article.author),
                color: '#fff', fontSize: 11, fontWeight: 800,
                display: article.author_image ? 'none' : 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, textTransform: 'uppercase',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {article.author ? article.author[0] : '?'}
            </div>

            <div>
              {article.user_id ? (
                <button
                  type="button"
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontWeight: 700, fontSize: 12, color: '#334155',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'color 0.18s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#d97706'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#334155'}
                  onClick={(e) => handleOpenProfile(e, article.user_id)}
                >
                  {article.author}
                </button>
              ) : (
                <span style={{ fontWeight: 700, fontSize: 12, color: '#334155', fontFamily: 'var(--font-sans)' }}>
                  {article.author}
                </span>
              )}
              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6, fontFamily: 'var(--font-sans)' }}>
                · {formatDate(article.created_at)}
              </span>
            </div>
          </div>

          {isPostCreator && onDelete && (
            <button
              style={{
                background: 'none', border: '1px solid transparent',
                borderRadius: 8, padding: '3px 8px',
                color: '#ef4444', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.18s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.borderColor = '#fca5a5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
              onClick={(e) => { e.stopPropagation(); onDelete(article.id); }}
              title="Delete this post"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
              </svg>
              Delete
            </button>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Views */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, color: '#94a3b8',
            background: '#f5f4f2', border: '1px solid #e7e5e4',
            borderRadius: 999, padding: '4px 10px',
            fontFamily: 'var(--font-sans)',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {viewsCount}
          </span>

          {/* Like button */}
          {isAuthenticated ? (
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700,
                color: isLiked ? '#e11d48' : '#64748b',
                background: isLiked ? '#fff1f2' : '#ffffff',
                border: `1px solid ${isLiked ? '#fecdd3' : '#e7e5e4'}`,
                borderRadius: 999, padding: '4px 10px',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 0.18s',
              }}
              onClick={handleLike}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              {likesCount}
            </button>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, color: '#94a3b8',
              background: '#f5f4f2', border: '1px solid #e7e5e4',
              borderRadius: 999, padding: '4px 10px',
              fontFamily: 'var(--font-sans)',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              {likesCount}
            </span>
          )}

          {/* Comments */}
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, color: '#64748b',
              background: '#ffffff', border: '1px solid #e7e5e4',
              borderRadius: 999, padding: '4px 10px',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f4f2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
            onClick={navigateToDetail}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {article.comments_count}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ArticleCard;
