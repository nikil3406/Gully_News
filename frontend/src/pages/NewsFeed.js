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
  useEffect(() => {
    filtersRef.current = { selectedCategory, searchTerm };
  }, [selectedCategory, searchTerm]);

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

    const handlePostDeleted = (deletedPostId) => {
      setArticles(prev => prev.filter(p => p.id !== deletedPostId));
    };

    const handleLikesUpdated = ({ id, likes_count }) => {
      setArticles(prev => prev.map(p => p.id === id ? { ...p, likes_count } : p));
    };

    const handleViewsUpdated = ({ id, views_count }) => {
      setArticles(prev => prev.map(p => p.id === id ? { ...p, views_count } : p));
    };

    const handleCommentsUpdated = ({ id, comments_count }) => {
      setArticles(prev => prev.map(p => p.id === id ? { ...p, comments_count } : p));
    };

    socket.on("post_created", handlePostCreated);
    socket.on("post_deleted", handlePostDeleted);
    socket.on("post_likes_updated", handleLikesUpdated);
    socket.on("post_views_updated", handleViewsUpdated);
    socket.on("post_comments_updated", handleCommentsUpdated);

    return () => {
      socket.off("post_created", handlePostCreated);
      socket.off("post_deleted", handlePostDeleted);
      socket.off("post_likes_updated", handleLikesUpdated);
      socket.off("post_views_updated", handleViewsUpdated);
      socket.off("post_comments_updated", handleCommentsUpdated);
      socket.disconnect();
    };
  }, []);

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
    if (shouldAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchPosts({
        cursor: cursorVal,
        limit: 5,
        categoryId: selectedCategory,
        search: searchTerm,
      });

      // Add delay for demo purposes to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
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
      await deletePost(postId);
      setArticles(prev => prev.filter(article => article.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      alert(err.message || 'Failed to delete post.');
    }
  };

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500 animate-pulse font-medium">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div>Loading Gully News...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        showCategoryDropdown={isMobileOrTablet}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">

        {/* Sidebar (Desktop only) */}
        <div className="hidden md:block w-72 flex-shrink-0 sticky top-24 h-fit z-10 bg-slate-50">
          {isAuthenticated && (
            <div className="mb-4">
              <button
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-full shadow-md shadow-blue-100 hover:shadow-lg transition-all duration-200 cursor-pointer text-center block select-none border-none"
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
        
        {/* Main Content Feed */}
        <div className="flex-grow min-w-0 flex flex-col">
          
          {/* Mobile search, category chips, and create button */}
          {isMobileOrTablet && (
            <div className="flex flex-col gap-3 mb-4 w-full">
              {isAuthenticated && (
                <button
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-full shadow-md shadow-blue-100 hover:shadow-lg transition-all duration-200 cursor-pointer text-center block select-none border-none"
                  onClick={() => navigate('/create-post')}
                >
                  ✍️ Create New Post
                </button>
              )}
              <SearchBar onSearch={handleSearch} />
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
              />
            </div>
          )}

          {articles.length === 0 ? (
            <div className="text-center py-12 px-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <h3 className="text-base font-extrabold text-slate-800 mb-1">No articles found</h3>
              <p className="text-xs text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                {articles.map(article => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    currentUserId={currentUserId}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
              
              {hasMore && (
                <div ref={sentinelRef} className="h-20 flex items-center justify-center my-8">
                  {loadingMore && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-xs text-slate-500">Loading more articles...</p>
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

export default NewsFeed;

