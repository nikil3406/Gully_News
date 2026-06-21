import pool from "../db.js";

// Fetch all comments for a specific post
export const getComments = async (req, res) => {
  const { id } = req.params; // post_id

  try {
    const comments = await pool.query(
      `SELECT c.*, COALESCE(u.username, u.email) as author, u.profile_image 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.post_id = $1 
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.json(comments.rows);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ error: err.message });
  }
};

// Add a new comment to a post
export const addComment = async (req, res) => {
  const { id } = req.params; // post_id
  const { content } = req.body;
  const userId = req.user.userId;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment content cannot be empty" });
  }

  try {
    // 1. Check if post exists
    const postCheck = await pool.query("SELECT id FROM posts WHERE id = $1", [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 2. Insert new comment
    const newCommentResult = await pool.query(
      "INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING id",
      [userId, id, content.trim()]
    );

    const newCommentId = newCommentResult.rows[0].id;

    // 3. Increment comments count in posts table
    await pool.query(
      "UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1",
      [id]
    );

    // 4. Fetch the full comment details with user information to return to client
    const fullComment = await pool.query(
      `SELECT c.*, COALESCE(u.username, u.email) as author, u.profile_image 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = $1`,
      [newCommentId]
    );

    try {
      const updatedPost = await pool.query("SELECT comments_count FROM posts WHERE id = $1", [id]);
      const io = req.app.get("io");
      if (io && updatedPost.rows.length > 0) {
        io.to(`post_${id}`).emit("comment_added", fullComment.rows[0]);
        io.emit("post_comments_updated", { id: parseInt(id, 10), comments_count: updatedPost.rows[0].comments_count });
      }
    } catch (errSocket) {
      console.error("Error emitting comment_added event:", errSocket);
    }

    res.status(201).json(fullComment.rows[0]);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  const { id, commentId } = req.params; // post_id and comment_id
  const userId = req.user.userId;

  try {
    // 1. Fetch comment to verify existence and check authorization
    const commentCheck = await pool.query(
      "SELECT * FROM comments WHERE id = $1 AND post_id = $2",
      [commentId, id]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const comment = commentCheck.rows[0];

    // 2. Check if user is the author of the comment
    if (comment.user_id !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this comment" });
    }

    // 3. Delete the comment
    await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);

    // 4. Decrement comments count in posts table
    await pool.query(
      "UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = $1",
      [id]
    );

    try {
      const updatedPost = await pool.query("SELECT comments_count FROM posts WHERE id = $1", [id]);
      const io = req.app.get("io");
      if (io && updatedPost.rows.length > 0) {
        io.to(`post_${id}`).emit("comment_deleted", { commentId: parseInt(commentId, 10) });
        io.emit("post_comments_updated", { id: parseInt(id, 10), comments_count: updatedPost.rows[0].comments_count });
      }
    } catch (errSocket) {
      console.error("Error emitting comment_deleted event:", errSocket);
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: err.message });
  }
};
