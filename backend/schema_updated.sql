-- Enhanced users table with profile information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  bio TEXT,
  profile_image VARCHAR(500),
  is_reporter BOOLEAN DEFAULT FALSE,
  location VARCHAR(255),
  reputation_score INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#007bff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News articles table
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary VARCHAR(1000),
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  location VARCHAR(255),
  image_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'published',
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Likes table (for articles)
CREATE TABLE IF NOT EXISTS article_likes (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, user_id)
);

-- Follow relationships table
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

-- Post moderation table
CREATE TABLE IF NOT EXISTS post_moderation (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT FALSE,
  ai_score DECIMAL(3,2),
  moderation_reason TEXT,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample categories
INSERT INTO categories (name, description, color) VALUES
('Local News', 'Community updates and local events', '#007bff'),
('Sports', 'Local sports and tournaments', '#28a745'),
('Business', 'Local business news', '#ffc107'),
('Education', 'School and education news', '#17a2b8'),
('Health', 'Health and wellness updates', '#dc3545'),
('Entertainment', 'Local entertainment and culture', '#6f42c1');

-- Insert sample users (reporters)
INSERT INTO users (email, password, full_name, bio, is_reporter, location, reputation_score, is_verified) VALUES
('alex@gullynews.com', '$2b$10$dummy.hash.here', 'Alex Johnson', 'Covering local news for 5 years', TRUE, 'Downtown Area', 850, TRUE),
('sarah@gullynews.com', '$2b$10$dummy.hash.here', 'Sarah Chen', 'Sports enthusiast and local reporter', TRUE, 'Westside', 720, TRUE),
('mike@gullynews.com', '$2b$10$dummy.hash.here', 'Mike Wilson', 'Senior editor at Gully News', TRUE, 'City Center', 1200, TRUE);

-- Insert sample articles
INSERT INTO articles (title, content, summary, author_id, category_id, location, image_url, is_trending) VALUES
('Annual Community Festival This Weekend', 'The annual Downtown Community Festival is set to take place this weekend at Central Park. The event will feature local vendors, live music, and activities for all ages. Residents are encouraged to come out and support local businesses while enjoying the festive atmosphere.', 'Don''t miss the biggest community event of the year!', 1, 1, 'Downtown', 'https://via.placeholder.com/600x400', TRUE),
('Local High School Wins Regional Championship', 'Westside High School''s basketball team brought home the regional championship trophy after an exciting game against their rivals. The team showed incredible teamwork and determination throughout the tournament.', 'Congratulations to our local champions!', 2, 2, 'Westside', 'https://via.placeholder.com/600x400', TRUE),
('New Coffee Shop Opens on Main Street', 'A new artisanal coffee shop opened its doors on Main Street this week, offering locally roasted beans and homemade pastries. The owner, a longtime resident, decided to bring her passion for quality coffee to the community.', 'Check out the newest addition to our local food scene!', 1, 3, 'Downtown', 'https://via.placeholder.com/600x400', FALSE),
('School Board Approves New Technology Initiative', 'The local school board has approved a comprehensive technology initiative to provide tablets for all middle school students. The program aims to enhance digital literacy and prepare students for the future.', 'Technology funding approved for local schools!', 3, 4, 'City Center', 'https://via.placeholder.com/600x400', FALSE),
('Community Health Fair Offers Free Screenings', 'Local healthcare providers are offering free health screenings and wellness information at this weekend''s community health fair. The event includes blood pressure checks, vision screenings, and nutritional counseling.', 'Free health services available this weekend!', 2, 5, 'Westside', 'https://via.placeholder.com/600x400', FALSE);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
