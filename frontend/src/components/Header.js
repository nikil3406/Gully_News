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

function Header() {
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
        const response = await fetch(`http://localhost:5000/api/auth/profile/${currentUserId}`, {
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
        const response = await fetch(`http://localhost:5000/api/auth/users/search?q=${encodeURIComponent(searchQuery)}`);
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
    navigate(`/profile/${userId}`);
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <Link to="/" style={styles.logoLink}>
            📰 Gully News
          </Link>
        </div>

        <div style={styles.searchBarContainer} ref={searchRef}>
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

        <nav style={styles.nav}>
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
      </div>
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
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '15px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  logoLink: {
    textDecoration: 'none',
    color: '#007bff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  searchBarContainer: {
    flex: 1,
    maxWidth: '400px',
    margin: '0 40px',
    position: 'relative',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  searchInput: {
    flex: 1,
    padding: '8px 15px',
    border: '1px solid #ddd',
    borderRadius: '20px 0 0 20px',
    outline: 'none',
    fontSize: '14px',
    transition: 'border-color 0.2s',
  },
  searchButton: {
    padding: '8px 15px',
    border: '1px solid #ddd',
    borderLeft: 'none',
    borderRadius: '0 20px 20px 0',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e1e5e9',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1001,
  },
  dropdownMessage: {
    padding: '15px',
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid #f1f3f5',
  },
  avatarContainer: {
    width: '36px',
    height: '36px',
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
    fontSize: '14px',
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
    fontSize: '14px',
    margin: 0,
    textAlign: 'left',
  },
  userBio: {
    fontSize: '12px',
    color: '#888',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '2px',
    textAlign: 'left',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
  },
  navLink: {
    textDecoration: 'none',
    color: '#333',
    padding: '8px 16px',
    fontSize: '14px',
    transition: 'color 0.2s',
  },
  navButton: {
    textDecoration: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    marginLeft: '8px',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  profileAvatarContainer: {
    width: '40px',
    height: '40px',
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
    fontSize: '16px',
    fontWeight: 'bold',
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
};

export default Header;
