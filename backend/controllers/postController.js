import pool from "../db.js";

export const createPost = async (req, res) => {
  const { title, content, image_url, video_url, category_id, location_id } = req.body;
  const user_id = req.user.userId;

  try {
    const newPost = await pool.query(
      "INSERT INTO posts (user_id, title, content, image_url, video_url, category_id, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        user_id, 
        title, 
        content, 
        image_url || null, 
        video_url || null, 
        category_id ? parseInt(category_id) : null, 
        location_id ? parseInt(location_id) : null
      ]
    );

    res.status(201).json(newPost.rows[0]);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: err.message });
  }
};


export const getPosts = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const posts = await pool.query(
      `SELECT p.*, COALESCE(u.username, u.email) as author, c.name as category,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked_by_user
       FROM posts p 
       LEFT JOIN users u ON p.user_id = u.id 
       LEFT JOIN categories c ON p.category_id = c.id 
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(posts.rows);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getPostById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.userId : null;
  try {
    const post = await pool.query(
      `SELECT p.*, COALESCE(u.username, u.email) as author, c.name as category,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) as is_liked_by_user
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id, userId]
    );


    if (post.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post.rows[0]);
  } catch (err) {
    console.error("Error fetching post by ID:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json(categories.rows);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: err.message });
  }
};

export const toggleLike = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const likeCheck = await pool.query(
      "SELECT * FROM likes WHERE user_id = $1 AND post_id = $2",
      [userId, id]
    );

    if (likeCheck.rows.length > 0) {
      // Unlike
      await pool.query("DELETE FROM likes WHERE user_id = $1 AND post_id = $2", [userId, id]);
      await pool.query("UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1", [id]);
      res.json({ liked: false });
    } else {
      // Like
      await pool.query("INSERT INTO likes (user_id, post_id) VALUES ($1, $2)", [userId, id]);
      await pool.query("UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1", [id]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ error: err.message });
  }
};

export const incrementView = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE posts SET views_count = views_count + 1 WHERE id = $1", [id]);
    res.json({ message: "View incremented" });
  } catch (err) {
    console.error("Error incrementing view:", err);
    res.status(500).json({ error: err.message });
  }
};
