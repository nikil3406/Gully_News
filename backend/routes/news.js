import express from "express";
import { getNearbyPosts } from "../controllers/postController.js";
import { optionalVerifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/nearby", optionalVerifyToken, (req, res, next) => {
  if (!req.query.latitude || !req.query.longitude) {
    return res.status(200).json({ posts: [], nextCursor: null, hasMore: false });
  }
  return getNearbyPosts(req, res, next);
});

export default router;
