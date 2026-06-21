import pool from "../db.js";

export const createPost = async (req, res) => {
  const { title, content, image_url, video_url, category_id, location_id } = req.body;
  const user_id = req.user.userId;

  try {
    const newPost = await pool.query(
      "INSERT INTO posts (user_id, title, content, image_url, video_url, category_id, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        user_id, 
        title, 
        content, 
        image_url || null, 
        video_url || null, 
        category_id ? parseInt(category_id) : null, 
        location_id ? parseInt(location_id) : null
      ]
    );

    // Fetch details for socket emission (joins author and category)
    try {
      const postWithDetails = await pool.query(
        `SELECT p.*, COALESCE(u.username, u.email) as author, u.profile_image as author_image, c.name as category,
                false as is_liked_by_user
         FROM posts p 
         LEFT JOIN users u ON p.user_id = u.id 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = $1`,
        [newPost.rows[0].id]
      );
      const io = req.app.get("io");
      if (io && postWithDetails.rows.length > 0) {
        io.emit("post_created", postWithDetails.rows[0]);
      }
    } catch (errSocket) {
      console.error("Error emitting socket event for createPost:", errSocket);
    }

    res.status(201).json(newPost.rows[0]);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: err.message });
  }
};


export const getPosts = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const { cursor, limit = 5, category_id, search } = req.query;

    const parsedLimit = parseInt(limit, 10) || 5;
    const queryLimit = parsedLimit + 1;

    let queryParams = [userId];
    let paramIndex = 2; // $1 is userId

    let whereClauses = [];

    // Category filter
    if (category_id) {
      whereClauses.push(`p.category_id = $${paramIndex}`);
      queryParams.push(parseInt(category_id, 10));
      paramIndex++;
    }

    // Search filter
    if (search) {
      whereClauses.push(`(p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Cursor filter
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
        const { created_at, id } = decoded;
        if (created_at && id) {
          whereClauses.push(
            `(p.created_at < $${paramIndex} OR (p.created_at = $${paramIndex} AND p.id < $${paramIndex + 1}))`
          );
          queryParams.push(new Date(created_at));
          queryParams.push(parseInt(id, 10));
          paramIndex += 2;
        }
      } catch (err) {
        console.error("Invalid cursor format:", err);
      }
    }

    const whereClauseStr = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const query = `
      SELECT p.*, COALESCE(u.username, u.email) as author, u.profile_image as author_image, c.name as category,
             EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked_by_user
      FROM posts p 
      LEFT JOIN users u ON p.user_id = u.id 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${whereClauseStr}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT $${paramIndex}
    `;

    queryParams.push(queryLimit);

    const result = await pool.query(query, queryParams);
    const rows = result.rows;

    const hasMore = rows.length > parsedLimit;
    const posts = hasMore ? rows.slice(0, parsedLimit) : rows;

    let nextCursor = null;
    if (posts.length > 0 && hasMore) {
      const lastPost = posts[posts.length - 1];
      const cursorObj = {
        created_at: lastPost.created_at,
        id: lastPost.id
      };
      nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString("base64");
    }

    res.json({
      posts,
      nextCursor,
      hasMore
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getPostById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.userId : null;
  try {
    const post = await pool.query(
      `SELECT p.*, COALESCE(u.username, u.email) as author, u.profile_image as author_image, c.name as category,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) as is_liked_by_user
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id, userId]
    );


    if (post.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post.rows[0]);
  } catch (err) {
    console.error("Error fetching post by ID:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json(categories.rows);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: err.message });
  }
};

export const toggleLike = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const likeCheck = await pool.query(
      "SELECT * FROM likes WHERE user_id = $1 AND post_id = $2",
      [userId, id]
    );

    let liked = false;
    if (likeCheck.rows.length > 0) {
      // Unlike
      await pool.query("DELETE FROM likes WHERE user_id = $1 AND post_id = $2", [userId, id]);
      await pool.query("UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1", [id]);
      liked = false;
    } else {
      // Like
      await pool.query("INSERT INTO likes (user_id, post_id) VALUES ($1, $2)", [userId, id]);
      await pool.query("UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1", [id]);
      liked = true;
    }

    try {
      const updatedPost = await pool.query("SELECT likes_count FROM posts WHERE id = $1", [id]);
      const io = req.app.get("io");
      if (io && updatedPost.rows.length > 0) {
        io.emit("post_likes_updated", { id: parseInt(id, 10), likes_count: updatedPost.rows[0].likes_count });
      }
    } catch (errSocket) {
      console.error("Error emitting post_likes_updated:", errSocket);
    }

    res.json({ liked });
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ error: err.message });
  }
};

export const incrementView = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE posts SET views_count = views_count + 1 WHERE id = $1", [id]);

    try {
      const updatedPost = await pool.query("SELECT views_count FROM posts WHERE id = $1", [id]);
      const io = req.app.get("io");
      if (io && updatedPost.rows.length > 0) {
        io.emit("post_views_updated", { id: parseInt(id, 10), views_count: updatedPost.rows[0].views_count });
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
    // Check if the post exists and user is the author
    const postCheck = await pool.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (postCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    // Delete associated likes
    await pool.query("DELETE FROM likes WHERE post_id = $1", [id]);

    // Delete associated comments
    await pool.query("DELETE FROM comments WHERE post_id = $1", [id]);

    // Delete the post
    await pool.query("DELETE FROM posts WHERE id = $1", [id]);

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
