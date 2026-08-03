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
  return `hsl(${h}, 65%, 45%)`;
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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUserId || !token) return;
      try {
        const data = await getUserProfileById(currentUserId);
        if (data && data.user) setCurrentUserProfile(data.user);
      } catch (err) {
        console.error('Error fetching user profile in BottomNav:', err);
      }
    };
    fetchProfile();
  }, [currentUserId, token]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
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

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const handleUserClick = (userId) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/profile/${userId}`);
  };

  const currentPath = location.pathname;
  const isHomeActive    = currentPath === '/';
  const isNearbyActive  = currentPath === '/nearby';
  const isCreateActive  = currentPath === '/create-post';
  const isProfileActive = currentPath.startsWith('/profile');

  const createTarget  = token ? '/create-post' : '/login';
  const profileTarget = token ? (currentUserId ? `/profile/${currentUserId}` : '/profile') : '/login';

  const navStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    borderRadius: 14,
    textDecoration: 'none',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    minWidth: 52,
    gap: 3,
    fontFamily: 'var(--font-sans)',
  };

  const getTabStyle = (isActive) => ({
    ...navStyle,
    background: isActive ? '#2563eb' : 'transparent',
    color: isActive ? '#ffffff' : '#475569',
  });

  const getLabelStyle = (isActive) => ({
    fontSize: 10,
    fontWeight: isActive ? 700 : 600,
    fontFamily: 'var(--font-sans)',
    letterSpacing: '0.01em',
    lineHeight: 1,
  });

  return (
    <>
      {/* Mobile Floating Bottom Nav */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          width: 'calc(100% - 32px)',
          maxWidth: 400,
          pointerEvents: 'auto',
        }}
      >
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '8px 10px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid #e2e8f0',
            borderRadius: 24,
            boxShadow: '0 8px 24px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)',
          }}
          aria-label="Mobile Navigation"
        >
          {/* Home */}
          <Link to="/" style={getTabStyle(isHomeActive)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isHomeActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isHomeActive
                ? <path d="M3 10.25L12 3l9 7.25V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.75z"/>
                : <path d="M3 10.25L12 3l9 7.25V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.75z"/>}
            </svg>
            <span style={getLabelStyle(isHomeActive)}>Home</span>
          </Link>

          {/* Nearby */}
          <Link to="/nearby" style={getTabStyle(isNearbyActive)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isNearbyActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill={isNearbyActive ? 'white' : 'currentColor'}/>
            </svg>
            <span style={getLabelStyle(isNearbyActive)}>Nearby</span>
          </Link>

          {/* Center Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search Local Reporters"
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
              color: '#ffffff',
              transition: 'all 0.25s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4-4"/>
            </svg>
          </button>

          {/* Create */}
          <Link to={createTarget} style={getTabStyle(isCreateActive)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {isCreateActive
                ? <><rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/><path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2"/></>
                : <><path d="M12 5v14M5 12h14"/></>}
            </svg>
            <span style={getLabelStyle(isCreateActive)}>Write</span>
          </Link>

          {/* Profile */}
          <Link to={profileTarget} style={getTabStyle(isProfileActive)}>
            {token && currentUserProfile && currentUserProfile.profile_image ? (
              <div style={{
                width: 22, height: 22, borderRadius: '50%', overflow: 'hidden',
                border: isProfileActive ? '2px solid #ffffff' : '1.5px solid #e2e8f0',
              }}>
                <img src={currentUserProfile.profile_image} alt={currentUserProfile.username || 'Profile'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isProfileActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )}
            <span style={getLabelStyle(isProfileActive)}>Profile</span>
          </Link>
        </nav>
      </div>

      {/* Reporter Search Modal */}
      {isSearchOpen && (
        <div
          className="md:hidden"
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            className="animate-backdrop-fade-in"
            onClick={() => setIsSearchOpen(false)}
          />

          {/* Modal */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 520,
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -4px 32px rgba(15,23,42,0.12)',
              padding: 20,
              zIndex: 10,
              maxHeight: '82vh',
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid #e2e8f0',
            }}
            className="animate-modal-slide-up"
          >
            {/* Grab handle */}
            <div style={{
              width: 36, height: 4, background: '#e2e8f0',
              borderRadius: 99, margin: '0 auto 18px',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: '1px solid #f1f5f9',
            }}>
              <div>
                <h3 style={{
                  margin: 0, fontSize: 16, fontWeight: 800,
                  color: '#0f172a', fontFamily: 'var(--font-sans)',
                  letterSpacing: '-0.3px',
                }}>
                  Find Reporters
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>
                  Connect with local journalists
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#f1f5f9', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#475569', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: '#f1f5f9',
              border: '1.5px solid #e2e8f0',
              borderRadius: 14,
              padding: '0 14px',
              height: 46,
              marginBottom: 14,
              gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  background: 'transparent', fontSize: 14,
                  fontFamily: 'var(--font-sans)', color: '#0f172a',
                }}
              />
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 120, maxHeight: 300 }}>
              {searchLoading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                  <div style={{
                    width: 24, height: 24, border: '2px solid #e2e8f0',
                    borderTopColor: '#2563eb', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 8px',
                  }} />
                  Searching...
                </div>
              ) : searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 8px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#eef4ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                        flexShrink: 0, border: '1.5px solid #e2e8f0',
                      }}>
                        {user.profile_image ? (
                          <img src={user.profile_image} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%', background: getUserColor(user.username),
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-sans)',
                          }}>
                            {user.username ? user.username[0].toUpperCase() : 'R'}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.username}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.bio ? user.bio : `${user.followers_count || 0} followers · Rep: ${user.reputation_score || 0}`}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#2563eb',
                        background: '#eef4ff', border: '1px solid #bfdbfe',
                        borderRadius: 999, padding: '3px 10px',
                        flexShrink: 0, fontFamily: 'var(--font-sans)',
                      }}>
                        View
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>
                    No reporters found for "{searchQuery}"
                  </div>
                )
              ) : (
                <div style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                    Search for local reporters by name
                  </p>
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
