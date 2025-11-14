import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

// JWT Middleware for protecting routes
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// REGISTER
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Input validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Password length validation
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  try {
    // Check if user already exists
    db.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, username], async (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      
      if (results.length > 0) {
        const existingUser = results[0];
        if (existingUser.email === email) {
          return res.status(409).json({ error: "Email already registered" });
        }
        if (existingUser.username === username) {
          return res.status(409).json({ error: "Username already taken" });
        }
      }

      // Hash password and create user
      const hashed = await bcrypt.hash(password, 12);

      db.query(
        "INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())",
        [username.trim(), email.toLowerCase().trim(), hashed],
        (err, result) => {
          if (err) {
            console.error("Registration error:", err);
            return res.status(500).json({ error: "Failed to create user" });
          }
          
          res.status(201).json({ 
            message: "User registered successfully",
            user: {
              id: result.insertId,
              username: username.trim(),
              email: email.toLowerCase().trim()
            }
          });
        }
      );
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    db.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = results[0];
      
      try {
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT token with user data
        const token = jwt.sign(
          { 
            id: user.id,
            username: user.username,
            email: user.email
          }, 
          process.env.JWT_SECRET, 
          { expiresIn: "24h" }
        );

        // Update last login
        db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id], (updateErr) => {
          if (updateErr) console.error("Failed to update last login:", updateErr);
        });

        // Set JWT as HTTP-only cookie
        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ 
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      } catch (bcryptError) {
        console.error("Bcrypt error:", bcryptError);
        return res.status(500).json({ error: "Authentication error" });
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// VERIFY TOKEN
router.get("/verify", authenticateToken, (req, res) => {
  // If middleware passes, token is valid
  res.json({ 
    message: "Token is valid",
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

// GET USER PROFILE
router.get("/profile", authenticateToken, (req, res) => {
  db.query("SELECT id, username, email, created_at, last_login FROM users WHERE id = ?", [req.user.id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: results[0] });
  });
});

// LOGOUT - Clear the HTTP-only cookie
router.post("/logout", (req, res) => {
  // Clear the auth cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.json({ message: "Logged out successfully" });
});

// DEBUG: List all users (remove this in production)
router.get("/debug-users", (req, res) => {
  db.query("SELECT id, username, email, created_at FROM users ORDER BY id", (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    console.log("📋 All users in database:", results);
    res.json({ users: results });
  });
});

export default router;
