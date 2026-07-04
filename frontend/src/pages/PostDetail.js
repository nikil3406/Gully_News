import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';
import { socket } from '../socket';

// Generate a consistent color from the author's username
const getUserColor = (username) => {
  if (!username) return '#3b82f6';
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 42%)`;
};

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  const isAuthenticated = !!localStorage.getItem('token');
  const hasViewed = useRef(false);

  // Decode JWT to get current user ID
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        setCurrentUserId(decoded.userId);
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }, []);

  // Fetch post details
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = token;
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${id}`, { headers });
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Post not found');
          }
          throw new Error('Failed to load article');
        }
        
        const data = await response.json();
        setPost(data);
        setLikesCount(data.likes_count || 0);
        setIsLiked(data.is_liked_by_user || false);
        setViewsCount(data.views_count || 0);
        setCommentsCount(data.comments_count || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    socket.connect();
    socket.emit("join_post", parseInt(id, 10));

    const handleLikesUpdated = (data) => {
      if (data.id === parseInt(id, 10)) {
        setLikesCount(data.likes_count);
      }
    };

    const handleViewsUpdated = (data) => {
      if (data.id === parseInt(id, 10)) {
        setViewsCount(data.views_count);
      }
    };

    const handleCommentsUpdated = (data) => {
      if (data.id === parseInt(id, 10)) {
        setCommentsCount(data.comments_count);
      }
    };

    socket.on("post_likes_updated", handleLikesUpdated);
    socket.on("post_views_updated", handleViewsUpdated);
    socket.on("post_comments_updated", handleCommentsUpdated);

    return () => {
      socket.emit("leave_post", parseInt(id, 10));
      socket.off("post_likes_updated", handleLikesUpdated);
      socket.off("post_views_updated", handleViewsUpdated);
      socket.off("post_comments_updated", handleCommentsUpdated);
      socket.disconnect();
    };
  }, [id]);

  // Increment view on load
  useEffect(() => {
    const incrementView = async () => {
      if (!hasViewed.current) {
        hasViewed.current = true;
        setViewsCount(prev => prev + 1);
        try {
          await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${id}/view`, { 
            method: 'POST',
          });
        } catch (error) {
          console.error("Failed to increment view", error);
        }
      }
    };

    if (post) {
      incrementView();
    }
  }, [id, post]);

  // Handle Like
  const handleLike = async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': token
        }
      });
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        if (data.likes_count !== null) setLikesCount(data.likes_count);
      }
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  // Handle Delete Post
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      if (response.ok) {
        alert('Post deleted successfully');
        navigate('/');
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-24 gap-3 text-slate-500 animate-pulse font-medium">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span>Fetching article...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="text-center py-12 px-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs max-w-md mx-auto mt-12">
          <h2 className="text-lg font-bold text-red-600 mb-2">Error Loading Post</h2>
          <p className="text-sm text-slate-500 mb-4">{error || 'Post details could not be found.'}</p>
          <button 
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-colors cursor-pointer text-xs md:text-sm border-none shadow-md shadow-blue-100" 
            onClick={() => navigate('/')}
          >
            ← Return to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">
        {/* Navigation / Back Button */}
        <button 
          className="text-xs md:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors duration-200 mb-4 inline-flex items-center gap-1 bg-transparent border-none cursor-pointer p-0" 
          onClick={() => navigate('/')}
        >
          ← Back to News Feed
        </button>

        {/* Full Article Layout */}
        <article className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 md:p-6 mb-6">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 font-extrabold text-[10px] md:text-xs rounded-full uppercase tracking-wider mb-3 select-none text-left">
              {post.category}
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight mb-4 text-left">
              {post.title}
            </h1>
            
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 flex-wrap gap-4">
              <div className="flex items-center gap-3">
              {/* Author avatar — real photo or color initial fallback */}
              {post.author_image ? (
                <img
                  src={post.author_image}
                  alt={post.author}
                  title={post.author}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 shadow-xs border-2 border-white"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div
                className="w-9 h-9 rounded-full text-white font-bold text-sm items-center justify-center select-none shadow-xs border-2 border-white uppercase flex-shrink-0"
                style={{
                  backgroundColor: getUserColor(post.author),
                  display: post.author_image ? 'none' : 'flex',
                }}
                title={post.author}
              >
                {post.author[0]}
              </div>
                <div>
                  <div className="font-bold text-xs md:text-sm text-slate-700 text-left">{post.author}</div>
                  <div className="text-[10px] md:text-xs text-slate-400 text-left">
                    {new Date(post.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 items-center flex-wrap select-none">
                <span className="px-3 py-1 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-full">👁 {viewsCount} Views</span>
                <span className="px-3 py-1 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-full">💬 {commentsCount} Comments</span>
              </div>
            </div>
          </div>

          {/* Image Representation */}
          {post.image_url && (
            <div className="w-full max-h-[380px] overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs mb-5 flex items-center justify-center bg-slate-900">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Video Representation */}
          {post.video_url && (
            <div className="w-full max-h-[380px] overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs mb-5 flex items-center justify-center bg-slate-900">
              <video src={post.video_url} controls className="w-full h-full object-cover focus:outline-none" />
            </div>
          )}

          {/* Body Content */}
          <div className="text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-wrap break-words mb-6 text-left">
            {post.content}
          </div>

          {/* Interactive Stats Bar */}
          <div className="border-t border-slate-100 pt-4 flex gap-3 flex-wrap">
            {isAuthenticated ? (
              <>
                <button 
                  className={`px-4 py-2 text-xs md:text-sm font-bold border rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none ${
                    isLiked 
                      ? 'text-pink-600 border-pink-100 bg-pink-50/20 hover:bg-pink-50' 
                      : 'text-slate-600 border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100'
                  }`}
                  onClick={handleLike}
                >
                  {isLiked ? '❤️ Liked' : '🤍 Like'} • {likesCount}
                </button>
                {currentUserId && post && post.user_id === currentUserId && (
                  <button 
                    className="px-4 py-2 text-xs md:text-sm font-bold border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none"
                    onClick={handleDeletePost}
                    title="Delete this post"
                  >
                    🗑️ Delete Post
                  </button>
                )}
              </>
            ) : (
              <div className="px-4 py-2 text-xs md:text-sm font-bold bg-slate-50 border border-slate-200 rounded-full text-slate-600 select-none">
                ❤️ Likes • {likesCount}
              </div>
            )}
          </div>
        </article>

        {/* Dedicated comments section taking up the bottom page area */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <CommentSection 
            postId={id} 
            onCommentsCountChange={setCommentsCount} 
          />
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
