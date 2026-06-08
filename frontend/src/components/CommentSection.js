import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function CommentSection({ postId, onCommentsCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  
  // Extract user ID from token
  const currentUserId = useRef(null);
  if (token && !currentUserId.current) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId.current = payload.userId;
    } catch (e) {
      console.error("Failed to decode token", e);
    }
  }

  // Fetch comments on mount or when postId changes
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${postId}/comments`);
        if (!response.ok) {
          throw new Error('Failed to load comments');
        }
        const data = await response.json();
        setComments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  // Handle posting a comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ content: commentText })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to post comment');
      }

      const newComment = await response.json();
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      
      // Notify parent component to increment count
      if (onCommentsCountChange) {
        onCommentsCountChange(prev => prev + 1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deleting a comment
  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }

      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete comment');
      }

      // Remove from local state
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      // Notify parent component to decrement count
      if (onCommentsCountChange) {
        onCommentsCountChange(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Generate dynamic colorful avatar initials
  const getAvatarStyle = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return {
      backgroundColor: `hsl(${h}, 65%, 55%)`,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      fontSize: '14px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      flexShrink: 0
    };
  };

  // Format relative time helper
  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.headerTitle}>Discussion ({comments.length})</h4>
      </div>

      {error && <div style={styles.errorMessage}>⚠️ {error}</div>}

      {/* Comments List */}
      <div style={styles.commentsList}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <span style={styles.loadingText}>Loading conversation...</span>
          </div>
        ) : comments.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>💬</span>
            <p style={styles.emptyText}>No comments yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} style={styles.commentItem}>
              {comment.profile_image ? (
                <img 
                  src={comment.profile_image} 
                  alt={comment.author} 
                  style={styles.avatarImage} 
                />
              ) : (
                <div style={getAvatarStyle(comment.author)}>
                  {comment.author[0].toUpperCase()}
                </div>
              )}
              
              <div style={styles.commentBubble}>
                <div style={styles.commentHeader}>
                  <span style={styles.commentAuthor}>{comment.author}</span>
                  <span style={styles.commentTime}>{formatRelativeTime(comment.created_at)}</span>
                </div>
                <p style={styles.commentContent}>{comment.content}</p>
                
                {isAuthenticated && currentUserId.current === comment.user_id && (
                  <button 
                    onClick={() => handleDelete(comment.id)} 
                    style={styles.deleteButton}
                    title="Delete your comment"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Input */}
      <div style={styles.formContainer}>
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <textarea
              style={styles.textarea}
              placeholder="Share your thoughts locally..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows="3"
              disabled={submitting}
              required
            />
            <div style={styles.formFooter}>
              <button 
                type="submit" 
                style={styles.submitButton}
                disabled={submitting || !commentText.trim()}
              >
                {submitting ? 'Posting...' : 'Post Comment 🚀'}
              </button>
            </div>
          </form>
        ) : (
          <div style={styles.authPrompt}>
            <p style={styles.authPromptText}>Join the discussion in your community!</p>
            <div style={styles.authActions}>
              <Link to="/login" style={styles.authLink}>Login to comment</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#fafbfc',
    borderTop: '1px solid #edf2f7',
    padding: '20px',
    borderRadius: '0 0 8px 8px',
    animation: 'fadeIn 0.3s ease',
  },
  header: {
    marginBottom: '15px',
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '8px',
  },
  headerTitle: {
    margin: 0,
    fontSize: '15px',
    color: '#2d3748',
    fontWeight: 'bold',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxHeight: '350px',
    overflowY: 'auto',
    marginBottom: '20px',
    paddingRight: '5px',
  },
  commentItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    animation: 'slideUp 0.25s ease-out',
  },
  avatarImage: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    flexShrink: 0
  },
  commentBubble: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px 16px',
    flex: 1,
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    position: 'relative',
    transition: 'all 0.2s',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: '13px',
    color: '#2d3748',
  },
  commentTime: {
    fontSize: '11px',
    color: '#a0aec0',
  },
  commentContent: {
    margin: 0,
    fontSize: '13px',
    color: '#4a5568',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#e53e3e',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '4px 0 0 0',
    marginTop: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    fontWeight: '500',
  },
  errorMessage: {
    backgroundColor: '#fff5f5',
    color: '#c53030',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '15px',
    borderLeft: '4px solid #f56565',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '30px 0',
  },
  loadingText: {
    fontSize: '13px',
    color: '#718096',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid #e2e8f0',
    borderTop: '2px solid #3182ce',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '30px 10px',
    color: '#718096',
  },
  emptyIcon: {
    fontSize: '24px',
    display: 'block',
    marginBottom: '8px',
    opacity: 0.6
  },
  emptyText: {
    margin: 0,
    fontSize: '13px',
  },
  formContainer: {
    borderTop: '1px solid #edf2f7',
    paddingTop: '15px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e0',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ':focus': {
      borderColor: '#3182ce',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.15)',
    }
  },
  formFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  submitButton: {
    backgroundColor: '#3182ce',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(49, 130, 206, 0.2)',
  },
  authPrompt: {
    backgroundColor: '#ebf8ff',
    border: '1px dashed #bee3f8',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
  },
  authPromptText: {
    margin: '0 0 10px 0',
    fontSize: '13px',
    color: '#2b6cb0',
    fontWeight: '500',
  },
  authActions: {
    display: 'flex',
    justifyContent: 'center',
  },
  authLink: {
    textDecoration: 'none',
    backgroundColor: '#3182ce',
    color: '#fff',
    padding: '6px 16px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    boxShadow: '0 2px 4px rgba(49, 130, 206, 0.15)',
    transition: 'all 0.2s',
  }
};

export default CommentSection;
