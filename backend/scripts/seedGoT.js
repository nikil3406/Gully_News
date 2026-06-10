import bcrypt from 'bcrypt';
import pool from '../db.js';

const SALT_ROUNDS = 10;

// Game of Thrones characters
const characters = [
  {
    username: 'Jon Snow',
    email: 'jon@gmail.com',
    password: 'jon',
    bio: 'Lord Commander of the Night\'s Watch. Knows nothing, apparently.',
  },
  {
    username: 'Daenerys Targaryen',
    email: 'daenerys@gmail.com',
    password: 'daenerys',
    bio: 'Mother of Dragons. Breaker of Chains. Queen of the Andals.',
  },
  {
    username: 'Tyrion Lannister',
    email: 'tyrion@gmail.com',
    password: 'tyrion',
    bio: 'I drink and I know things. Hand of the Queen.',
  },
  {
    username: 'Arya Stark',
    email: 'arya@gmail.com',
    password: 'arya',
    bio: 'A girl has no name. Faceless assassin from Winterfell.',
  },
  {
    username: 'Cersei Lannister',
    email: 'cersei@gmail.com',
    password: 'cersei',
    bio: 'Queen of the Seven Kingdoms. A Lannister always pays her debts.',
  },
  {
    username: 'Sansa Stark',
    email: 'sansa@gmail.com',
    password: 'sansa',
    bio: 'Lady of Winterfell. The North remembers.',
  },
  {
    username: 'Jaime Lannister',
    email: 'jaime@gmail.com',
    password: 'jaime',
    bio: 'The Kingslayer. Knight of the Kingsguard.',
  },
  {
    username: 'Ned Stark',
    email: 'ned@gmail.com',
    password: 'ned',
    bio: 'Warden of the North. Winter is coming.',
  },
];

// Posts per character — themed to news categories
// categories: 1=Traffic, 2=Crime, 3=Weather, 4=Sports, 5=Politics, 6=Events
const postsByCharacter = {
  'Jon Snow': [
    {
      title: 'White Walkers Spotted Beyond the Wall — Night\'s Watch on High Alert',
      content: 'Ranging parties from Castle Black have confirmed sightings of White Walker activity north of the Wall. Lord Commander Jon Snow has issued an emergency call to arms. Citizens south of Winterfell are advised to remain calm but stock up on dragonglass. The Night\'s Watch is requesting volunteers and funding to reinforce the defenses at Castle Black.',
      category_id: 2,
    },
    {
      title: 'Wildlings March South — Massive Migration Causes Road Chaos Near Castle Black',
      content: 'Free Folk numbering in the thousands are moving through the Kingsroad following a deal brokered by Jon Snow. Heavy congestion expected on all routes south of the Gift. Locals are advised to use alternate paths through the Wolfswood. The Lord Commander assures that this is a peaceful relocation and not an invasion.',
      category_id: 1,
    },
  ],
  'Daenerys Targaryen': [
    {
      title: 'Three Dragons Spotted Over King\'s Landing — Residents Urged to Stay Indoors',
      content: 'Drogon, Rhaegal, and Viserion were observed in formation above Blackwater Bay early this morning. The Crown has issued an emergency weather-type alert across all districts. Citizens near the Red Keep and Flea Bottom are asked to evacuate to underground passages. Queen Daenerys Targaryen is reportedly returning from Essos with her Dothraki fleet.',
      category_id: 3,
    },
    {
      title: 'Liberation of Meereen — Slavery Officially Abolished, New Era Begins',
      content: 'Queen Daenerys Targaryen today signed a historic decree abolishing slavery across all of Slaver\'s Bay. Thousands of freed men and women celebrated in the streets of Meereen. The Sons of the Harpy have reportedly gone underground, but the Queen\'s Unsullied army is patrolling all major thoroughfares. Political analysts say this could reshape power dynamics across Essos.',
      category_id: 5,
    },
  ],
  'Tyrion Lannister': [
    {
      title: 'Battle of Blackwater: City Survives Night Attack — What We Know So Far',
      content: 'Stannis Baratheon\'s fleet launched a surprise assault on King\'s Landing under cover of darkness, deploying a massive chain across the Blackwater Rush. Acting Hand of the King Tyrion Lannister is credited with the wildfire strategy that obliterated the attacking fleet. City Watch is still fighting scattered skirmishes in the outer districts. Casualties are being counted.',
      category_id: 2,
    },
    {
      title: 'Trial by Combat: Lannister Demands Champion — Mountain vs Viper Set for Tomorrow',
      content: 'In a dramatic court session at the Red Keep, Lord Tyrion Lannister invoked his right to trial by combat after being accused of regicide. Ser Gregor "The Mountain" Clegane will represent the Crown, while Prince Oberyn Martell of Dorne has volunteered as Tyrion\'s champion. Crowds expected to be massive. Betting odds heavily favour The Mountain. Event starts at dawn.',
      category_id: 6,
    },
  ],
  'Arya Stark': [
    {
      title: 'Mysterious Girl Spotted at the House of Black and White — Locals Baffled',
      content: 'Residents of Braavos have reported a young Westerosi girl repeatedly visiting the famed House of Black and White, home of the Faceless Men. The girl, believed to be a Stark, has been seen training with locals and performing odd tasks around the city. The Many-Faced God\'s temple rarely accepts outsiders. No official statement from the guild has been released.',
      category_id: 2,
    },
    {
      title: 'Frey Pie Recipe Goes Viral After Feast — Warning: Check Your Ingredients',
      content: 'Following a disturbing discovery at the Twins, authorities are urging all citizens to be cautious about mystery meat pies at large feasts. A girl with no name reportedly served a house special to Lord Walder Frey before he met his end. The dish has since been nicknamed "Frey\'s Folly" on the streets of the Riverlands. The culprit remains at large.',
      category_id: 6,
    },
  ],
  'Cersei Lannister': [
    {
      title: 'Wildfire Cache Discovered Under the Sept — King\'s Landing Rocked by Explosion',
      content: 'A massive wildfire detonation has destroyed the Great Sept of Baelor, killing the High Sparrow, Queen Margaery, and numerous members of the Faith Militant. Queen Mother Cersei Lannister watched from the Red Keep. She has now declared herself sole ruler of the Seven Kingdoms. Political fallout is expected to be enormous. The Faith Militant is effectively dismantled.',
      category_id: 5,
    },
    {
      title: 'Gold Cloaks Increase Patrols — City Watch Doubles Presence After Riot',
      content: 'King\'s Landing\'s City Watch, under direct orders from Queen Cersei, has doubled its presence in Flea Bottom, Fishmongers\' Square, and all gate districts. A recent bread riot that nearly claimed the lives of the royal family has prompted these emergency measures. Curfews will now be enforced from the ninth bell onwards. Violators will be taken to the Black Cells.',
      category_id: 1,
    },
  ],
  'Sansa Stark': [
    {
      title: 'North Rallies Behind House Stark — Jon Snow Named King in the North',
      content: 'In a historic gathering at Winterfell\'s great hall, lords and ladies of the North unanimously declared Jon Snow the King in the North following the Battle of the Bastards. Lady Sansa Stark of Winterfell sat beside him as the hall erupted in cheers of "The King in the North!" The Bolton banners have been replaced with direwolves across all northern castles.',
      category_id: 5,
    },
    {
      title: 'Winterfell Prepares for Long Winter — Food and Firewood Stockpile Campaign Begins',
      content: 'Lady Sansa Stark has overseen the launch of a major resource stockpiling effort across the North. Grain shipments are being collected from all houses, and thousands of cords of firewood are being stored beneath Winterfell. Sansa is quoted saying: "The North knows winter. We will be ready." Smallfolk are encouraged to contribute and prepare their own stores.',
      category_id: 3,
    },
  ],
  'Jaime Lannister': [
    {
      title: 'Kingslayer Redeems Himself? — Jaime Lannister Rides North to Fight the Dead',
      content: 'In a surprise move that has stunned courtiers across Westeros, Ser Jaime Lannister has reportedly left King\'s Landing without his sister\'s permission and is riding north to honour a pledge to fight against the Night King. Cersei is reportedly furious. Jaime arrived at Winterfell with a small retinue and requested audience with Daenerys Targaryen. His golden hand is unmistakable.',
      category_id: 5,
    },
    {
      title: 'Siege of Riverrun Ends Peacefully — Blackfish Perishes, Castle Surrenders',
      content: 'After a prolonged standoff, the siege of Riverrun has concluded. Ser Jaime Lannister negotiated the castle\'s surrender, avoiding further bloodshed for the Tully troops inside. Ser Brynden "Blackfish" Tully reportedly died fighting in the ensuing struggle rather than surrender. The castle has now returned to Lannister-allied control. Freys are expected to resume administration shortly.',
      category_id: 2,
    },
  ],
  'Ned Stark': [
    {
      title: 'Lord Stark Heads South — Warden of North Accepts Role as King\'s Hand',
      content: 'Eddard Stark, Warden of the North, has reluctantly accepted King Robert Baratheon\'s request to serve as Hand of the King. The Lord of Winterfell departs for King\'s Landing with his daughters Sansa and Arya. Sources close to Stark say he fears what he might find in the capital. Lady Catelyn Stark and the remaining Stark children will hold Winterfell in his absence.',
      category_id: 5,
    },
    {
      title: 'Winter Storm Hits Kingsroad — Travel Suspended Between Winterfell and the Neck',
      content: 'A brutal winter storm has blanketed the Kingsroad from Moat Cailin southward, making travel impossible. Lord Eddard Stark has dispatched riders from Winterfell to warn nearby villages and ensure smallfolk are sheltered. Roads are expected to remain impassable for at least a fortnight. Merchants heading to White Harbor are advised to wait or seek sea routes instead.',
      category_id: 3,
    },
  ],
};

const seed = async () => {
  try {
    console.log('🐉 Starting Game of Thrones seed...\n');

    const userIds = {};

    // Create users
    for (const char of characters) {
      const hash = await bcrypt.hash(char.password, SALT_ROUNDS);
      const res = await pool.query(
        `INSERT INTO users (username, email, password_hash, bio)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username, bio = EXCLUDED.bio
         RETURNING id, username`,
        [char.username, char.email, hash, char.bio]
      );
      const user = res.rows[0];
      userIds[char.username] = user.id;
      console.log(`✅ User created: ${user.username} (id=${user.id})`);
      console.log(`   📧 ${char.email}  🔑 ${char.password}`);
    }

    console.log('\n📰 Inserting posts...\n');

    // Create posts
    let totalPosts = 0;
    for (const [username, posts] of Object.entries(postsByCharacter)) {
      const userId = userIds[username];
      for (const post of posts) {
        const res = await pool.query(
          `INSERT INTO posts (user_id, title, content, category_id, ai_status)
           VALUES ($1, $2, $3, $4, 'approved')
           ON CONFLICT DO NOTHING
           RETURNING id, title`,
          [userId, post.title, post.content, post.category_id]
        );
        if (res.rows[0]) {
          console.log(`  📝 [${username}] ${res.rows[0].title.substring(0, 60)}...`);
          totalPosts++;
        }
      }
    }

    await pool.end();

    console.log(`\n🎉 Seed complete!`);
    console.log(`   👥 ${characters.length} users created`);
    console.log(`   📰 ${totalPosts} posts inserted`);
    console.log('\n🔑 Login credentials:');
    characters.forEach(c => {
      console.log(`   ${c.username.padEnd(22)} | ${c.email.padEnd(25)} | ${c.password}`);
    });

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    await pool.end();
    process.exit(1);
  }
};

seed();
