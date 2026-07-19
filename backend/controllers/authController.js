import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getAccessTokenSecret, getRefreshTokenSecret } from "../middleware/authMiddleware.js";

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

    const accessToken = jwt.sign(
      { userId: userData.id },
      getAccessTokenSecret(),
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: userData.id },
      getRefreshTokenSecret(),
      { expiresIn: "7d" }
    );

    // Save refresh token in DB
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
      [userData.id, refreshToken]
    );

    // Set refresh token inside secure HTTP-Only cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ token: accessToken });

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
      `SELECT p.*, COALESCE(u.username, u.email) as author, c.name as category,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked_by_user
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

export const toggleFollow = async (req, res) => {
  const { id } = req.params; // Target user ID
  const followerId = req.user.userId;

  if (parseInt(id) === followerId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    const followCheck = await pool.query(
      "SELECT * FROM followers WHERE follower_id = $1 AND following_id = $2",
      [followerId, id]
    );

    if (followCheck.rows.length > 0) {
      // Unfollow
      await pool.query("DELETE FROM followers WHERE follower_id = $1 AND following_id = $2", [followerId, id]);
      await pool.query("UPDATE users SET followers_count = followers_count - 1 WHERE id = $1", [id]);
      res.json({ followed: false });
    } else {
      // Follow
      await pool.query("INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)", [followerId, id]);
      await pool.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = $1", [id]);
      res.json({ followed: true });
    }
  } catch (err) {
    console.error("Error toggling follow:", err);
    res.status(500).json({ error: err.message });
  }
};

export const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json([]);
  }

  try {
    const result = await pool.query(
      `SELECT id, username, email, profile_image, bio, reputation_score, followers_count 
       FROM users 
       WHERE username ILIKE $1 OR email ILIKE $1 
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getUserProfileById = async (req, res) => {
  const { id } = req.params;
  const viewerId = req.user ? req.user.userId : null;

  try {
    // Get user details
    const userResult = await pool.query(
      `SELECT id, username, email, profile_image, bio, reputation_score, followers_count, created_at
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the viewer is following this user
    let isFollowing = false;
    if (viewerId) {
      const followCheck = await pool.query(
        "SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = $2",
        [viewerId, id]
      );
      isFollowing = followCheck.rows.length > 0;
    }

    // Get user's posts
    const postsResult = await pool.query(
      `SELECT p.*, COALESCE(u.username, u.email) as author, c.name as category,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) as is_liked_by_user
       FROM posts p 
       LEFT JOIN users u ON p.user_id = u.id 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [id, viewerId]
    );

    res.json({
      user: {
        ...userResult.rows[0],
        is_following: isFollowing
      },
      posts: postsResult.rows
    });
  } catch (err) {
    console.error("Get user profile by id error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not provided" });
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshTokenSecret());

    // Verify token exists in database
    const dbTokenResult = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2",
      [refreshToken, decoded.userId]
    );

    if (dbTokenResult.rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      getAccessTokenSecret(),
      { expiresIn: "15m" }
    );

    res.json({ token: newAccessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
    } catch (err) {
      console.error("Logout database error:", err);
    }
  }

  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  });

  res.json({ message: "Logged out successfully" });
};