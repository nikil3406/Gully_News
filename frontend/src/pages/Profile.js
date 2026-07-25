import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ArticleCard from '../components/ArticleCard';
import { getProfile, getUserProfileById, updateProfile, toggleFollowUser } from '../services/authService';
import { deletePost } from '../services/postService';

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
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isOwnProfile && !token) {
          navigate('/login');
          return;
        }

        const data = isOwnProfile
          ? await getProfile()
          : await getUserProfileById(id);

        setUserData(data.user);
        setPosts(data.posts || []);

        if (isOwnProfile && data.user) {
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

    fetchProfileData();
  }, [id, currentUserId, token, navigate, isOwnProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const updatedUser = await updateProfile({
        username: editUsername,
        email: editEmail,
        bio: editBio,
        profile_image: editProfileImage
      });

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
    if (!token || !userData) return;
    setFollowLoading(true);
    try {
      const data = await toggleFollowUser(userData.id);

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

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500 animate-pulse font-medium">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center py-8 px-6 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-sm w-full">
          <p className="text-red-500 font-bold mb-4">⚠️ {error || 'User not found'}</p>
          <button
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-xs shadow-md cursor-pointer border-none"
            onClick={() => navigate('/')}
          >
            Go to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">

        {/* Profile Card Banner */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs mb-6 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 flex-1 w-full">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm">
              {userData.profile_image ? (
                <img src={userData.profile_image} alt={userData.username} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full text-white flex items-center justify-center text-4xl font-extrabold uppercase select-none"
                  style={{ backgroundColor: getUserColor(userData.username) }}
                >
                  {userData.username ? userData.username[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 text-center sm:text-left flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight truncate">{userData.username}</h1>
              {isOwnProfile && <p className="text-xs md:text-sm text-slate-400 font-medium">{userData.email}</p>}
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed my-2 max-w-lg break-words">{userData.bio || "No bio added yet."}</p>

              <div className="flex gap-6 justify-center sm:justify-start mt-2 select-none">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-lg font-extrabold text-blue-600">{userData.reputation_score || 0}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reputation</span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-lg font-extrabold text-blue-600">{userData.followers_count || 0}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Followers</span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-lg font-extrabold text-blue-600">{posts.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Articles</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0 justify-center">
            {isOwnProfile ? (
              <button
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full font-bold text-xs md:text-sm text-slate-700 transition-colors duration-200 cursor-pointer shadow-xs select-none"
                onClick={() => setIsEditing(true)}
              >
                ⚙️ Edit Profile
              </button>
            ) : token ? (
              <button
                className={`px-5 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all duration-200 cursor-pointer shadow-sm select-none border-none ${userData.is_following
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 hover:shadow-lg'
                  }`}
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? '...' : userData.is_following ? '✓ Following' : 'Follow'}
              </button>
            ) : (
              <button
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-full font-bold text-xs md:text-sm text-slate-600 transition-colors cursor-pointer flex items-center gap-1 select-none"
                onClick={() => navigate('/login')}
              >
                🔑 Log in to Follow
              </button>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleUp">
              <h2 className="text-lg font-bold text-slate-800 mb-4 text-left border-b border-slate-100 pb-2">Edit Profile</h2>
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Username</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Username"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Email</label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Profile Image URL</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={editProfileImage}
                    onChange={(e) => setEditProfileImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Bio</label>
                  <textarea
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows="4"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full font-bold text-xs md:text-sm text-slate-700 transition-colors cursor-pointer select-none"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-full font-bold text-xs md:text-sm text-white transition-colors cursor-pointer shadow-md shadow-blue-100 border-none select-none"
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-lg font-extrabold text-slate-800 mb-4 text-left border-b border-slate-100 pb-2 select-none">
            {isOwnProfile ? 'Your Articles' : `${userData.username}'s Articles`}
          </h2>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {posts.map(post => (
                <ArticleCard
                  key={post.id}
                  article={post}
                  currentUserId={currentUserId}
                  onDelete={isOwnProfile ? handleDeletePost : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <p className="text-xs sm:text-sm text-slate-500 mb-4">{isOwnProfile ? "You haven't published any articles yet." : "This reporter hasn't published any articles yet."}</p>
              {isOwnProfile && (
                <button
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-xs md:text-sm shadow-md cursor-pointer border-none"
                  onClick={() => navigate('/create-post')}
                >
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

export default Profile;
