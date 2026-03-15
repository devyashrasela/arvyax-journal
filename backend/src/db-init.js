/**
 * Standalone script to initialize the database.
 * Run: node src/db-init.js
 */
require("dotenv").config();
const { initDB, pool } = require("./db");

initDB()
  .then(() => {
    console.log("Database initialization complete.");
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Database initialization failed:", err);
    pool.end();
    process.exit(1);
  });
