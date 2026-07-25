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

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    getAccessTokenSecret(),
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    getRefreshTokenSecret(),
    { expiresIn: "7d" }
  );
};

export const verifyJwtToken = (token) => {
  const secrets = getJwtSecrets();
  let lastError = null;

  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
};
