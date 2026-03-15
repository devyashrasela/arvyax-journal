const rateLimit = require("express-rate-limit");

// General API rate limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

// Stricter limiter for LLM analysis endpoint: 20 requests per 15 minutes
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Analysis rate limit exceeded. Please wait before retrying.",
  },
});

module.exports = { apiLimiter, analyzeLimiter };
