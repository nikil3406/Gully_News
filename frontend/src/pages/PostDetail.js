import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';

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

        const response = await fetch(`http://localhost:5000/api/posts/${id}`, { headers });
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

  // Increment view on load
  useEffect(() => {
    const incrementView = async () => {
      if (!hasViewed.current) {
        hasViewed.current = true;
        setViewsCount(prev => prev + 1);
        try {
          await fetch(`http://localhost:5000/api/posts/${id}/view`, {
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
      const response = await fetch(`http://localhost:5000/api/posts/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': token
        }
      });
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
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
      const response = await fetch(`http://localhost:5000/api/posts/${id}`, {
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
      <div style={styles.page}>
        <Header />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <span style={styles.loadingText}>Fetching article...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Error Loading Post</h2>
          <p style={styles.errorText}>{error || 'Post details could not be found.'}</p>
          <button style={styles.backButton} onClick={() => navigate('/')}>
            ← Return to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        {/* Navigation / Back Button */}
        <button style={styles.backButtonLink} onClick={() => navigate('/')}>
          ← Back to News Feed
        </button>

        {/* Full Article Layout */}
        <article style={styles.articleCard}>
          <div style={styles.articleHeader}>
            <span style={styles.category}>{post.category}</span>
            <h1 style={styles.title}>{post.title}</h1>
            
            <div style={styles.metaRow}>
              <div style={styles.authorInfo}>
                <div style={styles.authorAvatar}>
                  {post.author[0].toUpperCase()}
                </div>
                <div>
                  <div style={styles.authorName}>{post.author}</div>
                  <div style={styles.publishDate}>
                    {new Date(post.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              <div style={styles.statsRow}>
                <span style={styles.statItem}>👁 {viewsCount} Views</span>
                <span style={styles.statItem}>💬 {commentsCount} Comments</span>
              </div>
            </div>
          </div>

          {/* Media representation */}
          {post.image_url && (
            <div style={styles.mediaContainer}>
              <img src={post.image_url} alt={post.title} style={styles.image} />
            </div>
          )}

          {post.video_url && (
            <div style={styles.mediaContainer}>
              <video src={post.video_url} controls style={styles.video} />
            </div>
          )}

          {/* Body Content */}
          <div style={styles.articleContent}>
            {post.content}
          </div>

          {/* Interactive Stats Bar */}
          <div style={styles.interactiveBar}>
            {isAuthenticated ? (
              <>
                <button 
                  style={{...styles.likeButton, color: isLiked ? '#e0245e' : '#4a5568', borderColor: isLiked ? '#fed7d7' : '#e2e8f0', backgroundColor: isLiked ? '#fff5f5' : '#fff'}} 
                  onClick={handleLike}
                >
                  {isLiked ? '❤️ Liked' : '🤍 Like'} • {likesCount}
                </button>
                {currentUserId && post && post.user_id === currentUserId && (
                  <button 
                    style={styles.deleteButton}
                    onClick={handleDeletePost}
                    title="Delete this post"
                  >
                    🗑️ Delete Post
                  </button>
                )}
              </>
            ) : (
              <div style={styles.likeBadge}>
                ❤️ Likes • {likesCount}
              </div>
            )}
          </div>
        </article>

        {/* Dedicated comments section taking up the bottom page area */}
        <div style={styles.commentsWrapper}>
          <CommentSection 
            postId={id} 
            onCommentsCountChange={setCommentsCount} 
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: '#f7fafc',
    minHeight: '100vh',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px 16px 40px 16px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: '12px',
  },
  loadingText: {
    fontSize: '14px',
    color: '#4a5568',
    fontWeight: '500',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #edf2f7',
    borderTop: '4px solid #3182ce',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '30px 20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginTop: '40px',
  },
  errorTitle: {
    color: '#e53e3e',
    fontSize: '18px',
    marginBottom: '8px',
  },
  errorText: {
    color: '#718096',
    marginBottom: '16px',
    fontSize: '13px',
  },
  backButton: {
    backgroundColor: '#3182ce',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  backButtonLink: {
    background: 'none',
    border: 'none',
    color: '#4a5568',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '16px',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'color 0.2s',
  },
  articleCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '20px',
    marginBottom: '16px',
  },
  articleHeader: {
    marginBottom: '20px',
  },
  category: {
    backgroundColor: '#ebf8ff',
    color: '#2b6cb0',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    padding: '4px 8px',
    borderRadius: '16px',
    display: 'inline-block',
    marginBottom: '10px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1a202c',
    margin: '0 0 16px 0',
    lineHeight: '1.3',
    wordBreak: 'break-word',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '16px',
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  authorAvatar: {
    width: '36px',
    height: '36px',
    backgroundColor: '#3182ce',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  authorName: {
    fontWeight: 'bold',
    color: '#2d3748',
    fontSize: '13px',
  },
  publishDate: {
    color: '#718096',
    fontSize: '11px',
  },
  statsRow: {
    display: 'flex',
    gap: '10px',
    fontSize: '12px',
    color: '#718096',
    flexWrap: 'wrap',
  },
  statItem: {
    backgroundColor: '#f7fafc',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #edf2f7',
  },
  mediaContainer: {
    width: '100%',
    maxHeight: '350px',
    overflow: 'hidden',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  articleContent: {
    fontSize: '14px',
    color: '#2d3748',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
    marginBottom: '24px',
    wordBreak: 'break-word',
  },
  interactiveBar: {
    borderTop: '1px solid #edf2f7',
    paddingTop: '16px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  likeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '18px',
    border: '1px solid',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  likeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    color: '#4a5568',
    padding: '6px 14px',
    borderRadius: '18px',
    fontWeight: '600',
    fontSize: '12px',
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '18px',
    border: '1px solid #fca5a5',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  commentsWrapper: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  }
};

// Responsive styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @media (max-width: 768px) {
    [class*="container"] {
      padding: 16px 12px 30px;
    }
    [class*="articleCard"] {
      padding: 16px;
    }
    [class*="title"] {
      font-size: 20px;
    }
    [class*="mediaContainer"] {
      max-height: 280px;
    }
  }

  @media (max-width: 480px) {
    [class*="container"] {
      padding: 12px 8px 24px;
    }
    [class*="articleCard"] {
      padding: 12px;
      margin-bottom: 12px;
      border-radius: 8px;
    }
    [class*="title"] {
      font-size: 18px;
      margin-bottom: 12px;
    }
    [class*="articleContent"] {
      font-size: 13px;
      margin-bottom: 16px;
    }
    [class*="mediaContainer"] {
      max-height: 250px;
      margin-bottom: 16px;
    }
    [class*="metaRow"] {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding-bottom: 12px;
    }
    [class*="statsRow"] {
      gap: 6px;
      font-size: 11px;
    }
    [class*="interactiveBar"] {
      padding-top: 12px;
      gap: 6px;
    }
    [class*="likeButton"],
    [class*="deleteButton"],
    [class*="likeBadge"] {
      padding: 5px 12px;
      font-size: 11px;
    }
  }
`;
if (!document.querySelector('[data-postdetail-styles]')) {
  styleSheet.setAttribute('data-postdetail-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default PostDetail;
