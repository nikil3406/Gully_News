import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import ArticleCard from '../components/ArticleCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';

import { useNavigate } from 'react-router-dom';

function NewsFeed() {
  const [articles, setArticles] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
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

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  if (loading && articles.length === 0) {
    return (
      <div style={styles.loading}>
        <div>Loading Gully News...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header />
      
      <div style={styles.mainContent}>
        <div style={styles.sidebar}>
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
        </div>
        
        <div style={styles.content}>
          {articles.length === 0 ? (
            <div style={styles.noResults}>
              <h3>No articles found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
              
              {hasMore && (
                <div style={styles.loadMoreContainer}>
                  <button 
                    className="load-more-btn"
                    onClick={() => fetchArticles(nextCursor, true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
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
    padding: '20px',
    display: 'flex',
    gap: '20px',
  },
  sidebar: {
    width: '280px',
    position: 'sticky',
    top: '80px',
    height: 'fit-content',
  },
  content: {
    flex: 1,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
  },
  noResults: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  createPostSection: {
    marginBottom: '20px',
  },
  createPostButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
  },
  loadMoreContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '25px',
    marginBottom: '40px',
  },
};

export default NewsFeed;
