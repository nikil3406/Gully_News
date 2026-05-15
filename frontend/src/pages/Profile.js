import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ArticleCard from '../components/ArticleCard';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfileImage, setEditProfileImage] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': token
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUserData(data.user);
        setPosts(data.posts);
        setEditUsername(data.user.username || '');
        setEditEmail(data.user.email || '');
        setEditBio(data.user.bio || '');
        setEditProfileImage(data.user.profile_image || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          username: editUsername,
          email: editEmail,
          bio: editBio,
          profile_image: editProfileImage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading your profile...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <div style={styles.profileHeader}>
          <div style={styles.profileInfo}>
            <div style={styles.avatarContainer}>
              {userData.profile_image ? (
                <img src={userData.profile_image} alt={userData.username} style={styles.avatar} />
              ) : (
                <div style={styles.defaultAvatar}>{userData.username[0].toUpperCase()}</div>
              )}
            </div>
            <div style={styles.textInfo}>
              <h1 style={styles.username}>{userData.username}</h1>
              <p style={styles.email}>{userData.email}</p>
              <p style={styles.bio}>{userData.bio || "No bio added yet."}</p>
              <div style={styles.statsRow}>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{userData.reputation_score}</span>
                  <span style={styles.statLabel}>Reputation</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{userData.followers_count}</span>
                  <span style={styles.statLabel}>Followers</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{posts.length}</span>
                  <span style={styles.statLabel}>Articles</span>
                </div>
              </div>
            </div>
          </div>
          <button style={styles.editButton} onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>

        {isEditing && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>Edit Profile</h2>
              <form onSubmit={handleUpdateProfile}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Username</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Username"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    style={styles.input}
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Profile Image URL</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={editProfileImage}
                    onChange={(e) => setEditProfileImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Bio</label>
                  <textarea
                    style={styles.textarea}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows="4"
                  />
                </div>
                <div style={styles.modalActions}>
                  <button 
                    type="button" 
                    style={styles.cancelButton}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={styles.saveButton}
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div style={styles.contentSection}>
          <h2 style={styles.sectionTitle}>Your Articles</h2>
          {posts.length > 0 ? (
            <div style={styles.postsGrid}>
              {posts.map(post => (
                <ArticleCard key={post.id} article={post} />
              ))}
            </div>
          ) : (
            <div style={styles.noPosts}>
              <p>You haven't published any articles yet.</p>
              <button style={styles.createButton} onClick={() => window.location.href='/create-post'}>
                Create Your First Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: '#f4f7f6',
    minHeight: '100vh',
  },
  container: {
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '0 20px',
  },
  profileHeader: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    marginBottom: '40px',
  },
  profileInfo: {
    display: 'flex',
    gap: '30px',
  },
  avatarContainer: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    overflow: 'hidden',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007bff',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: 'bold',
  },
  textInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  username: {
    fontSize: '32px',
    margin: 0,
    color: '#1a1a1a',
  },
  email: {
    color: '#666',
    margin: 0,
    fontSize: '16px',
  },
  bio: {
    fontSize: '16px',
    color: '#444',
    margin: '10px 0',
    maxWidth: '500px',
    lineHeight: '1.5',
  },
  statsRow: {
    display: 'flex',
    gap: '30px',
    marginTop: '15px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
  },
  editButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  contentSection: {
    marginTop: '20px',
  },
  sectionTitle: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#1a1a1a',
  },
  postsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  noPosts: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
  },
  createButton: {
    marginTop: '20px',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    marginTop: '50px',
    fontSize: '18px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '30px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
  },
  modalTitle: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#1a1a1a',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#444',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '30px',
  },
  cancelButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  saveButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  }
};

export default Profile;
