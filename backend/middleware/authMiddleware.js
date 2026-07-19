import jwt from "jsonwebtoken";

const DEFAULT_JWT_SECRET = "gully-news-dev-secret";

export const getJwtSecrets = () => {
  const configuredSecrets = [
    process.env.JWT_SECRET,
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : null,
    process.env.JWT_REFRESH_SECRET ? `${process.env.JWT_REFRESH_SECRET}_refresh` : null,
    DEFAULT_JWT_SECRET,
  ].filter(Boolean);

  return [...new Set(configuredSecrets)];
};

export const getAccessTokenSecret = () => getJwtSecrets()[0];
export const getRefreshTokenSecret = () => process.env.JWT_REFRESH_SECRET || getAccessTokenSecret();

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

const attachUserFromToken = (req, token) => {
  const secrets = getJwtSecrets();
  let lastError = null;

  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      return decoded;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
};

export const verifyToken = (req, res, next) => {
  const rawAuth = req.headers["authorization"];
  const token = extractToken(rawAuth);

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    attachUserFromToken(req, token);
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
    attachUserFromToken(req, token);
    next();
  } catch (err) {
    // If token is invalid, just proceed without user
    next();
  }
};


