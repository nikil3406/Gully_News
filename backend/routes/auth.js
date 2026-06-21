import express from "express";
import { register, login, getProfile, updateProfile, toggleFollow, searchUsers, getUserProfileById, refresh, logout } from "../controllers/authController.js";
import { verifyToken, optionalVerifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.post("/:id/follow", verifyToken, toggleFollow);

// User search and public profile
router.get("/users/search", searchUsers);
router.get("/profile/:id", optionalVerifyToken, getUserProfileById);

export default router;