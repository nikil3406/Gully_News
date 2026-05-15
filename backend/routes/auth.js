import express from "express";
import { register, login, getProfile, updateProfile, toggleFollow } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.post("/:id/follow", verifyToken, toggleFollow);

export default router;