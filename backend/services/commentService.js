import pool from "../db.js";

export const getCommentsByPostId = async (postId) => {
  const comments = await pool.query(
    `SELECT c.*, COALESCE(u.username, u.email) as author, u.profile_image 
     FROM comments c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.post_id = $1 
     ORDER BY c.created_at ASC`,
    [postId]
  );
  return comments.rows;
};

export const checkPostExists = async (postId) => {
  const postCheck = await pool.query("SELECT id FROM posts WHERE id = $1", [postId]);
  return postCheck.rows.length > 0;
};

export const createComment = async (userId, postId, content) => {
  const newCommentResult = await pool.query(
    "INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING id",
    [userId, postId, content.trim()]
  );
  const newCommentId = newCommentResult.rows[0].id;

  await pool.query(
    "UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1",
    [postId]
  );

  const fullComment = await pool.query(
    `SELECT c.*, COALESCE(u.username, u.email) as author, u.profile_image 
     FROM comments c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.id = $1`,
    [newCommentId]
  );

  const updatedPost = await pool.query("SELECT comments_count FROM posts WHERE id = $1", [postId]);

  return {
    comment: fullComment.rows[0],
    commentsCount: updatedPost.rows[0]?.comments_count || 0
  };
};

export const findCommentByIdAndPost = async (commentId, postId) => {
  const result = await pool.query(
    "SELECT * FROM comments WHERE id = $1 AND post_id = $2",
    [commentId, postId]
  );
  return result.rows[0] || null;
};

export const deleteCommentById = async (commentId, postId) => {
  await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);

  await pool.query(
    "UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = $1",
    [postId]
  );

  const updatedPost = await pool.query("SELECT comments_count FROM posts WHERE id = $1", [postId]);

  return {
    commentsCount: updatedPost.rows[0]?.comments_count || 0
  };
};
