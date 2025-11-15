import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Build SSL config for Aiven
function buildSslConfig() {
  // Prefer base64-encoded CA if provided (safer for multiline env)
  if (process.env.DB_CA_B64) {
    try {
      const ca = Buffer.from(process.env.DB_CA_B64, "base64").toString("utf8");
      return { rejectUnauthorized: true, ca };
    } catch (e) {
      console.warn("⚠️ Failed to decode DB_CA_B64, falling back to DB_CA/DB_SSL.");
    }
  }
  // Raw CA pasted (multiline env var)
  if (process.env.DB_CA) {
    return { rejectUnauthorized: true, ca: process.env.DB_CA };
  }
  // Toggle SSL without CA (Aiven usually accepts this as well)
  if (process.env.DB_SSL === "true" || process.env.DB_SSL === "1") {
    return { rejectUnauthorized: false };
  }
  return undefined; // no SSL
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: buildSslConfig(),
});

// Test connection once on startup (non-blocking)
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Failed to connect to Aiven MySQL:");
    console.error("Error Code:", err.code);
    console.error("Error Number:", err.errno);
    console.error("SQL State:", err.sqlState);
    console.error("Message:", err.message);
    console.error("\nFull Error Stack:");
    console.error(err.stack);
    console.error("\nConnection Details:");
    console.error("- Host:", process.env.DB_HOST);
    console.error("- Port:", process.env.DB_PORT);
    console.error("- User:", process.env.DB_USER);
    console.error("- Database:", process.env.DB_NAME);
    console.error("- SSL Enabled:", process.env.DB_SSL === "1" || process.env.DB_SSL === "true");
    return;
  }
  console.log("✅ Connected to Aiven MySQL successfully!");
  console.log("📊 Connection Details:");
  console.log("- Host:", process.env.DB_HOST);
  console.log("- Port:", process.env.DB_PORT);
  console.log("- Database:", process.env.DB_NAME);
  console.log("- Thread ID:", conn.threadId);
  conn.release();
});

export default pool;
