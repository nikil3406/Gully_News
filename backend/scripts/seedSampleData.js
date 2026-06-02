import bcrypt from 'bcrypt';
import pool from '../db.js';

const createSampleUser = async () => {
  const username = 'sampleuser';
  const email = 'sample@example.com';
  const plainPassword = 'Password123!';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email;`,
    [username, email, passwordHash]
  );
  return result.rows[0];
};

const createSamplePosts = async (userId) => {
  const posts = [
    { title: 'Welcome to Gully News', content: 'This is a sample post to showcase the platform.', image_url: null, video_url: null, category_id: 1 },
    { title: 'Breaking Traffic Update', content: 'Heavy traffic on Main St. Expect delays.', image_url: null, video_url: null, category_id: 1 },
    { title: 'Local Sports Victory', content: 'Our town team won the championship!', image_url: null, video_url: null, category_id: 4 }
  ];
  const inserted = [];
  for (const p of posts) {
    const res = await pool.query(
      `INSERT INTO posts (user_id, title, content, category_id) VALUES ($1, $2, $3, $4) RETURNING id, title;`,
      [userId, p.title, p.content, p.category_id]
    );
    inserted.push(res.rows[0]);
  }
  return inserted;
};

const seed = async () => {
  try {
    const user = await createSampleUser();
    console.log('Created sample user:', user);
    const posts = await createSamplePosts(user.id);
    console.log('Created sample posts:', posts);
    await pool.end();
    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seed();
