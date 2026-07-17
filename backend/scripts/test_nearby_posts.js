import pool from '../db.js';

const runTests = async () => {
  console.log("Starting backend spatial verification tests...");
  
  // 1. Check if postgis is active
  let hasPostgis = false;
  try {
    const postgisRes = await pool.query("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS has_postgis;");
    hasPostgis = postgisRes.rows[0].has_postgis;
  } catch (err) {
    hasPostgis = false;
  }
  console.log(`Database support mode: ${hasPostgis ? "PostGIS Enabled" : "Standard SQL (Haversine Bounding-Box Fallback)"}`);

  // 2. Fetch or create a test user and category to link posts
  let userId;
  let categoryId;
  try {
    const userRes = await pool.query("SELECT id FROM users LIMIT 1;");
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      // Create user
      const insUser = await pool.query(
        "INSERT INTO users (username, email, password_hash) VALUES ('test_geouser', 'testgeo@example.com', 'pwdhash') RETURNING id;"
      );
      userId = insUser.rows[0].id;
    }

    const catRes = await pool.query("SELECT id FROM categories LIMIT 1;");
    if (catRes.rows.length > 0) {
      categoryId = catRes.rows[0].id;
    } else {
      const insCat = await pool.query("INSERT INTO categories (name) VALUES ('TestCategory') RETURNING id;");
      categoryId = insCat.rows[0].id;
    }
  } catch (dbErr) {
    console.error("Failed to setup test user/category reference:", dbErr);
    process.exit(1);
  }

  // 3. Clear any old test posts to keep results clean
  try {
    await pool.query("DELETE FROM posts WHERE title LIKE 'TEST_GEO_%';");
  } catch (err) {
    console.error("Clean error:", err);
  }

  // 4. Insert test posts with different coordinates:
  // Center is Bangalore (12.9716, 77.5946)
  // Distance targets:
  // - Post A (Indiranagar, Bangalore): ~5 km away (12.9719, 77.6412)
  // - Post B (Whitefield, Bangalore): ~15 km away (12.9698, 77.7499)
  // - Post C (Kolar, Karnataka): ~65 km away (13.1368, 78.1292)
  // - Post D (Chennai, Tamil Nadu): ~290 km away (13.0827, 80.2707)
  const testPosts = [
    { title: 'TEST_GEO_Post A - Indiranagar', content: 'Very close, about 5km', lat: 12.9719, lng: 77.6412, city: 'Bangalore' },
    { title: 'TEST_GEO_Post B - Whitefield', content: 'About 15km', lat: 12.9698, lng: 77.7499, city: 'Bangalore' },
    { title: 'TEST_GEO_Post C - Kolar', content: 'About 65km', lat: 13.1368, lng: 78.1292, city: 'Kolar' },
    { title: 'TEST_GEO_Post D - Chennai', content: 'Very far, about 290km', lat: 13.0827, lng: 80.2707, city: 'Chennai' }
  ];

  for (const post of testPosts) {
    try {
      if (hasPostgis) {
        await pool.query(
          `INSERT INTO posts (user_id, category_id, title, content, latitude, longitude, city, location_geom) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography);`,
          [userId, categoryId, post.title, post.content, post.lat, post.lng, post.city]
        );
      } else {
        await pool.query(
          `INSERT INTO posts (user_id, category_id, title, content, latitude, longitude, city) 
           VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [userId, categoryId, post.title, post.content, post.lat, post.lng, post.city]
        );
      }
      console.log(`Inserted: ${post.title}`);
    } catch (insErr) {
      console.error(`Failed to insert post: ${post.title}`, insErr);
    }
  }

  // Helper query simulation
  const queryNearby = async (lat, lng, radius) => {
    let query = "";
    let queryParams = [];

    if (hasPostgis) {
      query = `
        WITH nearby_posts AS (
          SELECT id, title, city,
                 (ST_Distance(location_geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000.0) as distance_km
          FROM posts
          WHERE ST_DWithin(location_geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3 * 1000.0)
        )
        SELECT * FROM nearby_posts 
        WHERE title LIKE 'TEST_GEO_%'
        ORDER BY distance_km ASC;
      `;
      queryParams = [lat, lng, radius];
    } else {
      const latDelta = radius / 111.0;
      const lngDelta = radius / (111.0 * Math.cos(lat * Math.PI / 180.0));
      const minLat = lat - latDelta;
      const maxLat = lat + latDelta;
      const minLng = lng - lngDelta;
      const maxLng = lng + lngDelta;

      query = `
        WITH nearby_posts AS (
          SELECT id, title, city,
                 (6371.0 * acos(least(1.0, greatest(-1.0, cos(radians(latitude)) * cos(radians($1)) * cos(radians($2) - radians(longitude)) + sin(radians(latitude)) * sin(radians($1)))))) as distance_km
          FROM posts
          WHERE latitude BETWEEN $3 AND $4
            AND longitude BETWEEN $5 AND $6
        )
        SELECT * FROM nearby_posts
        WHERE distance_km <= $7 AND title LIKE 'TEST_GEO_%'
        ORDER BY distance_km ASC;
      `;
      queryParams = [lat, lng, minLat, maxLat, minLng, maxLng, radius];
    }

    const res = await pool.query(query, queryParams);
    return res.rows;
  };

  const centerLat = 12.9716;
  const centerLng = 77.5946;

  console.log("\n--- RUNNING RADIUS TEST QUERIES ---");
  
  // Test 1: Radius 10 km (should return Post A only)
  console.log("\nQuerying radius 10 km (expected: Post A only)...");
  const res10 = await queryNearby(centerLat, centerLng, 10);
  console.log(`Results: ${res10.length} posts found.`);
  res10.forEach(r => console.log(` - ${r.title} (${r.distance_km.toFixed(2)} km)`));

  // Test 2: Radius 30 km (should return Post A and B)
  console.log("\nQuerying radius 30 km (expected: Post A & Post B)...");
  const res30 = await queryNearby(centerLat, centerLng, 30);
  console.log(`Results: ${res30.length} posts found.`);
  res30.forEach(r => console.log(` - ${r.title} (${r.distance_km.toFixed(2)} km)`));

  // Test 3: Radius 100 km (should return Post A, B, and C)
  console.log("\nQuerying radius 100 km (expected: Post A, B & C)...");
  const res100 = await queryNearby(centerLat, centerLng, 100);
  console.log(`Results: ${res100.length} posts found.`);
  res100.forEach(r => console.log(` - ${r.title} (${r.distance_km.toFixed(2)} km)`));

  // Test 4: Radius 400 km (should return all posts)
  console.log("\nQuerying radius 400 km (expected: All 4 posts)...");
  const res400 = await queryNearby(centerLat, centerLng, 400);
  console.log(`Results: ${res400.length} posts found.`);
  res400.forEach(r => console.log(` - ${r.title} (${r.distance_km.toFixed(2)} km)`));

  // 5. Cleanup database
  console.log("\nCleaning up test posts...");
  await pool.query("DELETE FROM posts WHERE title LIKE 'TEST_GEO_%';");
  console.log("Cleaned.");

  await pool.end();
  console.log("\nVerification finished successfully!");
};

runTests();
