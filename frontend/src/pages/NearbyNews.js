import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import ArticleCard from '../components/ArticleCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { fetchPosts, fetchNearbyPosts, fetchCategories, deletePost } from '../services/postService';
import { filterPostsByCategoryAndSearch } from '../utils/postFilters';

// Client-side Haversine helper to compute distance for socket/real-time posts
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371; // radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function NearbyNews() {
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

  // Geolocation states
  const [userCoords, setUserCoords] = useState(null);
  const [geoPermissionState, setGeoPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'error'
  const [radius, setRadius] = useState(10); // radius in km

  const filtersRef = useRef({ selectedCategory, searchTerm, userCoords, radius });
  useEffect(() => {
    filtersRef.current = { selectedCategory, searchTerm, userCoords, radius };
  }, [selectedCategory, searchTerm, userCoords, radius]);

  // Request user Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      setGeoPermissionState('error');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserCoords(coords);
        setGeoPermissionState('granted');
      },
      (error) => {
        console.warn("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoPermissionState('denied');
        } else {
          setGeoPermissionState('error');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Setup Socket connections
  useEffect(() => {
    socket.connect();

    const handlePostCreated = (newPost) => {
      const { selectedCategory: currentCat, searchTerm: currentSearch, userCoords: currentCoords, radius: currentRadius } = filtersRef.current;
      
      // Filter Category
      const matchesCategory = !currentCat || parseInt(newPost.category_id, 10) === parseInt(currentCat, 10);
      
      // Filter Search
      const matchesSearch = !currentSearch || 
        (newPost.title && newPost.title.toLowerCase().includes(currentSearch.toLowerCase())) ||
        (newPost.content && newPost.content.toLowerCase().includes(currentSearch.toLowerCase()));

      if (matchesCategory && matchesSearch) {
        if (currentCoords) {
          // If Geolocation is active, verify distance and calculate distance_km for client injection
          const postLat = parseFloat(newPost.latitude);
          const postLng = parseFloat(newPost.longitude);
          
          if (!isNaN(postLat) && !isNaN(postLng)) {
            const dist = calculateDistance(currentCoords.latitude, currentCoords.longitude, postLat, postLng);
            if (dist !== null && dist <= currentRadius) {
              const enrichedPost = { ...newPost, distance_km: dist };
              setArticles(prev => {
                if (prev.some(p => p.id === enrichedPost.id)) return prev;
                // Add and sort by distance
                const updated = [...prev, enrichedPost];
                return updated.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
              });
            }
          }
        } else {
          // Fallback (permission denied) - add to top of feed
          setArticles(prev => {
            if (prev.some(p => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
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

  // Check auth
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

  // Fetch categories
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

  // Fetch articles based on permission state
  const fetchArticles = useCallback(async (cursorVal = null, shouldAppend = false) => {
    if (shouldAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      let data;
      if (geoPermissionState === 'granted' && userCoords) {
        data = await fetchNearbyPosts({
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          radius,
          cursor: cursorVal,
          limit: 5,
          categoryId: selectedCategory,
          search: searchTerm,
        });
      } else {
        data = await fetchPosts({
          cursor: cursorVal,
          limit: 5,
          categoryId: selectedCategory,
          search: searchTerm,
        });
      }

      const filteredPosts = filterPostsByCategoryAndSearch(data.posts || [], selectedCategory, searchTerm);

      if (shouldAppend) {
        setArticles(prev => [...prev, ...filteredPosts]);
      } else {
        setArticles(filteredPosts);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [geoPermissionState, userCoords, radius, selectedCategory, searchTerm]);

  // Refetch when filters or coordinates change
  useEffect(() => {
    if (geoPermissionState !== 'prompt') {
      fetchArticles(null, false);
    }
  }, [fetchArticles, geoPermissionState, radius, selectedCategory, searchTerm]);

  // Infinite Scroll
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
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Error deleting post');
    }
  };

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500 animate-pulse font-medium">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div>
            {geoPermissionState === 'prompt' 
              ? 'Requesting location permission...' 
              : 'Finding nearby stories...'}
          </div>
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
          {geoPermissionState === 'granted' && (
            <div className="mb-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left block mb-2">
                📍 Radius Filter
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>
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
          
          {/* Geolocation Fallback Warning Alert Banner */}
          {geoPermissionState !== 'granted' && (
            <div className="bg-amber-50 text-amber-800 border border-amber-200 p-4 rounded-2xl text-xs md:text-sm mb-4 text-left flex items-start gap-3 shadow-xs">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-bold mb-0.5">Location Access Disabled</p>
                <p className="text-amber-700/90 leading-relaxed">
                  {geoPermissionState === 'denied'
                    ? "Location permission was denied. We are displaying the general news feed instead. To view nearby news, enable location access in your browser settings."
                    : "Unable to retrieve your location. Showing general news instead."}
                </p>
              </div>
            </div>
          )}

          {geoPermissionState === 'granted' && userCoords && (
            <div className="bg-emerald-50/50 text-emerald-800 border border-emerald-100 p-4 rounded-2xl text-xs md:text-sm mb-4 text-left flex items-center justify-between shadow-xs select-none">
              <div className="flex items-center gap-3">
                <span className="text-lg animate-bounce">📍</span>
                <div>
                  <p className="font-bold text-slate-800">Showing news near you</p>
                </div>
              </div>
              <div className="hidden sm:block text-emerald-700 bg-emerald-100/60 font-bold px-3 py-1.5 rounded-full text-xs">
                Within {radius} km
              </div>
            </div>
          )}
          
          {/* Mobile search, category chips, and radius selector */}
          {isMobileOrTablet && (
            <div className="flex flex-col gap-3 mb-4 w-full">
              {geoPermissionState === 'granted' && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
                      📍 Radius Filter
                    </label>
                    <select
                      value={radius}
                      onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 outline-none text-xs bg-white cursor-pointer"
                    >
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="25">25 km</option>
                      <option value="50">50 km</option>
                      <option value="100">100 km</option>
                    </select>
                  </div>
                </div>
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
              <h3 className="text-base font-extrabold text-slate-800 mb-1">No nearby news found</h3>
              <p className="text-xs text-slate-500">
                {geoPermissionState === 'granted' 
                  ? `There are no articles within ${radius} km of your location. Try expanding the radius filter.`
                  : "No articles found in general feed."}
              </p>
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

export default NearbyNews;
