const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

let sslConfig = undefined;

// Load the Aiven CA certificate if it exists in the certs directory
const caPath = path.join(__dirname, "..", "certs", "ca.pem");
if (fs.existsSync(caPath)) {
  sslConfig = {
    ca: fs.readFileSync(caPath, "utf-8"),
  };
}

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Creates the journal_entries table if it does not already exist
async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     VARCHAR(255) NOT NULL,
        ambience    VARCHAR(50)  NOT NULL,
        text        TEXT         NOT NULL,
        emotion     VARCHAR(100) DEFAULT NULL,
        keywords    JSON         DEFAULT NULL,
        summary     TEXT         DEFAULT NULL,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);
    console.log("[DB] journal_entries table is ready");
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDB };
