import pool from "../db.js";

let hasPostgis = null;
let hasLocationColumns = null;

const checkPostgis = async () => {
  if (hasPostgis !== null) return hasPostgis;
  try {
    const res = await pool.query("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS has_postgis;");
    hasPostgis = res.rows[0].has_postgis;
  } catch (err) {
    hasPostgis = false;
  }
  return hasPostgis;
};

const checkLocationColumns = async () => {
  if (hasLocationColumns !== null) return hasLocationColumns;

  try {
    const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'posts'
    `);

    const columns = new Set(res.rows.map(row => row.column_name.toLowerCase()));
    hasLocationColumns = {
      latitude: columns.has('latitude'),
      longitude: columns.has('longitude'),
      city: columns.has('city'),
      state: columns.has('state'),
      country: columns.has('country'),
      location_geom: columns.has('location_geom'),
      location_id: columns.has('location_id')
    };
  } catch (err) {
    hasLocationColumns = {
      latitude: false,
      longitude: false,
      city: false,
      state: false,
      country: false,
      location_geom: false,
      location_id: false
    };
  }

  return hasLocationColumns;
};

export const createPost = async (req, res) => {
  const { title, content, image_url, video_url, category_id, location_id, latitude, longitude, city, state, country } = req.body;
  const user_id = req.user.userId;

  const lat = latitude !== undefined && latitude !== null && latitude !== "" ? parseFloat(latitude) : null;
  const lng = longitude !== undefined && longitude !== null && longitude !== "" ? parseFloat(longitude) : null;

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
    const isPostgisAvailable = await checkPostgis();
    const locationColumns = await checkLocationColumns();
    let newPost;

    const insertValues = [
      user_id,
      title,
      content,
      image_url || null,
      video_url || null,
      category_id ? parseInt(category_id) : null,
      location_id ? parseInt(location_id) : null,
      lat,
      lng,
      city || null,
      state || null,
      country || null
    ];

    const columnsSql = [
      'user_id', 'title', 'content', 'image_url', 'video_url', 'category_id', 'location_id'
    ];
    const values = insertValues.slice(0, 7);

    if (locationColumns.latitude && locationColumns.longitude) {
      columnsSql.push('latitude', 'longitude');
      values.push(lat, lng);
    }

    if (locationColumns.city) {
      columnsSql.push('city');
      values.push(city || null);
    }

    if (locationColumns.state) {
      columnsSql.push('state');
      values.push(state || null);
    }

    if (locationColumns.country) {
      columnsSql.push('country');
      values.push(country || null);
    }

    if (isPostgisAvailable && locationColumns.location_geom) {
      columnsSql.push('location_geom');
      values.push(
        lat !== null && lng !== null
          ? `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`
          : null
      );
    }

    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const sql = `INSERT INTO posts (${columnsSql.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    newPost = await pool.query(sql, values);

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

    let currentLikesCount = null;
    try {
      const updatedPost = await pool.query("SELECT likes_count FROM posts WHERE id = $1", [id]);
      if (updatedPost.rows.length > 0) {
        currentLikesCount = updatedPost.rows[0].likes_count;
        const io = req.app.get("io");
        if (io) {
          io.emit("post_likes_updated", { id: parseInt(id, 10), likes_count: currentLikesCount });
        }
      }
    } catch (errSocket) {
      console.error("Error emitting post_likes_updated:", errSocket);
    }

    res.json({ liked, likes_count: currentLikesCount });
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

export const getNearbyPosts = async (req, res) => {
  const userId = req.user ? req.user.userId : null;
  const { latitude, longitude, radius = 50, cursor, limit = 5 } = req.query;

  if (latitude === undefined || longitude === undefined || latitude === "" || longitude === "") {
    return res.status(400).json({ error: "Latitude and longitude are required query parameters." });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const rad = parseFloat(radius);
  const parsedLimit = parseInt(limit, 10) || 5;
  const queryLimit = parsedLimit + 1;

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
    const isPostgisAvailable = await checkPostgis();
    let query = "";
    let queryParams = [];

    let cursorDistance = null;
    let cursorId = null;

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
        cursorDistance = parseFloat(decoded.distance_km);
        cursorId = parseInt(decoded.id, 10);
      } catch (err) {
        console.error("Invalid cursor format for nearby posts:", err);
      }
    }

    if (isPostgisAvailable) {
      let cteQuery = `
        WITH nearby_posts AS (
          SELECT p.*, COALESCE(u.username, u.email) as author, u.profile_image as author_image, c.name as category,
                 (ST_Distance(p.location_geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000.0) as distance_km,
                 EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $3) as is_liked_by_user
          FROM posts p
          LEFT JOIN users u ON p.user_id = u.id
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE ST_DWithin(p.location_geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $4 * 1000.0)
        )
      `;
      if (cursorDistance !== null && !isNaN(cursorDistance) && cursorId !== null && !isNaN(cursorId)) {
        query = `${cteQuery}
          SELECT * FROM nearby_posts
          WHERE (distance_km > $5 OR (distance_km = $5 AND id > $6))
          ORDER BY distance_km ASC, id ASC
          LIMIT $7
        `;
        queryParams = [lat, lng, userId, rad, cursorDistance, cursorId, queryLimit];
      } else {
        query = `${cteQuery}
          SELECT * FROM nearby_posts
          ORDER BY distance_km ASC, id ASC
          LIMIT $5
        `;
        queryParams = [lat, lng, userId, rad, queryLimit];
      }
    } else {
      const latDelta = rad / 111.0;
      const lngDelta = rad / (111.0 * Math.cos(lat * Math.PI / 180.0));
      const minLat = lat - latDelta;
      const maxLat = lat + latDelta;
      const minLng = lng - lngDelta;
      const maxLng = lng + lngDelta;

      let cteQuery = `
        WITH nearby_posts AS (
          SELECT p.*, COALESCE(u.username, u.email) as author, u.profile_image as author_image, c.name as category,
                 (6371.0 * acos(least(1.0, greatest(-1.0, cos(radians(p.latitude)) * cos(radians($1)) * cos(radians($2) - radians(p.longitude)) + sin(radians(p.latitude)) * sin(radians($1)))))) as distance_km,
                 EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $3) as is_liked_by_user
          FROM posts p
          LEFT JOIN users u ON p.user_id = u.id
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.latitude BETWEEN $4 AND $5
            AND p.longitude BETWEEN $6 AND $7
        )
      `;

      if (cursorDistance !== null && !isNaN(cursorDistance) && cursorId !== null && !isNaN(cursorId)) {
        query = `${cteQuery}
          SELECT * FROM nearby_posts
          WHERE distance_km <= $8
            AND (distance_km > $9 OR (distance_km = $9 AND id > $10))
          ORDER BY distance_km ASC, id ASC
          LIMIT $11
        `;
        queryParams = [lat, lng, userId, minLat, maxLat, minLng, maxLng, rad, cursorDistance, cursorId, queryLimit];
      } else {
        query = `${cteQuery}
          SELECT * FROM nearby_posts
          WHERE distance_km <= $8
          ORDER BY distance_km ASC, id ASC
          LIMIT $9
        `;
        queryParams = [lat, lng, userId, minLat, maxLat, minLng, maxLng, rad, queryLimit];
      }
    }

    const result = await pool.query(query, queryParams);
    const rows = result.rows;

    const hasMore = rows.length > parsedLimit;
    const posts = hasMore ? rows.slice(0, parsedLimit) : rows;

    let nextCursor = null;
    if (posts.length > 0 && hasMore) {
      const lastPost = posts[posts.length - 1];
      const cursorObj = {
        distance_km: lastPost.distance_km,
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
    console.error("Error fetching nearby posts:", err);
    res.status(500).json({ error: err.message });
  }
};
