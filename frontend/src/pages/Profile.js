import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ArticleCard from '../components/ArticleCard';

const getUserColor = (username) => {
  if (!username) return '#007bff';
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
};

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [currentUserId, setCurrentUserId] = useState(null);
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
  const [followLoading, setFollowLoading] = useState(false);

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

  const isOwnProfile = !id || (currentUserId && parseInt(id) === currentUserId);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = isOwnProfile 
          ? `${process.env.REACT_APP_API_URL}/api/auth/profile` 
          : `${process.env.REACT_APP_API_URL}/api/auth/profile/${id}`;


        const headers = {};
        if (token) {
          headers['Authorization'] = token;
        }

        if (isOwnProfile && !token) {
          navigate('/login');
          return;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUserData(data.user);
        setPosts(data.posts);
        
        if (isOwnProfile) {
          setEditUsername(data.user.username || '');
          setEditEmail(data.user.email || '');
          setEditBio(data.user.bio || '');
          setEditProfileImage(data.user.profile_image || '');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if currentUserId is resolved OR if viewer is logged out (so currentUserId stays null)
    // This avoids double fetching or race conditions when resolving token on mount.
    fetchProfile();
  }, [id, currentUserId, token, navigate, isOwnProfile]);
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
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

  const handleFollowToggle = async () => {
    if (!token) return;
    setFollowLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/${userData.id}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to follow/unfollow user');
      }

      const data = await response.json();
      setUserData(prev => ({
        ...prev,
        is_following: data.followed,
        followers_count: prev.followers_count + (data.followed ? 1 : -1)
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading profile...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;
  if (!userData) return <div style={styles.error}>User not found</div>;

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
                <div style={{
                  ...styles.defaultAvatar,
                  backgroundColor: getUserColor(userData.username)
                }}>
                  {userData.username ? userData.username[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <div style={styles.textInfo}>
              <h1 style={styles.username}>{userData.username}</h1>
              {isOwnProfile && <p style={styles.email}>{userData.email}</p>}
              <p style={styles.bio}>{userData.bio || "No bio added yet."}</p>
              <div style={styles.statsRow}>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{userData.reputation_score || 0}</span>
                  <span style={styles.statLabel}>Reputation</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{userData.followers_count || 0}</span>
                  <span style={styles.statLabel}>Followers</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{posts.length}</span>
                  <span style={styles.statLabel}>Articles</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style={styles.actionContainer}>
            {isOwnProfile ? (
              <button style={styles.editButton} onClick={() => setIsEditing(true)}>Edit Profile</button>
            ) : token ? (
              <button 
                style={{
                  ...styles.followButton,
                  backgroundColor: userData.is_following ? '#e1e5e9' : '#007bff',
                  color: userData.is_following ? '#333' : '#fff',
                  border: userData.is_following ? '1px solid #ccc' : 'none'
                }}
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? '...' : userData.is_following ? '✓ Following' : 'Follow'}
              </button>
            ) : (
              <button 
                style={styles.followButtonDisabled}
                onClick={() => navigate('/login')}
              >
                🔑 Log in to Follow
              </button>
            )}
          </div>
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
          <h2 style={styles.sectionTitle}>
            {isOwnProfile ? 'Your Articles' : `${userData.username}'s Articles`}
          </h2>
          {posts.length > 0 ? (
            <div style={styles.postsGrid}>
              {posts.map(post => (
                <ArticleCard key={post.id} article={post} />
              ))}
            </div>
          ) : (
            <div style={styles.noPosts}>
              <p>{isOwnProfile ? "You haven't published any articles yet." : "This reporter hasn't published any articles yet."}</p>
              {isOwnProfile && (
                <button style={styles.createButton} onClick={() => navigate('/create-post')}>
                  Create Your First Post
                </button>
              )}
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
    margin: '0 auto',
    padding: '20px 16px',
  },
  profileHeader: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  profileInfo: {
    display: 'flex',
    gap: '20px',
    flex: 1,
    minWidth: '0',
  },
  avatarContainer: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    overflow: 'hidden',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
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
    fontSize: '40px',
    fontWeight: 'bold',
  },
  textInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left',
    flex: 1,
    minWidth: '0',
  },
  username: {
    fontSize: '24px',
    margin: 0,
    color: '#1a1a1a',
    fontWeight: 'bold',
    wordBreak: 'break-word',
  },
  email: {
    color: '#666',
    margin: 0,
    fontSize: '13px',
  },
  bio: {
    fontSize: '14px',
    color: '#444',
    margin: '8px 0',
    maxWidth: '500px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  statsRow: {
    display: 'flex',
    gap: '20px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
  },
  actionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  editButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  followButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  followButtonDisabled: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #e1e5e9',
    backgroundColor: '#f8f9fa',
    color: '#666',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  contentSection: {
    marginTop: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '16px',
    color: '#1a1a1a',
    textAlign: 'left',
  },
  postsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  noPosts: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  createButton: {
    marginTop: '16px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '16px',
    color: '#666',
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    marginTop: '40px',
    fontSize: '16px',
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
    padding: '16px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '20px',
    marginBottom: '16px',
    color: '#1a1a1a',
    textAlign: 'left',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#444',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  saveButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  }
};

// Responsive styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @media (max-width: 768px) {
    [class*="container"] {
      padding: 16px 12px;
    }
    [class*="profileHeader"] {
      padding: 20px;
      flex-direction: column;
    }
    [class*="profileInfo"] {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    [class*="avatarContainer"] {
      width: 90px;
      height: 90px;
    }
    [class*="username"] {
      font-size: 20px;
    }
    [class*="postsGrid"] {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  @media (max-width: 480px) {
    [class*="container"] {
      padding: 12px 8px;
    }
    [class*="profileHeader"] {
      padding: 16px;
      margin-bottom: 16px;
    }
    [class*="profileInfo"] {
      gap: 12px;
    }
    [class*="avatarContainer"] {
      width: 80px;
      height: 80px;
    }
    [class*="defaultAvatar"] {
      font-size: 32px;
    }
    [class*="username"] {
      font-size: 18px;
    }
    [class*="email"] {
      font-size: 12px;
    }
    [class*="bio"] {
      font-size: 13px;
    }
    [class*="statsRow"] {
      gap: 16px;
    }
    [class*="sectionTitle"] {
      font-size: 18px;
    }
    [class*="postsGrid"] {
      grid-template-columns: 1fr;
    }
    [class*="modal"] {
      padding: 20px;
    }
    [class*="actionContainer"] {
      flex-direction: column;
      width: 100%;
      gap: 8px;
    }
    [class*="editButton"],
    [class*="followButton"],
    [class*="followButtonDisabled"] {
      width: 100%;
    }
  }
`;
if (!document.querySelector('[data-profile-styles]')) {
  styleSheet.setAttribute('data-profile-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default Profile;
