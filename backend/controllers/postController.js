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
    const posts = await pool.query(
      `SELECT p.*, COALESCE(u.username, u.email) as author, c.name as category 
       FROM posts p 
       LEFT JOIN users u ON p.user_id = u.id 
       LEFT JOIN categories c ON p.category_id = c.id 
       ORDER BY p.created_at DESC`
    );


    res.json(posts.rows);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await pool.query(
      "SELECT p.*, COALESCE(u.username, u.email) as author FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = $1",
      [id]
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

