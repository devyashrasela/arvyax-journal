const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const { initDB } = require("../src/db");
const journalRoutes = require("../src/routes/journal");
const { apiLimiter } = require("../src/middleware/rateLimiter");

const app = express();

// -- Middleware --

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin header (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(null, true); // Permissive for now; tighten in production
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(apiLimiter);

// -- Database initialization (runs once on first request) --

let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDB();
      dbInitialized = true;
    } catch (err) {
      console.error("Database init failed:", err);
    }
  }
  next();
});

// -- Routes --

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/journal", journalRoutes);

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// -- Start server (local dev) or export for Vercel --

const PORT = process.env.PORT || 3001;

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Journal API running on http://localhost:${PORT}`);
  });
  module.exports = app;
}
