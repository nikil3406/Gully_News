import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

function CreatePost() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    location_id: '',
    image_url: '',
    video_url: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/posts/categories');
        // Wait, I didn't implement getCategories route yet. I'll need to add it.
        // For now, I'll use a hardcoded list or add the route.
        // I'll add the route to backend after this.
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, [navigate]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create post');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <div style={styles.formCard}>
          <h1 style={styles.title}>Create News Post</h1>
          <p style={styles.subtitle}>Share what's happening in your gully</p>
          
          {error && <div style={styles.error}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What's the news?"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Image URL (Optional)</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Content</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write the full story here..."
                style={styles.textarea}
                required
              />
            </div>

            <button 
              type="submit" 
              style={styles.button}
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: '#f4f7f6',
    minHeight: '100vh',
  },
  container: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '0 20px',
  },
  formCard: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '32px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  row: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    outline: 'none',
    backgroundColor: '#fff',
  },
  textarea: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    outline: 'none',
    minHeight: '200px',
    resize: 'vertical',
  },
  button: {
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.2s',
  },
  error: {
    backgroundColor: '#fff1f0',
    border: '1px solid #ffa39e',
    color: '#cf1322',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
};

export default CreatePost;
