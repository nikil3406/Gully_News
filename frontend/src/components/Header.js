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
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }, [token]);

  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!currentUserId || !token) return;
      try {
        const data = await getUserProfileById(currentUserId);
        if (data && data.user) setCurrentUserProfile(data.user);
      } catch (err) {
        console.error('Error fetching current user profile:', err);
      }
    };
    fetchCurrentUserProfile();
  }, [currentUserId, token]);

  useEffect(() => {
    if (!searchQuery.trim()) { setResults([]); return; }
    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await searchUsers(searchQuery);
        setResults(data || []);
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
    navigate(`/profile/${userId}`);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {
        method: 'POST', credentials: 'include'
      });
    } catch (_) {}
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.90)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: scrolled ? '0 4px 20px rgba(15,23,42,0.06)' : '0 1px 3px rgba(15,23,42,0.03)',
        transition: 'box-shadow 0.25s ease',
      }}
    >
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 20px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>

        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="#ffffff" strokeWidth="2" />
              <path d="M7 9h10M7 12h7M7 15h5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 800,
            fontSize: 18,
            color: '#0f172a',
            letterSpacing: '-0.5px',
          }}>
            Gully <span style={{ color: '#2563eb' }}>News</span>
          </span>
        </Link>

        {/* Desktop Search Bar */}
        <div
          ref={searchRef}
          style={{
            flex: '1 1 auto',
            maxWidth: 380,
            position: 'relative',
          }}
          className="hidden md:block"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 12, color: '#94a3b8', display: 'flex' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search local reporters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              style={{
                width: '100%',
                paddingLeft: 36,
                paddingRight: searchQuery ? 36 : 14,
                paddingTop: 7,
                paddingBottom: 7,
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                background: '#f1f5f9',
                border: '1.5px solid #e2e8f0',
                borderRadius: 999,
                outline: 'none',
                color: '#0f172a',
                transition: 'all 0.25s ease',
              }}
              onFocus2={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f1f5f9'; e.target.style.boxShadow = 'none'; }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: 13,
                  display: 'flex',
                  padding: 2,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchQuery.trim() && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
              maxHeight: 300,
              overflowY: 'auto',
              zIndex: 50,
            }}>
              {loading ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>
                  Searching...
                </div>
              ) : results.length > 0 ? (
                results.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#eef4ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => handleUserClick(u.id)}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
                      flexShrink: 0, border: '1.5px solid #e2e8f0',
                    }}>
                      {u.profile_image ? (
                        <img src={u.profile_image} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%', background: getUserColor(u.username),
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-sans)',
                        }}>
                          {u.username ? u.username[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.username}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.bio ? u.bio : `${u.followers_count || 0} followers · Rep: ${u.reputation_score || 0}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#94a3b8', fontFamily: 'var(--font-sans)' }}>
                  No reporters found
                </div>
              )}
            </div>
          )}
        </div>

        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {token ? (
              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  color: '#475569',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    color: '#475569',
                    textDecoration: 'none',
                    borderRadius: 999,
                    transition: 'color 0.25s ease',
                  }}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#fff',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'var(--font-sans)',
                    textDecoration: 'none',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                  }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}

        {/* Desktop Nav — visible only on md and above */}
        <nav style={{ alignItems: 'center', gap: 6 }} className="hidden md:flex">

          {/* Page links */}
          <Link
            to="/"
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              textDecoration: 'none',
              transition: 'all 0.25s ease',
              background: location.pathname === '/' ? '#2563eb' : 'transparent',
              color: location.pathname === '/' ? '#ffffff' : '#475569',
            }}
          >
            Home
          </Link>
          <Link
            to="/nearby"
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.25s ease',
              background: location.pathname === '/nearby' ? '#2563eb' : 'transparent',
              color: location.pathname === '/nearby' ? '#ffffff' : '#475569',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            Nearby
          </Link>

          <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Write CTA */}
              <Link
                to="/create-post"
                style={{
                  padding: '7px 16px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.25)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Write
              </Link>

              {/* Profile avatar */}
              {currentUserProfile && (
                <button
                  onClick={() => navigate(`/profile/${currentUserId}`)}
                  style={{
                    width: 34, height: 34,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid #e2e8f0',
                    cursor: 'pointer',
                    background: 'none',
                    padding: 0,
                    flexShrink: 0,
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  title="View Profile"
                >
                  {currentUserProfile.profile_image ? (
                    <img src={currentUserProfile.profile_image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: getUserColor(currentUserProfile.username),
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-sans)',
                    }}>
                      {currentUserProfile.username ? currentUserProfile.username[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </button>
              )}

              {/* Logout */}
              <button
                style={{
                  padding: '6px 14px',
                  background: 'transparent',
                  color: '#475569',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link
                to="/login"
                style={{
                  padding: '6px 14px',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  color: '#475569',
                  textDecoration: 'none',
                  borderRadius: 999,
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                style={{
                  padding: '7px 16px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.25)'; }}
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
