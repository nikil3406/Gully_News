import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email=$1 OR username=$2",
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );

    res.json(newUser.rows[0]);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userData = user.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      userData.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: userData.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const userResult = await pool.query(
      "SELECT id, username, email, profile_image, bio, reputation_score, followers_count, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const postsResult = await pool.query(
      `SELECT p.*, COALESCE(u.username, u.email) as author, c.name as category 
       FROM posts p 
       LEFT JOIN users u ON p.user_id = u.id 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({
      user: userResult.rows[0],
      posts: postsResult.rows
    });

  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user.userId;
  const { username, email, bio, profile_image } = req.body;

  try {
    // Check if new username or email is already taken by another user
    const checkUser = await pool.query(
      "SELECT * FROM users WHERE (username = $1 OR email = $2) AND id != $3",
      [username, email, userId]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: "Username or email already taken" });
    }

    const updatedUser = await pool.query(
      "UPDATE users SET username = $1, email = $2, bio = $3, profile_image = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, username, email, profile_image, bio, reputation_score, followers_count, created_at",
      [username, email, bio, profile_image, userId]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser.rows[0]);

  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: err.message });
  }
};