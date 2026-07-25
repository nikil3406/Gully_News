import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { socket } from '../socket';
import { fetchComments as getCommentsApi, addComment as addCommentApi, deleteComment as deleteCommentApi } from '../services/commentService';
import { formatRelativeTime } from '../utils/dateFormatter';

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
    const loadComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCommentsApi(postId);
        setComments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [postId]);

  useEffect(() => {
    const handleCommentAdded = (newComment) => {
      setComments(prev => {
        if (prev.some(c => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
    };

    const handleCommentDeleted = ({ commentId }) => {
      setComments(prev => prev.filter(c => c.id !== commentId));
    };

    socket.on("comment_added", handleCommentAdded);
    socket.on("comment_deleted", handleCommentDeleted);

    return () => {
      socket.off("comment_added", handleCommentAdded);
      socket.off("comment_deleted", handleCommentDeleted);
    };
  }, [postId]);

  // Handle posting a comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const newComment = await addCommentApi(postId, commentText);
      setComments(prev => {
        if (prev.some(c => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
      setCommentText('');
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
      await deleteCommentApi(postId, commentId);
    } catch (err) {
      alert(err.message);
    }
  };

  // Generate dynamic color hue based on username
  const getAvatarHue = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  };

  return (
    <div className="bg-slate-50/50 border-t border-slate-200/80 p-4 md:p-6 rounded-b-2xl animate-fadeIn">
      <div className="mb-4 border-b border-slate-200/60 pb-2 flex justify-between items-center">
        <h4 className="text-sm font-extrabold text-slate-800">Discussion ({comments.length})</h4>
      </div>

      {error && <div className="bg-red-50 text-red-700 border-l-4 border-red-500 p-3 rounded-r-lg text-xs md:text-sm mb-4">⚠️ {error}</div>}

      {/* Comments List */}
      <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto mb-6 pr-2 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-xs md:text-sm text-slate-500">Loading conversation...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 flex flex-col items-center justify-center">
            <span className="text-2xl mb-1.5 opacity-60">💬</span>
            <p className="text-xs md:text-sm">No comments yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3 items-start animate-slideUp">
              {comment.profile_image ? (
                <img 
                  src={comment.profile_image} 
                  alt={comment.author} 
                  className="w-9 h-9 rounded-full object-cover shadow-xs flex-shrink-0 border border-slate-200" 
                />
              ) : (
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold uppercase flex-shrink-0 text-white shadow-xs border border-white/20 select-none"
                  style={{ backgroundColor: `hsl(${getAvatarHue(comment.author)}, 65%, 55%)` }}
                >
                  {comment.author[0].toUpperCase()}
                </div>
              )}
              
              <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 flex-1 shadow-xs relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs md:text-sm text-slate-800">{comment.author}</span>
                  <span className="text-[10px] md:text-xs text-slate-400">{formatRelativeTime(comment.created_at)}</span>
                </div>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words text-left">{comment.content}</p>
                
                {isAuthenticated && currentUserId.current === comment.user_id && (
                  <button 
                    onClick={() => handleDelete(comment.id)} 
                    className="text-[10px] md:text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer border-none bg-transparent mt-2 inline-flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
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
      <div className="border-t border-slate-200/60 pt-4">
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none text-xs md:text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              placeholder="Share your thoughts locally..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows="3"
              disabled={submitting}
              required
            />
            <div className="flex justify-end">
              <button 
                type="submit" 
                className="px-4 py-2 text-xs md:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-full shadow-md shadow-blue-100 hover:shadow-lg transition-all duration-200 cursor-pointer"
                disabled={submitting || !commentText.trim()}
              >
                {submitting ? 'Posting...' : 'Post Comment 🚀'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-blue-50/20 border border-dashed border-blue-200/60 rounded-2xl p-4 text-center">
            <p className="text-xs md:text-sm text-blue-700 font-semibold mb-3">Join the discussion in your community!</p>
            <div className="flex justify-center">
              <Link to="/login" className="px-5 py-2 text-xs md:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-100 transition-all duration-200 text-decoration-none">
                Login to comment
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentSection;
