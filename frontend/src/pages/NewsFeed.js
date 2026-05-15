import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ArticleCard from '../components/ArticleCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';

import { useNavigate } from 'react-router-dom';

function NewsFeed() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [postsRes, catsRes] = await Promise.all([
          fetch('http://localhost:5000/api/posts'),
          fetch('http://localhost:5000/api/posts/categories')
        ]);

        if (postsRes.ok && catsRes.ok) {
          const posts = await postsRes.json();
          const cats = await catsRes.json();
          setArticles(posts);
          setFilteredArticles(posts);
          setCategories(cats);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // Filter articles based on category and search
  useEffect(() => {
    let filtered = articles;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category_id === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  }, [selectedCategory, searchTerm, articles]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div>Loading Gully News...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header />
      
      <div style={styles.mainContent}>
        <div style={styles.sidebar}>
          {isAuthenticated && (
            <div style={styles.createPostSection}>
              <button 
                style={styles.createPostButton}
                onClick={() => navigate('/create-post')}
              >
                ✍️ Create New Post
              </button>
            </div>
          )}

          <SearchBar onSearch={handleSearch} />
          <CategoryFilter 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
        </div>
        
        <div style={styles.content}>
          {filteredArticles.length === 0 ? (
            <div style={styles.noResults}>
              <h3>No articles found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    display: 'flex',
    gap: '20px',
  },
  sidebar: {
    width: '280px',
    position: 'sticky',
    top: '80px',
    height: 'fit-content',
  },
  content: {
    flex: 1,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
  },
  noResults: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  createPostSection: {
    marginBottom: '20px',
  },
  createPostButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
  },
};

export default NewsFeed;
