# Gully News (Frontend + Backend)

A full-stack news feed application with user authentication, posts, categories, likes, views, and comments.

---

## Project Structure

- `frontend/` - React (Create React App)
- `backend/` - Express + PostgreSQL

---

## Prerequisites

- Node.js (recommended LTS)
- PostgreSQL
- Environment variables (see below)

---

## Setup Database

1. Create a PostgreSQL database.
2. Update backend DB connection variables in `backend/.env` (or `backend/.env.local`).
3. Initialize schema using `backend/init_db.sql`.
4. (Optional) Seed sample data using scripts in `backend/scripts/`.

> If you already have the database configured on your machine, you can skip steps 1–2.

---

## Backend Setup

1. Install dependencies:
   ```bash
   npm --prefix backend install
   ```

2. Start the server:
   ```bash
   npm --prefix backend start
   ```

   - API base (by default): `http://localhost:5000`

---

## Frontend Setup

1. Install dependencies:
   ```bash
   npm --prefix frontend install
   ```

2. Create frontend env file (if missing):
   - `frontend/.env` should contain at least:
     - `REACT_APP_API_URL=http://localhost:5000`

3. Start the React app:
   ```bash
   npm --prefix frontend start
   ```

   - Dev server: `http://localhost:3000`

---

## Environment Variables

### Backend

Expected JWT secret:
- `JWT_SECRET`

(Other DB-related variables are read in `backend/db.js`.)

### Frontend

- `REACT_APP_API_URL` - backend API base URL

---

## Authentication

- Login returns a JWT token.
- Token is stored in `localStorage` as `token`.
- Protected endpoints require the `Authorization` header.

Note: The backend middleware accepts either:
- `Authorization: <token>`
- `Authorization: Bearer <token>`

---

## API Endpoints (High Level)

- `GET /api/posts/categories`
- `GET /api/posts?limit=&cursor=&category_id=&search=`
- `POST /api/posts` (requires auth)
- `GET /api/posts/:id`
- `POST /api/posts/:id/like` (requires auth)
- `POST /api/posts/:id/view`
- `DELETE /api/posts/:id` (requires auth)

Comments:
- `GET /api/posts/:id/comments`
- `POST /api/posts/:id/comments` (requires auth)
- `DELETE /api/posts/:id/comments/:commentId` (requires auth)

---

## Running in Production

- Ensure `frontend/.env` uses your production API URL.
- Ensure backend `PORT` and DB/JWT secrets are configured.

---

## Troubleshooting

### “Invalid token” / 401

- JWT may be expired (backend sets `expiresIn: "1h"`).
- Re-login to refresh the token.

---

## License

Add your license here if applicable.

