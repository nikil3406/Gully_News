import pool from "../db.js";

export const createPost = async (req, res) => {
  const { title, content, image_url, video_url, category_id, location_id } = req.body;
  const user_id = req.user.userId; // From verifyToken middleware

  try {
    const newPost = await pool.query(
      "INSERT INTO posts (user_id, title, content, image_url, video_url, category_id, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [user_id, title, content, image_url, video_url, category_id, location_id]
    );

    res.status(201).json(newPost.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await pool.query(
      `SELECT p.*, u.username, c.name as category_name 
       FROM posts p 
       LEFT JOIN users u ON p.user_id = u.id 
       LEFT JOIN categories c ON p.category_id = c.id 
       ORDER BY p.created_at DESC`
    );
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await pool.query(
      "SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = $1",
      [id]
    );

    if (post.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
