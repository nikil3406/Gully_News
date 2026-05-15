import React, { useState, useEffect } from 'react';

function ArticleCard({ article }) {
  const isAuthenticated = !!localStorage.getItem('token');
  const [likesCount, setLikesCount] = useState(article.likes_count || 0);
  const [isLiked, setIsLiked] = useState(article.is_liked_by_user || false); 
  const [viewsCount, setViewsCount] = useState(article.views_count || 0);

  const [isExpanded, setIsExpanded] = useState(false);
  const hasViewed = React.useRef(false);

  const handleView = async () => {
    if (!hasViewed.current) {
      hasViewed.current = true;
      setViewsCount(prev => prev + 1);
      try {
        await fetch(`http://localhost:5000/api/posts/${article.id}/view`, {
          method: 'POST',
        });
      } catch (error) {
        console.error("Failed to increment view", error);
      }
    }
  };

  const handleReadMore = () => {
    setIsExpanded(true);
    handleView();
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${article.id}/like`, {
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

  return (
    <div style={styles.card}>
      {article.image_url && (
        <img src={article.image_url} alt={article.title} style={styles.image} />
      )}
      <div style={styles.content}>
        <div style={styles.category}>{article.category}</div>
        <h3 style={styles.title}>{article.title}</h3>
        <p style={styles.summary}>
          {!isExpanded && article.content && article.content.length > 150 
            ? <>
                {article.content.substring(0, 150)}...
                <button style={styles.readMoreButton} onClick={handleReadMore}>Read More</button>
              </>
            : article.content}
        </p>
        <div style={styles.meta}>
          <span style={styles.author}>{article.author}</span>
          <span style={styles.date}>{new Date(article.created_at).toLocaleDateString()}</span>
        </div>
        <div style={styles.stats}>
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
          {isAuthenticated ? (
            <button style={styles.interactiveButton}>
              💬 {article.comments_count}
            </button>
          ) : (
            <span style={styles.stat}>💬 {article.comments_count}</span>
          )}
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
    marginBottom: '20px',
    transition: 'transform 0.2s',
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  content: {
    padding: '15px',
  },
  category: {
    color: '#007bff',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    lineHeight: '1.3',
  },
  summary: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 15px 0',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '12px',
    color: '#999',
  },
  author: {
    fontWeight: 'bold',
  },
  date: {
    color: '#999',
  },
  stats: {
    display: 'flex',
    gap: '15px',
    fontSize: '12px',
    color: '#666',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  interactiveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#666',
    transition: 'all 0.2s',
  },
  readMoreButton: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginLeft: '5px',
    padding: 0,
    fontSize: '14px',
  }
};

export default ArticleCard;
