import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import { verifyToken } from "./middleware/authMiddleware.js";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://gully-news.vercel.app"
    ],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on("join_post", (postId) => {
    socket.join(`post_${postId}`);
    console.log(`Socket ${socket.id} joined room post_${postId}`);
  });

  socket.on("leave_post", (postId) => {
    socket.leave(`post_${postId}`);
    console.log(`Socket ${socket.id} left room post_${postId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.set("io", io);

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://gully-news.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "Backend Running"
  });
});
import pool from "./db.js";

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});
// Protected route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});