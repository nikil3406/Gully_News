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
  const handleCategorySelect = (e) => {
    const val = e.target.value;
    onCategorySelect?.(val === '' ? null : Number(val));
  };
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
    <header className="header" style={styles.header}>
      <div className="header__container" style={styles.container}>
        <div style={styles.logo}>
          <Link to="/" style={styles.logoLink}>
            📰 Gully News
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="header__nav" style={styles.nav}>
          {token ? (
            <div style={styles.userMenu}>
              {location.pathname !== '/' && (
                <Link to="/" style={styles.navLink}>Home</Link>
              )}
              {currentUserProfile && (
                <div
                  style={styles.profileAvatarContainer}
                  onClick={() => navigate(`/profile/${currentUserId}`)}
                  title="View Profile"
                >
                  {currentUserProfile.profile_image ? (
                    <img src={currentUserProfile.profile_image} alt="Profile" style={styles.profileAvatar} />
                  ) : (
                    <div style={{
                      ...styles.profileAvatarDefault,
                      backgroundColor: getUserColor(currentUserProfile.username)
                    }}>
                      {currentUserProfile.username ? currentUserProfile.username[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              )}
              <Link to="/create-post" style={styles.navLink}>Create Post</Link>
              <button
                style={styles.logoutButton}
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.reload();
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={styles.authButtons}>
              <Link to="/" style={styles.navLink}>Home</Link>
              <Link to="/login" style={styles.navLink}>Login</Link>
              <Link to="/register" style={styles.navButton}>Register</Link>
            </div>
          )}
        </nav>

        {/* Search + category filter (desktop: search only, mobile: dropdown + search) */}
        <div className="header__searchBarContainer" style={styles.searchBarContainer} ref={searchRef}>
          <div style={styles.mobileSearchRow} className="header__mobileSearchRow">
            {showCategoryDropdown && (
              <div style={styles.mobileCategoryWrap} className="header__mobileCategoryWrap">
                <select
                  className="header__mobileCategoryDropdown"
                  value={selectedCategory ?? ''}
                  onChange={handleCategorySelect}
                  aria-label="Filter by category"
                  style={styles.mobileCategoryDropdown}
                >
                  <option value="">📰 All News</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={styles.searchBar}>
              <input
                type="text"
                placeholder="Search local reporters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                style={styles.searchInput}
              />
              <button style={styles.searchButton}>🔍</button>
            </div>
          </div>

          {showDropdown && searchQuery.trim() && (
            <div style={styles.dropdown}>
              {loading ? (
                <div style={styles.dropdownMessage}>Searching reporters...</div>
              ) : results.length > 0 ? (
                results.map((u) => (
                  <div
                    key={u.id}
                    style={styles.dropdownItem}
                    onClick={() => handleUserClick(u.id)}
                  >
                    <div style={styles.avatarContainer}>
                      {u.profile_image ? (
                        <img src={u.profile_image} alt={u.username} style={styles.avatar} />
                      ) : (
                        <div style={{
                          ...styles.defaultAvatar,
                          backgroundColor: getUserColor(u.username)
                        }}>
                          {u.username ? u.username[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div style={styles.userInfo}>
                      <span style={styles.username}>{u.username}</span>
                      <span style={styles.userBio}>
                        {u.bio ? (u.bio.length > 50 ? `${u.bio.slice(0, 50)}...` : u.bio) : `${u.followers_count || 0} followers • Reputation: ${u.reputation_score || 0}`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.dropdownMessage}>No reporters found</div>
              )}
            </div>
          )}
        </div>       
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <div className="header__mobileMenu" style={styles.mobileMenu}>
          <div style={styles.mobileMenuContent}>
            {token ? (
              <>
                {location.pathname !== '/' && (
                  <Link to="/" style={styles.mobileNavLink} onClick={handleNavLinkClick}>Home</Link>
                )}
                {currentUserProfile && (
                  <div
                    style={styles.mobileProfileContainer}
                    onClick={() => {
                      navigate(`/profile/${currentUserId}`);
                      handleNavLinkClick();
                    }}
                  >
                    <div style={styles.mobileProfileAvatar}>
                      {currentUserProfile.profile_image ? (
                        <img src={currentUserProfile.profile_image} alt="Profile" style={styles.profileAvatar} />
                      ) : (
                        <div style={{
                          ...styles.profileAvatarDefault,
                          backgroundColor: getUserColor(currentUserProfile.username),
                          width: '32px',
                          height: '32px'
                        }}>
                          {currentUserProfile.username ? currentUserProfile.username[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <span style={styles.mobileProfileName}>{currentUserProfile.username}</span>
                  </div>
                )}
                <Link to="/create-post" style={styles.mobileNavLink} onClick={handleNavLinkClick}>📝 Create Post</Link>
                <button
                  style={styles.mobileLogoutButton}
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.reload();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" style={styles.mobileNavLink} onClick={handleNavLinkClick}>Home</Link>
                <Link to="/login" style={styles.mobileNavLink} onClick={handleNavLinkClick}>Login</Link>
                <Link to="/register" style={styles.mobileNavButtonLink} onClick={handleNavLinkClick}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e1e5e9',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 16px'
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  logoLink: {
    textDecoration: 'none',
    color: '#007bff',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: 'inherit',
  },
  searchBarContainer: {
    flex: '1 1 auto',
    maxWidth: '520px',
    minWidth: '150px',
    position: 'relative',
    display: 'block',
  },
  mobileSearchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
  },
  mobileCategoryWrap: {
    flex: '0 0 auto',
    display: 'block',
  },
  mobileCategoryDropdown: {
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    backgroundColor: '#fff',
    fontSize: '13px',
    color: '#333',
    outline: 'none',
    maxWidth: '150px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '20px 0 0 20px',
    outline: 'none',
    fontSize: '13px',
    transition: 'border-color 0.2s',
  },
  searchButton: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderLeft: 'none',
    borderRadius: '0 20px 20px 0',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '6px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e1e5e9',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1001,
  },
  dropdownMessage: {
    padding: '12px',
    textAlign: 'center',
    color: '#888',
    fontSize: '13px',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid #f1f3f5',
  },
  avatarContainer: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  username: {
    fontWeight: '600',
    color: '#333',
    fontSize: '13px',
    margin: 0,
    textAlign: 'left',
  },
  userBio: {
    fontSize: '11px',
    color: '#888',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '2px',
    textAlign: 'left',
  },
  hamburger: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    margin: '0 -8px',
    color: '#333',
    transition: 'color 0.2s',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  navLink: {
    textDecoration: 'none',
    color: '#333',
    padding: '8px 12px',
    fontSize: '13px',
    transition: 'color 0.2s',
    whiteSpace: 'nowrap',
    borderRadius: '4px',
  },
  navButton: {
    textDecoration: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '4px',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '4px',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  profileAvatarContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    flexShrink: 0,
    border: '2px solid #e1e5e9',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  profileAvatarDefault: {
    width: '100%',
    height: '100%',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  mobileMenu: {
    display: 'none',
    backgroundColor: '#fff',
    borderTop: '1px solid #e1e5e9',
    position: 'absolute',
    width: '100%',
    left: 0,
    top: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    zIndex: 999,
  },
  mobileMenuContent: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mobileNavLink: {
    textDecoration: 'none',
    color: '#333',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '4px',
    display: 'block',
    transition: 'background-color 0.2s',
  },
  mobileNavButtonLink: {
    textDecoration: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    display: 'block',
    textAlign: 'center',
  },
  mobileLogoutButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  mobileProfileContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '4px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
  },
  mobileProfileAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
  },
  mobileProfileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },

};

export default Header;


