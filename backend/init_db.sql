-- Core Tables for Gully News
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image TEXT,
    bio TEXT,
    reputation_score INT DEFAULT 0,
    followers_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- 3. locations
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    city VARCHAR(255) NOT NULL,
    area VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255)
);

-- 4. posts
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    location_id INT REFERENCES locations(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    location_geom GEOGRAPHY(Point, 4326),
    ai_score FLOAT DEFAULT 0.0,
    ai_status VARCHAR(50) DEFAULT 'review', -- approved/rejected/review
    moderation_reason TEXT,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_location_geom ON posts USING gist(location_geom);

-- 5. comments
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. likes
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_post_like UNIQUE(user_id, post_id)
);

-- 7. followers
CREATE TABLE IF NOT EXISTS followers (
    id SERIAL PRIMARY KEY,
    follower_id INT REFERENCES users(id) ON DELETE CASCADE,
    following_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. saved_posts
CREATE TABLE IF NOT EXISTS saved_posts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate categories as per example
INSERT INTO categories (name) VALUES 
('Traffic'), 
('Crime'), 
('Weather'), 
('Sports'), 
('Politics'), 
('Events')
ON CONFLICT (name) DO NOTHING;

-- INDEXES
-- POSTS
CREATE INDEX IF NOT EXISTS idx_posts_user_id
ON posts(user_id);

CREATE INDEX IF NOT EXISTS idx_posts_category_id
ON posts(category_id);

CREATE INDEX IF NOT EXISTS idx_posts_location_id
ON posts(location_id);

CREATE INDEX IF NOT EXISTS idx_posts_created_at
ON posts(created_at DESC);

-- COMMENTS
CREATE INDEX IF NOT EXISTS idx_comments_post_created
ON comments(post_id, created_at DESC);

-- LIKES
CREATE INDEX IF NOT EXISTS idx_likes_post_id
ON likes(post_id);

-- FOLLOWERS
CREATE INDEX IF NOT EXISTS idx_followers_following_id
ON followers(following_id);

CREATE INDEX IF NOT EXISTS idx_followers_follower_id
ON followers(follower_id);
