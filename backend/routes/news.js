import express from "express";
import { getNearbyPosts } from "../controllers/postController.js";
import { optionalVerifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/nearby", optionalVerifyToken, getNearbyPosts);

export default router;
