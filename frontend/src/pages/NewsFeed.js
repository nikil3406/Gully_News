import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ArticleCard from '../components/ArticleCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';

function NewsFeed() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Mock data for now
  useEffect(() => {
    // Mock articles data
    const mockArticles = [
      {
        id: 1,
        title: "Annual Community Festival This Weekend",
        summary: "The annual Downtown Community Festival is set to take place this weekend at Central Park. The event will feature local vendors, live music, and activities for all ages.",
        content: "Full article content here...",
        author: "Alex Johnson",
        category: "Local News",
        category_id: 1,
        image_url: "https://via.placeholder.com/600x400",
        views_count: 245,
        likes_count: 18,
        comments_count: 7,
        is_trending: true,
        created_at: "2024-01-15T10:00:00Z"
      },
      {
        id: 2,
        title: "Local High School Wins Regional Championship",
        summary: "Westside High School's basketball team brought home the regional championship trophy after an exciting game against their rivals.",
        content: "Full article content here...",
        author: "Sarah Chen",
        category: "Sports",
        category_id: 2,
        image_url: "https://via.placeholder.com/600x400",
        views_count: 189,
        likes_count: 25,
        comments_count: 12,
        is_trending: true,
        created_at: "2024-01-14T15:30:00Z"
      },
      {
        id: 3,
        title: "New Coffee Shop Opens on Main Street",
        summary: "A new artisanal coffee shop opened its doors on Main Street this week, offering locally roasted beans and homemade pastries.",
        content: "Full article content here...",
        author: "Alex Johnson",
        category: "Business",
        category_id: 3,
        image_url: "https://via.placeholder.com/600x400",
        views_count: 156,
        likes_count: 14,
        comments_count: 5,
        is_trending: false,
        created_at: "2024-01-13T09:15:00Z"
      },
      {
        id: 4,
        title: "School Board Approves New Technology Initiative",
        summary: "The local school board has approved a comprehensive technology initiative to provide tablets for all middle school students.",
        content: "Full article content here...",
        author: "Mike Wilson",
        category: "Education",
        category_id: 4,
        image_url: "https://via.placeholder.com/600x400",
        views_count: 98,
        likes_count: 8,
        comments_count: 3,
        is_trending: false,
        created_at: "2024-01-12T14:20:00Z"
      },
      {
        id: 5,
        title: "Community Health Fair Offers Free Screenings",
        summary: "Local healthcare providers are offering free health screenings and wellness information at this weekend's community health fair.",
        content: "Full article content here...",
        author: "Sarah Chen",
        category: "Health",
        category_id: 5,
        image_url: "https://via.placeholder.com/600x400",
        views_count: 134,
        likes_count: 11,
        comments_count: 6,
        is_trending: false,
        created_at: "2024-01-11T11:45:00Z"
      }
    ];

    // Mock categories data
    const mockCategories = [
      { id: 1, name: 'Local News', color: '#007bff' },
      { id: 2, name: 'Sports', color: '#28a745' },
      { id: 3, name: 'Business', color: '#ffc107' },
      { id: 4, name: 'Education', color: '#17a2b8' },
      { id: 5, name: 'Health', color: '#dc3545' },
      { id: 6, name: 'Entertainment', color: '#6f42c1' }
    ];

    setArticles(mockArticles);
    setCategories(mockCategories);
    setFilteredArticles(mockArticles);
    setLoading(false);
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
              <button style={styles.createPostButton}>
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
