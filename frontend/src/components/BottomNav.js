import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserProfileById, searchUsers } from '../services/authService';

const getUserColor = (username) => {
  if (!username) return '#2563eb';
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
};

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Decode current logged-in user ID from JWT token
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (err) {
        console.error('Error decoding token in BottomNav:', err);
      }
    } else {
      setCurrentUserId(null);
      setCurrentUserProfile(null);
    }
  }, [token]);

  // Fetch logged-in user profile details
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUserId || !token) return;
      try {
        const data = await getUserProfileById(currentUserId);
        if (data && data.user) {
          setCurrentUserProfile(data.user);
        }
      } catch (err) {
        console.error('Error fetching user profile in BottomNav:', err);
      }
    };
    fetchProfile();
  }, [currentUserId, token]);

  // Debounced search logic for local reporters
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await searchUsers(searchQuery);
        setSearchResults(data || []);
      } catch (err) {
        console.error('Error searching reporters in BottomNav:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Auto focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  const handleUserClick = (userId) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/profile/${userId}`);
  };

  const currentPath = location.pathname;

  // Tab active checks
  const isHomeActive = currentPath === '/';
  const isNearbyActive = currentPath === '/nearby';
  const isCreateActive = currentPath === '/create-post';
  const isProfileActive = currentPath.startsWith('/profile');

  // Link destinations
  const createTarget = token ? '/create-post' : '/login';
  const profileTarget = token
    ? currentUserId
      ? `/profile/${currentUserId}`
      : '/profile'
    : '/login';

  return (
    <>
      {/* Mobile Floating Bottom Navigation Bar - Applies ONLY in Mobile View (md:hidden) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md md:hidden pointer-events-auto">
        <nav
          className="relative flex items-center justify-around px-2 py-2 bg-white/85 backdrop-blur-xl border border-white/90 rounded-[28px] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.14),0_4px_16px_-2px_rgba(0,0,0,0.06)] transition-all duration-300"
          aria-label="Mobile Navigation"
        >
          {/* 1. Home Tab */}
          <Link
            to="/"
            className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all duration-300 ease-out active:scale-95 group ${
              isHomeActive
                ? 'text-blue-600 font-semibold bg-blue-50/90'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`transition-transform duration-300 ${
                isHomeActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'
              }`}
            >
              <svg
                className="w-5 h-5 stroke-[2.2] fill-none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 10.25L12 3l9 7.25V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.75z" />
              </svg>
            </div>
            <span className="text-[11px] font-medium tracking-tight mt-0.5">
              Home
            </span>
          </Link>

          {/* 2. Nearby News Tab */}
          <Link
            to="/nearby"
            className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all duration-300 ease-out active:scale-95 group ${
              isNearbyActive
                ? 'text-blue-600 font-semibold bg-blue-50/90'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`transition-transform duration-300 ${
                isNearbyActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'
              }`}
            >
              <svg
                className="w-5 h-5 stroke-[2.2] fill-none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <span className="text-[11px] font-medium tracking-tight mt-0.5">
              Nearby
            </span>
          </Link>

          {/* 3. Search Button (Primary Action for Reporters) */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search Local Reporters"
            className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-[0_6px_18px_-2px_rgba(37,99,235,0.45)] hover:shadow-[0_8px_22px_-2px_rgba(37,99,235,0.55)] active:scale-90 hover:scale-105 transition-all duration-300 cursor-pointer focus:outline-none ring-4 ring-white/90"
          >
            <svg
              className="w-5 h-5 stroke-[2.5] fill-none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* 4. Create Post Tab (Right of Search, Left of Profile) */}
          <Link
            to={createTarget}
            className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all duration-300 ease-out active:scale-95 group ${
              isCreateActive
                ? 'text-blue-600 font-semibold bg-blue-50/90'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`transition-transform duration-300 ${
                isCreateActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'
              }`}
            >
              <svg
                className="w-5 h-5 stroke-[2.2] fill-none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 4v16m-8-8h16" />
              </svg>
            </div>
            <span className="text-[11px] font-medium tracking-tight mt-0.5">
              Create
            </span>
          </Link>

          {/* 5. Profile Tab */}
          <Link
            to={profileTarget}
            className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all duration-300 ease-out active:scale-95 group ${
              isProfileActive
                ? 'text-blue-600 font-semibold bg-blue-50/90'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`transition-transform duration-300 ${
                isProfileActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'
              }`}
            >
              {token && currentUserProfile && currentUserProfile.profile_image ? (
                <div className="w-5 h-5 rounded-full overflow-hidden border border-blue-500/60 shadow-xs">
                  <img
                    src={currentUserProfile.profile_image}
                    alt={currentUserProfile.username || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <svg
                  className="w-5 h-5 stroke-[2.2] fill-none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <span className="text-[11px] font-medium tracking-tight mt-0.5">
              Profile
            </span>
          </Link>
        </nav>
      </div>

      {/* Mobile Reporter Search Modal Drawer */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:hidden">
          {/* Semi-transparent Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-backdrop-fade-in"
            onClick={() => setIsSearchOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 z-10 max-h-[85vh] flex flex-col animate-modal-slide-up">
            {/* Header / Grab Handle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight leading-none">
                    Search Local Reporters
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect with reporters & local journalists
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center text-sm font-semibold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Input Field (Clear/Cancel 'x' option removed inside input as requested) */}
            <div className="relative flex items-center mb-4">
              <span className="absolute left-3.5 text-slate-400 text-base">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type a reporter name or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Results Container */}
            <div className="flex-1 overflow-y-auto min-h-[160px] max-h-[340px] divide-y divide-slate-100 pr-1">
              {searchLoading ? (
                <div className="py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Searching local reporters...</span>
                </div>
              ) : searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user.id)}
                      className="flex items-center gap-3 py-3 px-2 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 group-hover:border-blue-500 transition-colors">
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full text-white flex items-center justify-center text-sm font-bold uppercase"
                            style={{ backgroundColor: getUserColor(user.username) }}
                          >
                            {user.username ? user.username[0].toUpperCase() : 'R'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {user.username}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {user.bio
                            ? user.bio
                            : `${user.followers_count || 0} followers • Reputation: ${
                                user.reputation_score || 0
                              }`}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        View
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">
                    No reporters found matching "{searchQuery}"
                  </div>
                )
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">📰</span>
                  <span>Search local reporters by username to view their profile & stories</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BottomNav;
