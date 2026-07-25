import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getRefreshTokenSecret, generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import * as authService from "../services/authService.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await authService.findUserByEmailOrUsername(email, username);
    if (existingUser) {
      return res.status(400).json({ message: "User or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await authService.createUser(username, email, hashedPassword);

    res.json(newUser);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await authService.saveRefreshToken(user.id, refreshToken);

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ token: accessToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await authService.getUserDetails(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await authService.getUserPosts(userId, userId);

    res.json({
      user: {
        ...user,
        is_following: false
      },
      posts
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user.userId;
  const { username, email, bio, profile_image } = req.body;

  try {
    const isTaken = await authService.checkUserTaken(username, email, userId);
    if (isTaken) {
      return res.status(400).json({ message: "Username or email already taken" });
    }

    const updatedUser = await authService.updateUserProfile(userId, { username, email, bio, profile_image });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const toggleFollow = async (req, res) => {
  const { id } = req.params;
  const followerId = req.user.userId;

  if (parseInt(id, 10) === followerId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    const result = await authService.toggleFollow(followerId, id);
    res.json(result);
  } catch (err) {
    console.error("Error toggling follow:", err);
    res.status(500).json({ error: err.message });
  }
};

export const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json([]);
  }

  try {
    const users = await authService.searchUsersInDb(q);
    res.json(users);
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getUserProfileById = async (req, res) => {
  const { id } = req.params;
  const viewerId = req.user ? req.user.userId : null;

  try {
    const user = await authService.getUserDetails(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = await authService.checkIsFollowing(viewerId, id);
    const posts = await authService.getUserPosts(id, viewerId);

    res.json({
      user: {
        ...user,
        is_following: isFollowing
      },
      posts
    });
  } catch (err) {
    console.error("Get user profile by id error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not provided" });
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshTokenSecret());
    const isValid = await authService.verifyRefreshTokenInDb(refreshToken, decoded.userId);

    if (!isValid) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(decoded.userId);
    res.json({ token: newAccessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      await authService.deleteRefreshToken(refreshToken);
    } catch (err) {
      console.error("Logout database error:", err);
    }
  }

  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  });

  res.json({ message: "Logged out successfully" });
};