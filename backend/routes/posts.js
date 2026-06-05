import express from "express";
import { createPost, getPosts, getPostById, getCategories, toggleLike, incrementView, deletePost } from "../controllers/postController.js";
import { getComments, addComment, deleteComment } from "../controllers/commentController.js";
import { verifyToken, optionalVerifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createPost);
router.get("/", optionalVerifyToken, getPosts);

router.get("/categories", getCategories);
router.get("/:id", optionalVerifyToken, getPostById);
router.post("/:id/like", verifyToken, toggleLike);
router.post("/:id/view", incrementView);
router.delete("/:id", verifyToken, deletePost);

// Comments routes
router.get("/:id/comments", getComments);
router.post("/:id/comments", verifyToken, addComment);
router.delete("/:id/comments/:commentId", verifyToken, deleteComment);


export default router;
