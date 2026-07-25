import * as commentService from "../services/commentService.js";

// Fetch all comments for a specific post
export const getComments = async (req, res) => {
  const { id } = req.params; // post_id

  try {
    const comments = await commentService.getCommentsByPostId(id);
    res.json(comments);
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
    const postExists = await commentService.checkPostExists(id);
    if (!postExists) {
      return res.status(404).json({ message: "Post not found" });
    }

    const { comment, commentsCount } = await commentService.createComment(userId, id, content);

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`post_${id}`).emit("comment_added", comment);
        io.emit("post_comments_updated", { id: parseInt(id, 10), comments_count: commentsCount });
      }
    } catch (errSocket) {
      console.error("Error emitting comment_added event:", errSocket);
    }

    res.status(201).json(comment);
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
    const comment = await commentService.findCommentByIdAndPost(commentId, id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this comment" });
    }

    const { commentsCount } = await commentService.deleteCommentById(commentId, id);

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`post_${id}`).emit("comment_deleted", { commentId: parseInt(commentId, 10) });
        io.emit("post_comments_updated", { id: parseInt(id, 10), comments_count: commentsCount });
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
