import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log('Connected to database');

    const sqlPath = path.join(__dirname, '..', 'init_db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL...');
    await client.query(sql);
    console.log('Database tables created successfully!');

  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await client.end();
  }
}

setupDatabase();
