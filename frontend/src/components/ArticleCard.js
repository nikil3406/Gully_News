import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ArticleCard({ article, currentUserId, onDelete }) {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const isPostCreator = currentUserId && article.user_id === currentUserId;
  const [likesCount, setLikesCount] = useState(article.likes_count || 0);
  const [isLiked, setIsLiked] = useState(article.is_liked_by_user || false); 
  const [viewsCount] = useState(article.views_count || 0);

  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent card navigation when liking
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${article.id}/like`, {
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

  const navigateToDetail = () => {
    navigate(`/post/${article.id}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden mb-4 md:mb-6 flex flex-col group">
      {article.image_url && (
        <img 
          className="w-full h-48 sm:h-56 md:h-64 object-cover cursor-pointer group-hover:scale-[1.01] transition-transform duration-300"
          src={article.image_url} 
          alt={article.title} 
          onClick={navigateToDetail}
        />
      )}

      <div className="p-4 md:p-5 flex flex-col flex-grow">
        <div className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 select-none text-left">{article.category}</div>
        <h3
          className="text-base md:text-lg font-extrabold text-slate-800 leading-snug mb-2 group-hover:text-blue-600 transition-colors duration-200 cursor-pointer text-left"
          onClick={navigateToDetail}
        >
          {article.title}
        </h3>
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-4 text-left">
          {article.content && article.content.length > 150 
            ? <>
                {article.content.substring(0, 150)}...
                <button 
                  className="text-blue-600 hover:text-blue-700 font-bold ml-1 hover:underline cursor-pointer bg-transparent border-none p-0 inline-flex items-center text-xs md:text-sm"
                  onClick={navigateToDetail}
                >
                  Read More
                </button>
              </>
            : article.content}
        </p>
        <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-400 border-b border-slate-100 pb-3 mb-3 flex-wrap gap-2">
          <div className="flex gap-3 items-center flex-wrap">
            <span className="font-semibold text-slate-700">{article.author}</span>
            <span className="text-slate-400">{new Date(article.created_at).toLocaleDateString()}</span>
          </div>
          {isPostCreator && onDelete && (
            <button 
              className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200 flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(article.id);
              }}
              title="Delete this post"
            >
              🗑️ Delete
            </button>
          )}
        </div>
        <div className="flex gap-2.5 text-xs text-slate-500 items-center flex-wrap select-none">
          <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">👁 {viewsCount}</span>
          {isAuthenticated ? (
            <button 
              className={`flex items-center gap-1 border rounded-full px-3 py-1 bg-white cursor-pointer transition-colors text-[11px] md:text-xs font-medium select-none ${
                isLiked 
                  ? 'text-pink-600 border-pink-100 bg-pink-50/20 hover:bg-pink-50/50' 
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50 active:bg-slate-100'
              }`}
              onClick={handleLike}
            >
              {isLiked ? '❤️' : '🤍'} {likesCount}
            </button>
          ) : (
            <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">❤️ {likesCount}</span>
          )}
          <button 
            className="flex items-center gap-1 border border-slate-200 rounded-full px-3 py-1 bg-white hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors text-slate-600 select-none text-[11px] md:text-xs"
            onClick={navigateToDetail}
          >
            💬 {article.comments_count}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArticleCard;

