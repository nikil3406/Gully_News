import bcrypt from 'bcrypt';
import pool from '../db.js';

const getOrCreateUser = async () => {
  const username = 'seeduser';
  const email = 'seeduser@example.com';
  const plainPassword = 'Password123!';
  const saltRounds = 10;
  
  // Check if user exists
  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const passwordHash = await bcrypt.hash(plainPassword, saltRounds);
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id;`,
    [username, email, passwordHash]
  );
  return result.rows[0].id;
};

const seedPaginationPosts = async (userId) => {
  // Retrieve categories to map them dynamically
  const catResult = await pool.query('SELECT id, name FROM categories');
  const catMap = {};
  catResult.rows.forEach(row => {
    catMap[row.name] = row.id;
  });

  // If categories don't exist, we pre-populate them
  const categoriesList = ['Traffic', 'Crime', 'Weather', 'Sports', 'Politics', 'Events'];
  for (const catName of categoriesList) {
    if (!catMap[catName]) {
      const res = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [catName]);
      catMap[catName] = res.rows[0].id;
    }
  }

  // Create 15 posts with staggered timestamps (each 1 hour apart)
  const posts = [
    { title: 'Traffic Gridlock on Expressway', content: 'Avoid the main highway today due to a major pileup near exit 4.', category: 'Traffic' },
    { title: 'Local Bakery Wins Award', content: 'Our beloved downtown bakery has been voted the best bakery in the state!', category: 'Events' },
    { title: 'Neighborhood Watch Alert', content: 'Recent reports of package thefts in the north sector. Be vigilant.', category: 'Crime' },
    { title: 'Upcoming Heatwave Warning', content: 'Temperatures are expected to reach record highs this weekend. Stay hydrated.', category: 'Weather' },
    { title: 'High School Basketball Finals', content: 'The local high school team is heading to the finals this Friday.', category: 'Sports' },
    { title: 'City Council Election Debates', content: 'Join us tonight for the debates on local infrastructure plans.', category: 'Politics' },
    { title: 'New Community Park Opening', content: 'The grand opening of the new green park is scheduled for Saturday.', category: 'Events' },
    { title: 'Water Main Break on Elm St', content: 'Water service has been temporarily suspended for repairs on Elm Street.', category: 'Traffic' },
    { title: 'Local Charity Runs Food Drive', content: 'Donate non-perishable items at the community center this week.', category: 'Events' },
    { title: 'Suspicious Activity Reported', content: 'Police are investigating reports of suspicious activity in the park.', category: 'Crime' },
    { title: 'Weekend Rain Forecast', content: 'Expect light rain on Saturday morning followed by cloudy conditions.', category: 'Weather' },
    { title: 'Local Tennis Tournament Winners', content: 'Congrats to the winners of the annual city tennis tournament.', category: 'Sports' },
    { title: 'Town Hall Meeting on Taxes', content: 'The mayor will address property tax adjustments at tonight\'s meeting.', category: 'Politics' },
    { title: 'Farmers Market Returns', content: 'Fresh local produce is back at the town square every Sunday.', category: 'Events' },
    { title: 'Minor Fender Bender on Broad St', content: 'Expect minor delays on Broad Street after a two-car collision.', category: 'Traffic' }
  ];

  console.log('Clearing existing posts to ensure pagination consistency...');
  await pool.query('DELETE FROM posts');

  const now = new Date();
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    // Stagger timestamps backwards: oldest is further in past, newest is closest to now
    const createdAt = new Date(now.getTime() - i * 60 * 60 * 1000); 
    const catId = catMap[post.category];
    
    await pool.query(
      `INSERT INTO posts (user_id, title, content, category_id, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [userId, post.title, post.content, catId, createdAt]
    );
  }
  console.log(`Successfully seeded ${posts.length} posts.`);
};

const run = async () => {
  try {
    const userId = await getOrCreateUser();
    console.log('User acquired with ID:', userId);
    await seedPaginationPosts(userId);
    console.log('Pagination data seeding complete.');
    await pool.end();
  } catch (err) {
    console.error('Error seeding pagination data:', err);
    process.exit(1);
  }
};

run();
