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
    <div className="articleCard" style={styles.card}>
      {article.image_url && (
        <img 
          className="articleCard__image"
          src={article.image_url} 
          alt={article.title} 
          style={{...styles.image, cursor: 'pointer'}} 
          onClick={navigateToDetail}
        />
      )}

      <div className="articleCard__content" style={styles.content}>
        <div className="articleCard__category" style={styles.category}>{article.category}</div>
        <h3
          className="articleCard__title"
          style={{...styles.title, cursor: 'pointer'}}

          onClick={navigateToDetail}
        >
          {article.title}
        </h3>
        <p style={styles.summary}>
          {article.content && article.content.length > 150 
            ? <>
                {article.content.substring(0, 150)}...
                <button style={styles.readMoreButton} onClick={navigateToDetail}>Read More</button>
              </>
            : article.content}
        </p>
        <div className="articleCard__meta" style={styles.meta}>
          <div style={styles.authorInfo}>
            <span style={styles.author}>{article.author}</span>
            <span style={styles.date}>{new Date(article.created_at).toLocaleDateString()}</span>
          </div>
          {isPostCreator && onDelete && (
            <button 
              style={styles.deleteButton}
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
        <div className="articleCard__stats" style={styles.stats}>
          <span style={styles.stat}>👁 {viewsCount}</span>
          {isAuthenticated ? (
            <button 
              style={{...styles.interactiveButton, color: isLiked ? '#e0245e' : '#666'}} 
              onClick={handleLike}
            >
              {isLiked ? '❤️' : '🤍'} {likesCount}
            </button>
          ) : (
            <span style={styles.stat}>❤️ {likesCount}</span>
          )}
          <button style={styles.interactiveButton} onClick={navigateToDetail}>
            💬 {article.comments_count}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '16px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  image: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
  },
  content: {
    padding: '12px',
  },
  category: {
    color: '#007bff',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: '6px',
    letterSpacing: '0.5px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    lineHeight: '1.3',
  },
  summary: {
    color: '#666',
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '0 0 12px 0',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '11px',
    color: '#999',
    flexWrap: 'wrap',
    gap: '8px',
  },
  authorInfo: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  author: {
    fontWeight: 'bold',
  },
  date: {
    color: '#999',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#dc3545',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 6px',
    transition: 'all 0.2s',
    borderRadius: '3px',
    whiteSpace: 'nowrap',
  },
  stats: {
    display: 'flex',
    gap: '10px',
    fontSize: '11px',
    color: '#666',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  interactiveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '4px 6px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '11px',
    color: '#666',
    transition: 'all 0.2s',
  },
  readMoreButton: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginLeft: '3px',
    padding: 0,
    fontSize: '13px',
  }
};

export default ArticleCard;

