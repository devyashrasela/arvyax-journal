const crypto = require("crypto");

/**
 * Simple in-memory LRU cache for analysis results.
 * Key: SHA-256 hash of the text → Value: { emotion, keywords, summary }
 * Max entries: 500, evicts oldest on overflow.
 */
class AnalysisCache {
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  _hash(text) {
    return crypto.createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
  }

  get(text) {
    const key = this._hash(text);
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(text, value) {
    const key = this._hash(text);
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

module.exports = new AnalysisCache();
