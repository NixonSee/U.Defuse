import jwt from "jsonwebtoken";

// JWT Authentication Middleware
export const authenticateToken = (req, res, next) => {
  // Try to get token from Authorization header first (for Bearer token)
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // If no Authorization header, try to get token from cookie
  if (!token && req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: "Token expired" });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ error: "Invalid token" });
      }
      return res.status(403).json({ error: "Token verification failed" });
    }
    req.user = user;
    next();
  });
};

// Optional: Admin check middleware
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};