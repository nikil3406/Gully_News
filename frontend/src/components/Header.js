import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const getUserColor = (username) => {
  if (!username) return '#007bff';
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
};

function Header({ categories = [], selectedCategory, onCategorySelect, showCategoryDropdown = false }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Decode current logged-in user ID from token
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
  }, [token]);

  // Fetch current user's profile
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!currentUserId || !token) return;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile/${currentUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUserProfile(data.user);
        }
      } catch (err) {
        console.error('Error fetching current user profile:', err);
      }
    };
    fetchCurrentUserProfile();
  }, [currentUserId, token]);

  // Debounced search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleUserClick = (userId) => {
    setSearchQuery('');
    setResults([]);
    setShowDropdown(false);
    setMobileMenuOpen(false);
    navigate(`/profile/${userId}`);
  };

  const handleNavLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center gap-2">
            <span>📰</span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Gully News</span>
          </Link>
        </div>

        {/* Desktop Search Bar (Reporters Search) */}
        <div className="hidden md:block flex-1 max-w-md relative" ref={searchRef}>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search local reporters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-10 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto z-50 divide-y divide-slate-100">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500 animate-pulse">Searching reporters...</div>
              ) : results.length > 0 ? (
                results.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
                    onClick={() => handleUserClick(u.id)}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                      {u.profile_image ? (
                        <img src={u.profile_image} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        <div 
                          className="w-full h-full text-white flex items-center justify-center text-sm font-bold uppercase"
                          style={{ backgroundColor: getUserColor(u.username) }}
                        >
                          {u.username ? u.username[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate text-left">{u.username}</p>
                      <p className="text-xs text-slate-400 truncate text-left">
                        {u.bio ? u.bio : `${u.followers_count || 0} followers • Reputation: ${u.reputation_score || 0}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">No reporters found</div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {token ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/create-post" 
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full shadow-md shadow-blue-200/50 hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
              >
                <span>✍️</span> Create Post
              </Link>
              
              {currentUserProfile && (
                <button
                  onClick={() => navigate(`/profile/${currentUserId}`)}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-colors focus:outline-none cursor-pointer"
                  title="View Profile"
                >
                  {currentUserProfile.profile_image ? (
                    <img src={currentUserProfile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      className="w-full h-full text-white flex items-center justify-center text-sm font-bold uppercase"
                      style={{ backgroundColor: getUserColor(currentUserProfile.username) }}
                    >
                      {currentUserProfile.username ? currentUserProfile.username[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </button>
              )}

              <button
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-full transition-all duration-200 cursor-pointer"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.reload();
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Home</Link>
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Login</Link>
              <Link 
                to="/register" 
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full shadow-md shadow-blue-200/50 hover:shadow-lg transition-all duration-200"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile controls: Hamburger */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <span className="text-xl font-bold block w-6 h-6 leading-6 text-center">✕</span>
            ) : (
              <span className="text-xl font-bold block w-6 h-6 leading-6 text-center">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slide-down Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg py-4 px-4 flex flex-col gap-4 animate-fadeIn">
          
          {/* Mobile Search Input (Reporters search inside Mobile Menu) */}
          <div className="relative flex items-center" ref={searchRef}>
            <span className="absolute left-3 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search local reporters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
            
            {showDropdown && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-slate-100">
                {loading ? (
                  <div className="p-3 text-center text-xs text-slate-500">Searching...</div>
                ) : results.length > 0 ? (
                  results.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleUserClick(u.id)}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        {u.profile_image ? (
                          <img src={u.profile_image} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          <div 
                            className="w-full h-full text-white flex items-center justify-center text-xs font-bold uppercase"
                            style={{ backgroundColor: getUserColor(u.username) }}
                          >
                            {u.username ? u.username[0].toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate text-left">{u.username}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">No reporters found</div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {token ? (
              <>
                <Link 
                  to="/" 
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors"
                  onClick={handleNavLinkClick}
                >
                  🏠 Home
                </Link>
                {currentUserProfile && (
                  <div
                    className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                    onClick={() => {
                      navigate(`/profile/${currentUserId}`);
                      handleNavLinkClick();
                    }}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200">
                      {currentUserProfile.profile_image ? (
                        <img src={currentUserProfile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div 
                          className="w-full h-full text-white flex items-center justify-center text-[10px] font-bold uppercase"
                          style={{ backgroundColor: getUserColor(currentUserProfile.username) }}
                        >
                          {currentUserProfile.username ? currentUserProfile.username[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <span>Profile ({currentUserProfile.username})</span>
                  </div>
                )}
                <Link 
                  to="/create-post" 
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors"
                  onClick={handleNavLinkClick}
                >
                  📝 Create Post
                </Link>
                <button
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer border-none bg-transparent"
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.reload();
                  }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/" 
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors"
                  onClick={handleNavLinkClick}
                >
                  🏠 Home
                </Link>
                <Link 
                  to="/login" 
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors"
                  onClick={handleNavLinkClick}
                >
                  🔑 Login
                </Link>
                <Link 
                  to="/register" 
                  className="mt-2 w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md transition-all"
                  onClick={handleNavLinkClick}
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;


