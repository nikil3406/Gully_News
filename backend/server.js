import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import { verifyToken } from "./middleware/authMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// Protected route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});