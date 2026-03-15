const express = require("express");
const { pool } = require("../db");
const { analyzeEmotion } = require("../services/llm");
const cache = require("../services/cache");
const { analyzeLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/journal — Create a journal entry
// ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { userId, ambience, text } = req.body;

    if (!userId || !ambience || !text) {
      return res.status(400).json({
        error: "Missing required fields: userId, ambience, text",
      });
    }

    const validAmbiences = ["forest", "ocean", "mountain"];
    if (!validAmbiences.includes(ambience)) {
      return res.status(400).json({
        error: `Invalid ambience. Must be one of: ${validAmbiences.join(", ")}`,
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO journal_entries (user_id, ambience, text) VALUES (?, ?, ?)`,
      [userId, ambience, text]
    );

    res.status(201).json({
      message: "Journal entry created successfully",
      entry: {
        id: result.insertId,
        user_id: userId,
        ambience,
        text,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("POST /api/journal error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// GET /api/journal/:userId — Get all entries
// ─────────────────────────────────────────────
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(
      `SELECT id, user_id, ambience, text, emotion, keywords, summary, created_at
       FROM journal_entries
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ entries: rows });
  } catch (err) {
    console.error("GET /api/journal/:userId error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// POST /api/journal/analyze — LLM emotion analysis
// ─────────────────────────────────────────────
router.post("/analyze", analyzeLimiter, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing required field: text" });
    }

    // Check cache first
    const cached = cache.get(text);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Call LLM
    const analysis = await analyzeEmotion(text);

    // Cache the result
    cache.set(text, analysis);

    // Optionally update the most recent entry with this text
    try {
      const [rows] = await pool.execute(
        `SELECT id FROM journal_entries WHERE text = ? AND emotion IS NULL ORDER BY created_at DESC LIMIT 1`,
        [text]
      );
      if (rows.length > 0) {
        await pool.execute(
          `UPDATE journal_entries SET emotion = ?, keywords = ?, summary = ? WHERE id = ?`,
          [analysis.emotion, JSON.stringify(analysis.keywords), analysis.summary, rows[0].id]
        );
      }
    } catch {
      // Non-critical — silently ignore if update fails
    }

    res.json(analysis);
  } catch (err) {
    console.error("POST /api/journal/analyze error:", err);
    res.status(500).json({ error: "Failed to analyze text. Please try again." });
  }
});

// ─────────────────────────────────────────────
// GET /api/journal/insights/:userId — Aggregated insights
// ─────────────────────────────────────────────
router.get("/insights/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Total entries
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM journal_entries WHERE user_id = ?`,
      [userId]
    );
    const totalEntries = parseInt(countRows[0].total, 10);

    if (totalEntries === 0) {
      return res.json({
        totalEntries: 0,
        topEmotion: null,
        mostUsedAmbience: null,
        recentKeywords: [],
      });
    }

    // Top emotion (from analyzed entries)
    const [emotionRows] = await pool.execute(
      `SELECT emotion, COUNT(*) as cnt
       FROM journal_entries
       WHERE user_id = ? AND emotion IS NOT NULL
       GROUP BY emotion
       ORDER BY cnt DESC
       LIMIT 1`,
      [userId]
    );
    const topEmotion = emotionRows.length > 0 ? emotionRows[0].emotion : null;

    // Most used ambience
    const [ambienceRows] = await pool.execute(
      `SELECT ambience, COUNT(*) as cnt
       FROM journal_entries
       WHERE user_id = ?
       GROUP BY ambience
       ORDER BY cnt DESC
       LIMIT 1`,
      [userId]
    );
    const mostUsedAmbience = ambienceRows[0].ambience;

    // Recent keywords (from last 10 analyzed entries)
    const [keywordRows] = await pool.execute(
      `SELECT keywords
       FROM journal_entries
       WHERE user_id = ? AND keywords IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Flatten and deduplicate keywords
    const allKeywords = keywordRows
      .flatMap((row) => {
        const kw = typeof row.keywords === "string" ? JSON.parse(row.keywords) : row.keywords;
        return Array.isArray(kw) ? kw : [];
      })
      .filter(Boolean);
    const recentKeywords = [...new Set(allKeywords)].slice(0, 10);

    res.json({
      totalEntries,
      topEmotion,
      mostUsedAmbience,
      recentKeywords,
    });
  } catch (err) {
    console.error("GET /api/journal/insights/:userId error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
