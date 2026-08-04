import pool from "../db.js";
import { normalizeNumber, normalizeInteger, normalizeOptionalText } from "../utils/normalize.js";
import { checkPostgis, checkLocationColumns } from "../utils/location.js";

export const createPostRecord = async (postData, user_id) => {
  const { title, content, image_url, video_url, category_id, location_id, latitude, longitude, city, state, country } = postData;
  const lat = normalizeNumber(latitude);
  const lng = normalizeNumber(longitude);

  const isPostgisAvailable = await checkPostgis(pool);
  const locationColumns = await checkLocationColumns(pool);

  const insertValues = [
    user_id,
    title,
    content,
    normalizeOptionalText(image_url),
    normalizeOptionalText(video_url),
    normalizeInteger(category_id),
    normalizeInteger(location_id),
    lat,
    lng,
    normalizeOptionalText(city),
    normalizeOptionalText(state),
    normalizeOptionalText(country)
  ];

  const columnsSql = ['user_id', 'title', 'content', 'image_url', 'video_url', 'category_id'];
  const values = insertValues.slice(0, 6);

  const normLocId = normalizeInteger(location_id);
  if (normLocId !== null) {
    columnsSql.push('location_id');
    values.push(normLocId);
  }

  let latParamIdx = null;
  let lngParamIdx = null;

  if (locationColumns.latitude && locationColumns.longitude) {
    columnsSql.push('latitude', 'longitude');
    values.push(lat, lng);
    latParamIdx = values.length - 1;
    lngParamIdx = values.length;
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

  let geomExpression = null;
  if (isPostgisAvailable && locationColumns.location_geom) {
    columnsSql.push('location_geom');
    if (lat !== null && lng !== null) {
      if (latParamIdx !== null) {
        geomExpression = `ST_SetSRID(ST_MakePoint($${lngParamIdx}, $${latParamIdx}), 4326)::geography`;
      } else {
        values.push(lng, lat);
        const lngN = values.length - 1;
        const latN = values.length;
        geomExpression = `ST_SetSRID(ST_MakePoint($${lngN}, $${latN}), 4326)::geography`;
      }
    } else {
      geomExpression = 'NULL';
    }
  }

  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  const valuesClause = geomExpression !== null ? `${placeholders}, ${geomExpression}` : placeholders;
  const sql = `INSERT INTO posts (${columnsSql.join(', ')}) VALUES (${valuesClause}) RETURNING *`;

  const newPost = await pool.query(sql, values);

  const postWithDetails = await pool.query(
    `SELECT p.*, COALESCE(u.username, u.email) as author, u.profile_image as author_image, c.name as category,
            false as is_liked_by_user
     FROM posts p 
     LEFT JOIN users u ON p.user_id = u.id 
     LEFT JOIN categories c ON p.category_id = c.id 
     WHERE p.id = $1`,
    [newPost.rows[0].id]
  );

  return {
    rawPost: newPost.rows[0],
    fullPost: postWithDetails.rows[0] || newPost.rows[0]
  };
};

export const fetchPostsWithPagination = async ({ userId, cursor, limit = 5, category_id, search }) => {
  const parsedLimit = parseInt(limit, 10) || 5;
  const queryLimit = parsedLimit + 1;

  let queryParams = [userId];
  let paramIndex = 2;

  let whereClauses = [];

  if (category_id) {
    whereClauses.push(`p.category_id = $${paramIndex}`);
    queryParams.push(parseInt(category_id, 10));
    paramIndex++;
  }

  if (search) {
    whereClauses.push(`(p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex})`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

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

  return { posts, nextCursor, hasMore };
};

export const fetchPostById = async (id, userId) => {
  const post = await pool.query(
    `SELECT p.*, COALESCE(u.username, u.email) as author, u.profile_image as author_image, c.name as category,
            EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) as is_liked_by_user
     FROM posts p 
     JOIN users u ON p.user_id = u.id 
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1`,
    [id, userId]
  );

  return post.rows[0] || null;
};

export const fetchCategories = async () => {
  const result = await pool.query("SELECT * FROM categories ORDER BY name ASC");
  return result.rows;
};

export const togglePostLike = async (id, userId) => {
  const likeCheck = await pool.query(
    "SELECT * FROM likes WHERE user_id = $1 AND post_id = $2",
    [userId, id]
  );

  let liked = false;
  if (likeCheck.rows.length > 0) {
    await pool.query("DELETE FROM likes WHERE user_id = $1 AND post_id = $2", [userId, id]);
    await pool.query("UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1", [id]);
    liked = false;
  } else {
    await pool.query("INSERT INTO likes (user_id, post_id) VALUES ($1, $2)", [userId, id]);
    await pool.query("UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1", [id]);
    liked = true;
  }

  const updatedPost = await pool.query("SELECT likes_count FROM posts WHERE id = $1", [id]);
  const likesCount = updatedPost.rows[0]?.likes_count ?? null;

  return { liked, likesCount };
};

export const incrementPostView = async (id) => {
  await pool.query("UPDATE posts SET views_count = views_count + 1 WHERE id = $1", [id]);
  const updatedPost = await pool.query("SELECT views_count FROM posts WHERE id = $1", [id]);
  return updatedPost.rows[0]?.views_count ?? 0;
};

export const findPostOwner = async (id) => {
  const result = await pool.query("SELECT user_id, image_url FROM posts WHERE id = $1", [id]);
  return result.rows[0] || null;
};

export const deletePostRecord = async (id) => {
  await pool.query("DELETE FROM likes WHERE post_id = $1", [id]);
  await pool.query("DELETE FROM comments WHERE post_id = $1", [id]);
  await pool.query("DELETE FROM posts WHERE id = $1", [id]);
};

export const fetchNearbyPosts = async ({ latitude, longitude, radius = 50, cursor, limit = 5, userId }) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const rad = parseFloat(radius);
  const parsedLimit = parseInt(limit, 10) || 5;
  const queryLimit = parsedLimit + 1;

  const isPostgisAvailable = await checkPostgis(pool);
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

  return { posts, nextCursor, hasMore };
};
