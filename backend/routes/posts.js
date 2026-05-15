import express from "express";
import { createPost, getPosts, getPostById, getCategories, toggleLike, incrementView } from "../controllers/postController.js";
import { verifyToken, optionalVerifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createPost);
router.get("/", optionalVerifyToken, getPosts);

router.get("/categories", getCategories);
router.get("/:id", getPostById);
router.post("/:id/like", verifyToken, toggleLike);
router.post("/:id/view", incrementView);


export default router;
