import { normalizeNumber } from "../utils/normalize.js";
import * as postService from "../services/postService.js";

export const createPost = async (req, res) => {
  const { title, content, image_url, video_url, category_id, location_id, latitude, longitude, city, state, country } = req.body;
  const user_id = req.user.userId;

  const lat = normalizeNumber(latitude);
  const lng = normalizeNumber(longitude);

  if ((lat !== null && lng === null) || (lat === null && lng !== null)) {
    return res.status(400).json({ error: "Both latitude and longitude must be provided together." });
  }
  if (lat !== null && (lat < -90 || lat > 90)) {
    return res.status(400).json({ error: "Latitude must be between -90 and 90." });
  }
  if (lng !== null && (lng < -180 || lng > 180)) {
    return res.status(400).json({ error: "Longitude must be between -180 and 180." });
  }

  try {
    const { rawPost, fullPost } = await postService.createPostRecord(req.body, user_id);

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("post_created", fullPost);
      }
    } catch (errSocket) {
      console.error("Error emitting socket event for createPost:", errSocket);
    }

    res.status(201).json(rawPost);
  } catch (err) {
    console.error("Error creating post:", err);
    if (err.code === '42703') {
      return res.status(400).json({ error: 'The database schema for posts is missing one of the expected columns.' });
    }
    res.status(500).json({ error: err.message || 'Failed to create post' });
  }
};

export const getPosts = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const { cursor, limit, category_id, search } = req.query;

    const result = await postService.fetchPostsWithPagination({ userId, cursor, limit, category_id, search });
    res.json(result);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getPostById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.userId : null;

  try {
    const post = await postService.fetchPostById(id, userId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    console.error("Error fetching post by ID:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await postService.fetchCategories();
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: err.message });
  }
};

export const toggleLike = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const { liked, likesCount } = await postService.togglePostLike(id, userId);

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("post_likes_updated", { id: parseInt(id, 10), likes_count: likesCount });
      }
    } catch (errSocket) {
      console.error("Error emitting post_likes_updated:", errSocket);
    }

    res.json({ liked, likes_count: likesCount });
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ error: err.message });
  }
};

export const incrementView = async (req, res) => {
  const { id } = req.params;
  try {
    const viewsCount = await postService.incrementPostView(id);

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("post_views_updated", { id: parseInt(id, 10), views_count: viewsCount });
      }
    } catch (errSocket) {
      console.error("Error emitting post_views_updated:", errSocket);
    }

    res.json({ message: "View incremented" });
  } catch (err) {
    console.error("Error incrementing view:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const postOwner = await postService.findPostOwner(id);
    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (postOwner.user_id !== userId) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await postService.deletePostRecord(id);

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("post_deleted", parseInt(id, 10));
      }
    } catch (errSocket) {
      console.error("Error emitting socket event for deletePost:", errSocket);
    }

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getNearbyPosts = async (req, res) => {
  const userId = req.user ? req.user.userId : null;
  const { latitude, longitude, radius = 50, cursor, limit = 5 } = req.query;

  if (latitude === undefined || longitude === undefined || latitude === "" || longitude === "") {
    return res.status(400).json({ error: "Latitude and longitude are required query parameters." });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const rad = parseFloat(radius);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return res.status(400).json({ error: "Invalid latitude. Must be between -90 and 90." });
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    return res.status(400).json({ error: "Invalid longitude. Must be between -180 and 180." });
  }
  if (isNaN(rad) || rad <= 0) {
    return res.status(400).json({ error: "Invalid radius. Must be a positive number." });
  }

  try {
    const result = await postService.fetchNearbyPosts({ latitude, longitude, radius, cursor, limit, userId });
    res.json(result);
  } catch (err) {
    console.error("Error fetching nearby posts:", err);
    res.status(500).json({ error: err.message });
  }
};
