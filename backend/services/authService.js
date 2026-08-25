import pool from "../db.js";

export const findUserByEmailOrUsername = async (email, username) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1 OR username=$2",
    [email, username]
  );
  return result.rows[0] || null;
};

export const createUser = async (username, email, passwordHash) => {
  const result = await pool.query(
    "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
    [username, email, passwordHash]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );
  return result.rows[0] || null;
};

export const saveRefreshToken = async (userId, refreshToken) => {
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
    [userId, refreshToken]
  );
};

export const deleteRefreshToken = async (refreshToken) => {
  await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
};

export const verifyRefreshTokenInDb = async (refreshToken, userId) => {
  const result = await pool.query(
    "SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2",
    [refreshToken, userId]
  );
  return result.rows.length > 0;
};

export const getUserDetails = async (identifier) => {
  let result;
  if (/^\d+$/.test(String(identifier))) {
    result = await pool.query(
      "SELECT id, username, email, profile_image, bio, reputation_score, followers_count, created_at FROM users WHERE id = $1",
      [parseInt(identifier, 10)]
    );
  }
  if (!result || result.rows.length === 0) {
    result = await pool.query(
      "SELECT id, username, email, profile_image, bio, reputation_score, followers_count, created_at FROM users WHERE LOWER(username) = LOWER($1)",
      [identifier]
    );
  }
  return result.rows[0] || null;
};

export const getUserPosts = async (userId, viewerId = null) => {
  const result = await pool.query(
    `SELECT p.*, COALESCE(u.username, u.email) as author, c.name as category,
            EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) as is_liked_by_user
     FROM posts p 
     LEFT JOIN users u ON p.user_id = u.id 
     LEFT JOIN categories c ON p.category_id = c.id 
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId, viewerId]
  );
  return result.rows;
};

export const checkUserTaken = async (username, email, excludeUserId) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE (username = $1 OR email = $2) AND id != $3",
    [username, email, excludeUserId]
  );
  return result.rows.length > 0;
};

export const updateUserProfile = async (userId, { username, email, bio, profile_image }) => {
  const result = await pool.query(
    "UPDATE users SET username = $1, email = $2, bio = $3, profile_image = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, username, email, profile_image, bio, reputation_score, followers_count, created_at",
    [username, email, bio, profile_image, userId]
  );
  return result.rows[0] || null;
};

export const toggleFollow = async (followerId, targetId) => {
  const followCheck = await pool.query(
    "SELECT * FROM followers WHERE follower_id = $1 AND following_id = $2",
    [followerId, targetId]
  );

  if (followCheck.rows.length > 0) {
    await pool.query("DELETE FROM followers WHERE follower_id = $1 AND following_id = $2", [followerId, targetId]);
    await pool.query("UPDATE users SET followers_count = followers_count - 1 WHERE id = $1", [targetId]);
    return { followed: false };
  } else {
    await pool.query("INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)", [followerId, targetId]);
    await pool.query("UPDATE users SET followers_count = followers_count + 1 WHERE id = $1", [targetId]);
    return { followed: true };
  }
};

export const searchUsersInDb = async (query) => {
  const result = await pool.query(
    `SELECT id, username, email, profile_image, bio, reputation_score, followers_count 
     FROM users 
     WHERE username ILIKE $1 OR email ILIKE $1 
     LIMIT 10`,
    [`%${query}%`]
  );
  return result.rows;
};

export const checkIsFollowing = async (followerId, followingId) => {
  if (!followerId) return false;
  const result = await pool.query(
    "SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = $2",
    [followerId, followingId]
  );
  return result.rows.length > 0;
};
