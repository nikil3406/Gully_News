import express from "express";
import { createPost, getPosts, getPostById, getCategories } from "../controllers/postController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createPost);
router.get("/", getPosts);
router.get("/categories", getCategories);
router.get("/:id", getPostById);


export default router;
