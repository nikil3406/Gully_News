# 📰 Gully News

> **A hyperlocal, community-driven news platform built for neighbourhoods.**  
> Real-time news feeds, geolocation-based discovery, reporter profiles, and multimedia posts — all in one modern, mobile-first app.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791.svg)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF.svg)](https://github.com/nikil3406/Gully_News/actions)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Running with Docker](#-running-with-docker)
- [CI/CD & Security](#-cicd--security)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌍 Overview

**Gully News** is a hyperlocal news platform designed to empower local reporters and community members to publish, discover, and engage with news happening in their immediate surroundings. Unlike national news aggregators, Gully News focuses on the stories that matter most to your neighbourhood — road conditions, local events, weather alerts, sports results, and more.

The platform supports both unauthenticated browsing and a rich authenticated experience for registered reporters, with geolocation-powered nearby news discovery, real-time updates via WebSockets, Cloudinary-hosted image uploads with automated deletion lifecycle management, and a complete Docker & CI/CD pipeline.

---

## ✨ Features

### 🗞️ News Feed
- Infinite-scroll news feed with cursor-based pagination.
- Filter by category (Traffic, Crime, Weather, Sports, Politics, Events).
- Full-text search across post titles and content.
- Real-time post creation, deletion, and engagement metrics updates via Socket.IO.

### 📍 Nearby News
- Browser Geolocation API integration.
- PostGIS-powered spatial queries to find news within a configurable radius (5 km – 100 km).
- Graceful fallback to global feed when location is unavailable or denied.
- Radius filter selector in the sidebar.

### ✍️ Post Creation & Cloudinary Lifecycle
- Create rich posts with title, content, category, and location tagging.
- Upload images (JPEG, PNG, WEBP, GIF — up to 10 MB) directly to Cloudinary.
- **Automated Cloudinary Image Deletion:** When a post is deleted, its associated hosted image is automatically removed from Cloudinary storage.
- Optional video URL attachment.
- Automatic geotagging via browser coordinates.

### 👤 User Profiles & Social
- Public reporter profiles with bio, follower/following counts, reputation score, and post history.
- Follow/unfollow other reporters.
- Reporter search by username (available in desktop header and mobile search modal).
- Editable profile (username, email, bio, profile image).

### 🔐 Authentication
- JWT-based access token (short-lived, stored in `localStorage`).
- Secure httpOnly cookie refresh token (7-day lifetime, auto-rotated).
- Silent token refresh via a global `fetch` interceptor (no unnecessary logouts).
- Concurrent request queuing during token refresh to prevent race conditions.

### 💬 Comments
- Threaded comments per post.
- Add and delete your own comments.
- Real-time comment count updates.

### 📱 Mobile Experience
- **Floating bottom navigation bar** — Apple-inspired pill-shaped nav with glassmorphism.
- Navigation items: **Home**, **Nearby**, **Search** (reporter search modal), **Create**, **Profile**.
- Fully responsive — desktop gets a full sidebar and top navigation, mobile gets the floating bottom bar.
- Tap-to-search reporter modal with smooth slide-up animation.

### 🐳 Docker Containerisation
- Multi-container orchestration (`docker compose up`) featuring PostgreSQL + PostGIS, Express API, and Nginx React SPA.
- Single-command full-stack execution with automatic spatial schema initialization.

### 🚀 CI/CD & Static Security Scanning
- Automated GitHub Actions workflow (`ci.yml`) for linting, Jest testing with coverage, frontend React build verification, and dependency security audits.
- CodeQL SAST scanning (`codeql.yml`) and Dependabot automated updates (`dependabot.yml`).

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| React Router DOM | 7.x | Client-side routing |
| Tailwind CSS | 4.x | Utility-first styling |
| Socket.IO Client | 4.x | Real-time WebSocket communication |
| Nginx | 1.27-alpine | Web Server & Reverse Proxy (Docker) |
| Axios | 1.x | HTTP requests (auth setup) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ / 24+ | Runtime |
| Express.js | 5.x | HTTP server and REST API |
| Socket.IO | 4.x | WebSocket server |
| PostgreSQL + PostGIS | 14+ / 16+ | Relational database with geospatial extension |
| bcrypt | 6.x | Password hashing |
| JSON Web Tokens | 9.x | Authentication tokens |
| Multer | 2.x | Multipart file upload handling |
| Cloudinary | 2.x | Cloud image hosting & automated deletion |
| cookie-parser | 1.x | HttpOnly refresh token cookies |
| pg (node-postgres) | 8.x | PostgreSQL client |

### DevOps & CI/CD
| Technology | Tool | Purpose |
|---|---|---|
| Docker | Docker Compose | Multi-container orchestration |
| CI/CD | GitHub Actions | Automated build, test, and lint pipeline |
| Security | CodeQL & npm audit | Vulnerability scanning & SAST |
| Dependency Management | Dependabot | Automated dependency updates |

---

## 📁 Project Structure

```
Gully_news/
├── .github/
│   ├── workflows/
│       ├── ci.yml                  # GitHub Actions CI 
│
├── docker-compose.yml              # Multi-container orchestration (Postgres, Backend, Frontend)
├── .env.docker.example             # Safe environment template for Docker Compose
│
├── backend/                        # Express.js REST API
│   ├── Dockerfile                  # Node.js 24 Alpine container definition
│   ├── .dockerignore
│   ├── controllers/
│   │   ├── authController.js       # Auth: register, login, refresh, logout, profile, follow, search
│   │   ├── postController.js       # Posts: CRUD, likes, views, nearby, Cloudinary cleanup
│   │   └── commentController.js    # Comments: get, add, delete
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verifyToken / optionalVerifyToken
│   │   └── uploadMiddleware.js     # Multer memory storage (10 MB image limit)
│   ├── routes/
│   │   ├── auth.js                 # /api/auth/* routes
│   │   ├── posts.js                # /api/posts/* routes
│   │   ├── news.js                 # /api/news/* routes
│   │   └── upload.js               # /api/upload/image route
│   ├── services/
│   │   ├── authService.js          # Database queries for users, follows, refresh tokens
│   │   ├── postService.js          # Database queries for posts (incl. PostGIS nearby)
│   │   └── commentService.js       # Database queries for comments
│   ├── scripts/
│   │   ├── seedGoT.js              # Game of Thrones sample dataset seeder
│   │   └── seedPaginationData.js   # Large feed test dataset seeder
│   ├── utils/
│   │   ├── jwt.js                  # Token generation helpers
│   │   ├── cloudinary.js           # Cloudinary upload & automated deletion helpers
│   │   └── normalize.js            # Input normalisation helpers
│   ├── db.js                       # PostgreSQL pool (supports DATABASE_URL or local config)
│   ├── server.js                   # App entry point: Express + Socket.IO setup
│   ├── init_db.sql                 # Full database schema + seed categories
│   └── .env.example                # Required environment variables template
│
├── frontend/                       # React 19 SPA
│   ├── Dockerfile                  # Multi-stage build (Node builder -> Nginx runner)
│   ├── nginx.conf                  # Nginx SPA router + reverse proxy for /api/ & /socket.io/
│   ├── .dockerignore
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js           # Desktop sticky top navigation bar
│   │   │   ├── BottomNav.js        # Mobile floating pill bottom navigation bar
│   │   │   ├── ArticleCard.js      # News post card component
│   │   │   ├── SearchBar.js        # Content search bar (news feed)
│   │   │   ├── CategoryFilter.js   # Category chip / dropdown filter
│   │   │   ├── CommentSection.js   # Comments UI for post detail
│   │   │   └── ImageUploadPicker.js # Drag-and-drop / click image uploader
│   │   ├── pages/
│   │   │   ├── NewsFeed.js         # Main news feed page
│   │   │   ├── NearbyNews.js       # Geolocation-based nearby news feed
│   │   │   ├── PostDetail.js       # Single post view with comments
│   │   │   ├── CreatePost.js       # Post creation form
│   │   │   ├── Profile.js          # User profile page
│   │   │   ├── Login.js            # Login page
│   │   │   └── Register.js         # Registration page
│   │   ├── services/
│   │   │   ├── apiClient.js        # Base fetch wrapper with auth headers
│   │   │   ├── authService.js      # Auth API calls
│   │   │   └── postService.js      # Post API calls
│   │   ├── App.js                  # Root router + BottomNav mount
│   │   ├── index.js                # React DOM render + setupAuth()
│   │   ├── index.css               # Global styles + mobile nav animations
│   │   ├── setupAuth.js            # Global fetch interceptor for silent JWT refresh
│   │   └── socket.js               # Socket.IO client singleton
│   └── package.json
│
└── package.json                    # Root workspace package
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       React Frontend                        │
│             (Served by Nginx / CRA Dev Server)              │
│                                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  │
│  │ NewsFeed │  │NearbyNews │  │ Profile  │  │PostDetail│  │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │              │         │
│  ┌────▼──────────────▼──────────────▼──────────────▼─────┐  │
│  │            apiClient.js (fetch + JWT auto-refresh)     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS REST + WebSocket (/socket.io/)
┌──────────────────────────▼──────────────────────────────────┐
│                     Express.js Backend                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │/api/auth │  │/api/posts│  │/api/news │  │/api/upload │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │              │               │         │
│  ┌────▼──────────────▼──────────────▼───────────────▼─────┐  │
│  │              Services Layer (SQL queries via pg)         │  │
│  └────────────────────────────┬────────────────────────────┘  │
│                               │                               │
│  ┌────────────────────────────▼────────────────────────────┐  │
│  │       PostgreSQL + PostGIS (Docker / Neon)               │  │
│  │  users, posts, comments, likes, followers, locations     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Socket.IO Server ─── Real-time events: post_created,         │
│                        post_deleted, post_likes_updated,      │
│                        post_views_updated, post_comments      │
└───────────────────────────────┬───────────────────────────────┘
                                │
                ┌───────────────▼──────────────┐
                │         Cloudinary CDN        │
                │  (upload & auto-delete API)  │
                └──────────────────────────────┘
```

---

## 🗄️ Database Schema

Requires **PostgreSQL** with the **PostGIS** extension enabled.

```sql
-- Run to initialise: psql -d your_database -f backend/init_db.sql

users         -- id, username, email, password_hash, profile_image, bio, reputation_score, followers_count
categories    -- id, name  (Traffic, Crime, Weather, Sports, Politics, Events)
locations     -- id, city, area, state, country
posts         -- id, user_id, title, content, image_url, video_url, category_id, location_id,
              --   latitude, longitude, city, state, country,
              --   location_geom GEOGRAPHY(Point, 4326),  ← PostGIS spatial column
              --   ai_score, ai_status, likes_count, comments_count, views_count, shares_count
comments      -- id, user_id, post_id, content
likes         -- id, user_id, post_id  (UNIQUE constraint prevents duplicate likes)
followers     -- id, follower_id, following_id
saved_posts   -- id, user_id, post_id
refresh_tokens -- id, user_id, token  (auto-created on server startup)
```

**Spatial indexing:**
```sql
CREATE INDEX idx_posts_location_geom ON posts USING gist(location_geom);
```
This enables fast radius searches for the Nearby News feature using PostGIS `ST_DWithin`.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **PostgreSQL** v14+ with the **PostGIS** extension  
  *(Or use a hosted provider like [Neon](https://neon.tech) or [Render](https://render.com) that supports PostGIS)*
- A **Cloudinary** account for image hosting (free tier is sufficient)

### 1. Clone the Repository

```bash
git clone https://github.com/nikil3406/Gully_News.git
cd Gully_News
```

### 2. Set Up the Database

Connect to your PostgreSQL instance and run the schema:

```bash
psql -U postgres -d your_database_name -f backend/init_db.sql
```

This creates all tables, adds the PostGIS spatial index on posts, and seeds the default categories.

### 3. Configure Environment Variables

**Backend** — Copy the example and fill in your values:

```bash
cp backend/.env.example backend/.env
```

**Frontend** — Create the env file:

```bash
cp frontend/.env.example frontend/.env   # or create manually
```

See the [Environment Variables](#-environment-variables) section for the full list.

### 4. Install Dependencies

```bash
# Root workspace (optional shared deps)
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

---

## ⚙️ Environment Variables

### Backend — `backend/.env`

```env
# Server
PORT=5000
NODE_ENV=development          # Set to "production" when deploying

# JWT
JWT_SECRET=your_strong_jwt_secret_here

# Database — use either DATABASE_URL (cloud) or individual params (local)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Local database fallback (if DATABASE_URL is not set)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=gully_news
DB_PASSWORD=postgres
DB_PORT=5432

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend — `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

> **Security Note:** Never commit `.env` files to version control. They are listed in `.gitignore`.

---

## ▶️ Running the Application

### Development Mode

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
# or with auto-reload:
npx nodemon server.js
```
The API will be available at `http://localhost:5000`.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```
The React app will be available at `http://localhost:3000`.

The frontend `npm start` command concurrently:
1. Compiles Tailwind CSS in watch mode.
2. Starts the Create React App dev server.

### Production Build (Frontend)

```bash
cd frontend
npm run build
```

This compiles Tailwind and then runs `react-scripts build` into the `frontend/build/` folder, ready for static hosting (Vercel, Netlify, etc.).

---

## 🐳 Running with Docker

You can run the entire full-stack application (PostgreSQL + PostGIS, Express Backend, Nginx Frontend) in containerised mode using Docker Compose.

### Quick Start

1. **Copy the Docker env template:**
   ```bash
   cp .env.docker.example backend/.env
   ```
2. **Configure your secrets in `backend/.env`:**
   Set your `JWT_SECRET` and `CLOUDINARY_*` keys. Leave `DATABASE_URL=` empty so Docker Compose routes database connections to the internal `postgres` container.
3. **Build and launch containers:**
   ```bash
   docker compose up -d
   ```

### Services & URLs

* **Frontend App:** [http://localhost:3000](http://localhost:3000) (Served via Nginx, reverse-proxying `/api/` & `/socket.io/` to backend)
* **Backend API:** [http://localhost:5000](http://localhost:5000)
* **PostgreSQL:** `localhost:5432` (`user: postgres`, `password: postgres`, `db: gully_news`)

### Seeding Data inside Docker

Run the sample dataset script inside the running backend container:

```bash
docker exec -it gully_news_backend node scripts/seedGoT.js
```

---

## 🚀 CI/CD & Security

Gully News includes an automated GitHub Actions CI/CD workflow running on every Pull Request targeting `main` and push to `main`.

### CI Workflow Jobs (`ci.yml`)

* **🖥️ Frontend Job:** Dependency install, ESLint checking, Jest test execution with coverage, and React production build verification.
* **⚙️ Backend Job:** PostgreSQL + PostGIS Docker service container startup, SQL schema initialisation, Jest testing with coverage, and artifact generation.
* **🔒 Security Audit Job:** Dependency vulnerability check via `npm audit --audit-level=high`.

## 🌐 Deployment

The application is structured for a split-deployment model:

| Service | Platform | Notes |
|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) | Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to your backend URL in Vercel project settings. |
| **Backend** | [Render](https://render.com) | Set all backend env variables in the Render service dashboard. Use `node server.js` as the start command. |
| **Database** | [Neon](https://neon.tech) | Neon provides a serverless PostgreSQL with PostGIS support. Copy the connection string to `DATABASE_URL`. |
| **Images** | [Cloudinary](https://cloudinary.com) | Free tier provides 25 GB storage and 25 GB monthly bandwidth. |

### CORS Configuration

The backend CORS whitelist is configured in `backend/server.js`. Update the `origin` array to include your deployed frontend URL:

```js
// backend/server.js
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://your-app.vercel.app"   // ← add your production frontend URL
];
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. **Fork** the repository.
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a **Pull Request**.

Please follow conventional commit messages and ensure no `.env` files are committed.

---

## 📄 License

This project is licensed under the **ISC License**.  
See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for local communities</p>
  <p>
    <a href="https://github.com/nikil3406/Gully_News/issues">Report a Bug</a>
    ·
    <a href="https://github.com/nikil3406/Gully_News/issues">Request a Feature</a>
  </p>
</div>
