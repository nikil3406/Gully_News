import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import ArticleCard from '../components/ArticleCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';

import { useNavigate } from 'react-router-dom';

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

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    // Decode JWT to get user ID
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

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/posts/categories');
        if (res.ok) {
          const cats = await res.json();
          setCategories(cats);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const fetchArticles = useCallback(async (cursorVal = null, shouldAppend = false) => {
    if (shouldAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = token;
      }

      const params = new URLSearchParams();
      params.append('limit', '5');
      if (selectedCategory) {
        params.append('category_id', selectedCategory.toString());
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (cursorVal) {
        params.append('cursor', cursorVal);
      }

      const res = await fetch(`http://localhost:5000/api/posts?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        // Add delay for demo purposes to show loading state
        await new Promise(resolve => setTimeout(resolve, 500));
        // data structure: { posts: [], nextCursor: "", hasMore: boolean }
        if (shouldAppend) {
          setArticles(prev => [...prev, ...data.posts]);
        } else {
          setArticles(data.posts);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, searchTerm]);

  // Fetch articles on filter change
  useEffect(() => {
    fetchArticles(null, false);
  }, [fetchArticles]);

  // Setup Intersection Observer for infinite scroll
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
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, loadingMore, loading, nextCursor, fetchArticles]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      if (response.ok) {
        // Remove the deleted post from articles
        setArticles(prev => prev.filter(article => article.id !== postId));
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  if (loading && articles.length === 0) {
    return (
      <div style={styles.loading}>
        <div>Loading Gully News...</div>
      </div>
    );
  }

  return (
    <div className="newsfeed" style={styles.container}>
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        showCategoryDropdown={isMobileOrTablet}
      />
      
      <div className="newsfeed__mainContent" style={styles.mainContent}>

        <div className="newsfeed__sidebar" style={styles.sidebar}>

          {/* On mobile/tablet, hide the body search + create section (header handles category/search UI) */}
          {!isMobileOrTablet && (
            <>
              {isAuthenticated && (
                <div style={styles.createPostSection}>
                  <button
                    style={styles.createPostButton}
                    onClick={() => navigate('/create-post')}
                  >
                    ✍️ Create New Post
                  </button>
                </div>
              )}

              <SearchBar onSearch={handleSearch} />
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
              />
            </>
          )}
        </div>
        
        <div className="newsfeed__content" style={styles.content}>
          {articles.length === 0 ? (
            <div style={styles.noResults}>
              <h3>No articles found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {articles.map(article => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  currentUserId={currentUserId}
                  onDelete={handleDeletePost}
                />
              ))}
              
              {hasMore && (
                <div ref={sentinelRef} style={styles.sentinel}>
                  {loadingMore && (
                    <div style={styles.loadingIndicator}>
                      <div style={styles.spinner}></div>
                      <p>Loading more articles...</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px',
    display: 'flex',
    gap: '16px',
  },
  sidebar: {
    width: '280px',
    position: 'sticky',
    top: '80px',
    height: 'fit-content',
    display: 'block',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '16px',
  },
  noResults: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  createPostSection: {
    marginBottom: '16px',
  },
  createPostButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
  },
  sentinel: {
    height: '100px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '30px 0',
  },
  loadingIndicator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e9ecef',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default NewsFeed;

