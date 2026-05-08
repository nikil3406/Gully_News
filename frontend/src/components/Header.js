import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  const token = localStorage.getItem('token');
  
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <Link to="/" style={styles.logoLink}>
            📰 Gully News
          </Link>
        </div>
        
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search local news..."
            style={styles.searchInput}
          />
          <button style={styles.searchButton}>🔍</button>
        </div>
        
        <nav style={styles.nav}>
          {token ? (
            <div style={styles.userMenu}>
              <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
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
  searchBar: {
    flex: 1,
    maxWidth: '400px',
    margin: '0 40px',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '20px 0 0 20px',
    outline: 'none',
    fontSize: '14px',
  },
  searchButton: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderLeft: 'none',
    borderRadius: '0 20px 20px 0',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
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
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
};

export default Header;
