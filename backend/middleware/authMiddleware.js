import jwt from "jsonwebtoken";

const extractToken = (authHeader) => {
  if (!authHeader) return null;

  // Supports both:
  // 1) Authorization: <token>
  // 2) Authorization: Bearer <token>
  const trimmed = authHeader.trim();
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
};

export const verifyToken = (req, res, next) => {
  const rawAuth = req.headers["authorization"];
  const token = extractToken(rawAuth);

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const optionalVerifyToken = (req, res, next) => {
  const rawAuth = req.headers["authorization"];
  const token = extractToken(rawAuth);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // If token is invalid, just proceed without user
    next();
  }
};


