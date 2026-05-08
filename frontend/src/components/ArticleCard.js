import React from 'react';

function ArticleCard({ article }) {
  const isAuthenticated = !!localStorage.getItem('token');
  return (
    <div style={styles.card}>
      {article.image_url && (
        <img src={article.image_url} alt={article.title} style={styles.image} />
      )}
      <div style={styles.content}>
        <div style={styles.category}>{article.category}</div>
        <h3 style={styles.title}>{article.title}</h3>
        <p style={styles.summary}>{article.summary}</p>
        <div style={styles.meta}>
          <span style={styles.author}>{article.author}</span>
          <span style={styles.date}>{new Date(article.created_at).toLocaleDateString()}</span>
        </div>
        <div style={styles.stats}>
          <span style={styles.stat}>👁 {article.views_count}</span>
          {isAuthenticated ? (
            <button style={styles.interactiveButton}>
              ❤️ {article.likes_count}
            </button>
          ) : (
            <span style={styles.stat}>❤️ {article.likes_count}</span>
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
};

export default ArticleCard;
