import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import ArticleCard from '../components/ArticleCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { fetchPosts, fetchCategories, deletePost } from '../services/postService';

function NewsFeed() {
  const useMediaQuery = (query) => {
    const getMatches = () => {
      if (typeof window === 'undefined') return false;
      return window.matchMedia(query).matches;
    };
    const [matches, setMatches] = React.useState(getMatches());
    React.useEffect(() => {
      const mql = window.matchMedia(query);
      const onChange = () => setMatches(mql.matches);
      onChange();
      if (mql.addEventListener) mql.addEventListener('change', onChange);
      else mql.addListener(onChange);
      return () => {
        if (mql.removeEventListener) mql.removeEventListener('change', onChange);
        else mql.removeListener(onChange);
      };
    }, [query]);
    return matches;
  };

  const [articles, setArticles] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  const sentinelRef = useRef(null);
  const isMobileOrTablet = useMediaQuery('(max-width: 768px)');

  const filtersRef = useRef({ selectedCategory, searchTerm });
  useEffect(() => { filtersRef.current = { selectedCategory, searchTerm }; }, [selectedCategory, searchTerm]);

  useEffect(() => {
    socket.connect();

    const handlePostCreated = (newPost) => {
      const { selectedCategory: currentCat, searchTerm: currentSearch } = filtersRef.current;
      const matchesCategory = !currentCat || parseInt(newPost.category_id, 10) === parseInt(currentCat, 10);
      const matchesSearch = !currentSearch ||
        (newPost.title && newPost.title.toLowerCase().includes(currentSearch.toLowerCase())) ||
        (newPost.content && newPost.content.toLowerCase().includes(currentSearch.toLowerCase()));
      if (matchesCategory && matchesSearch) {
        setArticles(prev => {
          if (prev.some(p => p.id === newPost.id)) return prev;
          return [newPost, ...prev];
        });
      }
    };

    const handlePostDeleted = (deletedPostId) => setArticles(prev => prev.filter(p => p.id !== deletedPostId));
    const handleLikesUpdated = ({ id, likes_count }) => setArticles(prev => prev.map(p => p.id === id ? { ...p, likes_count } : p));
    const handleViewsUpdated = ({ id, views_count }) => setArticles(prev => prev.map(p => p.id === id ? { ...p, views_count } : p));
    const handleCommentsUpdated = ({ id, comments_count }) => setArticles(prev => prev.map(p => p.id === id ? { ...p, comments_count } : p));

    socket.on('post_created', handlePostCreated);
    socket.on('post_deleted', handlePostDeleted);
    socket.on('post_likes_updated', handleLikesUpdated);
    socket.on('post_views_updated', handleViewsUpdated);
    socket.on('post_comments_updated', handleCommentsUpdated);

    return () => {
      socket.off('post_created', handlePostCreated);
      socket.off('post_deleted', handlePostDeleted);
      socket.off('post_likes_updated', handleLikesUpdated);
      socket.off('post_views_updated', handleViewsUpdated);
      socket.off('post_comments_updated', handleCommentsUpdated);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        setCurrentUserId(decoded.userId);
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  const fetchArticles = useCallback(async (cursorVal = null, shouldAppend = false) => {
    if (shouldAppend) setLoadingMore(true);
    else setLoading(true);

    try {
      const data = await fetchPosts({
        cursor: cursorVal,
        limit: 5,
        categoryId: selectedCategory,
        search: searchTerm,
      });
      await new Promise(resolve => setTimeout(resolve, 400));
      if (shouldAppend) {
        setArticles(prev => [...prev, ...(data.posts || [])]);
      } else {
        setArticles(data.posts || []);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => { fetchArticles(null, false); }, [fetchArticles]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
            fetchArticles(nextCursor, true);
          }
        });
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => { if (sentinel) observer.unobserve(sentinel); };
  }, [hasMore, loadingMore, loading, nextCursor, fetchArticles]);

  const handleCategorySelect = (categoryId) => setSelectedCategory(categoryId);
  const handleSearch = (term) => setSearchTerm(term);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(postId);
      setArticles(prev => prev.filter(article => article.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      alert(err.message || 'Failed to delete post.');
    }
  };

  // Loading screen
  if (loading && articles.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Animated logo */}
          <div style={{
            width: 50, height: 50, background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37,99,235,0.30)',
            animation: 'bounceSubtle 2s infinite ease-in-out',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="#ffffff" strokeWidth="2"/>
              <path d="M7 9h10M7 12h7M7 15h5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>
              Gully <span style={{ color: '#2563eb' }}>News</span>
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              Loading your local feed...
            </p>
          </div>
          {/* Skeleton cards */}
          <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#ffffff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0' }}>
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 10, width: '90%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 10, width: '75%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--font-sans)' }}>
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        showCategoryDropdown={isMobileOrTablet}
      />

      <div style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: isMobileOrTablet ? '16px 12px' : '24px 20px',
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
      }}>

        {/* Desktop Sidebar */}
        {!isMobileOrTablet && (
          <aside style={{
            width: 260,
            flexShrink: 0,
            position: 'sticky',
            top: 80,
            height: 'fit-content',
          }}>
            {/* Write CTA */}
            {isAuthenticated && (
              <button
                onClick={() => navigate('/create-post')}
                style={{
                  width: '100%',
                  padding: '11px 0',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 14,
                  boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.25)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Write a Story
              </button>
            )}

            <SearchBar onSearch={handleSearch} />
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              trendingPosts={articles}
            />
          </aside>
        )}

        {/* Main Feed */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Mobile search + filter strip */}
          {isMobileOrTablet && (
            <div style={{ marginBottom: 14 }}>
              <SearchBar onSearch={handleSearch} />
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                trendingPosts={articles}
              />
            </div>
          )}

          {/* Feed header row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: '#0f172a',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '-0.4px',
              }}>
                {selectedCategory
                  ? categories.find(c => c.id === selectedCategory)?.name || 'Category'
                  : searchTerm
                    ? `Results for "${searchTerm}"`
                    : 'Latest Stories'}
              </h1>
            </div>

            {/* Live indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, color: '#22c55e',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 999, padding: '4px 10px',
              fontFamily: 'var(--font-sans)',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 0 2px rgba(34,197,94,0.25)',
                animation: 'bounceSubtle 2s infinite',
                display: 'inline-block',
              }} />
              Live
            </div>
          </div>

          {/* Articles or empty state */}
          {articles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗞️</div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-sans)' }}>
                No stories found
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>
                Try a different search or category
              </p>
            </div>
          ) : (
            <>
              <div>
                {articles.map((article, index) => (
                  <div
                    key={article.id}
                    style={{
                      animation: 'slideUp 0.35s ease both',
                      animationDelay: `${Math.min(index, 4) * 40}ms`,
                    }}
                  >
                    <ArticleCard
                      article={article}
                      currentUserId={currentUserId}
                      onDelete={handleDeletePost}
                    />
                  </div>
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              {hasMore && (
                <div ref={sentinelRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0 24px' }}>
                  {loadingMore && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 26, height: 26,
                        border: '2.5px solid #e2e8f0',
                        borderTopColor: '#2563eb',
                        borderRadius: '50%',
                        animation: 'spin 0.75s linear infinite',
                      }} />
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>Loading more...</p>
                    </div>
                  )}
                </div>
              )}

              {!hasMore && articles.length > 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '16px 0 32px',
                  fontSize: 12,
                  color: '#94a3b8',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                  <span style={{ flex: 1, height: 1, background: '#e2e8f0', maxWidth: 60 }} />
                  You've read it all
                  <span style={{ flex: 1, height: 1, background: '#e2e8f0', maxWidth: 60 }} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default NewsFeed;
