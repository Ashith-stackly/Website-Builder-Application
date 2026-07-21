const crypto = require('crypto');

/**
 * A deliberately small in-process TTL cache for repeated generation requests.
 * Values are keyed by a one-way hash; the cache never logs or persists prompt
 * content. Use Redis or another shared cache before horizontally scaling.
 */
class AICache {
  constructor({ maxEntries = 250 } = {}) {
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  createKey(scope, value) {
    return crypto
      .createHash('sha256')
      .update(`${scope}:${JSON.stringify(value)}`)
      .digest('hex');
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    if (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey) this.entries.delete(oldestKey);
    }

    this.entries.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
    return value;
  }

  clear() {
    this.entries.clear();
  }
}

module.exports = AICache;
