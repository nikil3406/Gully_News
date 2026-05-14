import express from "express";
import { createPost, getPosts, getPostById } from "../controllers/postController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createPost);
router.get("/", getPosts);
router.get("/:id", getPostById);

export default router;
