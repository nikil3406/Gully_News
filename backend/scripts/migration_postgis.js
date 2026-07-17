import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database for migration.');

    let hasPostgis = false;
    try {
      console.log('Enabling PostGIS extension...');
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      const checkRes = await client.query("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS has_postgis;");
      hasPostgis = checkRes.rows[0].has_postgis;
    } catch (postgisErr) {
      console.warn('PostGIS extension not available. Falling back to manual distance calculations.', postgisErr.message);
      hasPostgis = false;
    }

    if (hasPostgis) {
      console.log('PostGIS is available. Creating spatial columns and GiST index...');
      await client.query(`
        ALTER TABLE posts
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS city VARCHAR(255),
        ADD COLUMN IF NOT EXISTS state VARCHAR(255),
        ADD COLUMN IF NOT EXISTS country VARCHAR(255),
        ADD COLUMN IF NOT EXISTS location_geom GEOGRAPHY(Point, 4326);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_posts_location_geom ON posts USING gist(location_geom);
      `);
      console.log('PostGIS columns and GiST index created.');
    } else {
      console.log('PostGIS is not available. Creating standard location columns and B-Tree indexes...');
      await client.query(`
        ALTER TABLE posts
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS city VARCHAR(255),
        ADD COLUMN IF NOT EXISTS state VARCHAR(255),
        ADD COLUMN IF NOT EXISTS country VARCHAR(255);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_posts_latitude ON posts(latitude);
        CREATE INDEX IF NOT EXISTS idx_posts_longitude ON posts(longitude);
      `);
      console.log('Standard location columns and B-Tree indexes created.');
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();

