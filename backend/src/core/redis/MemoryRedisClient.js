class MemoryRedisClient {
  constructor() {
    this.store = new Map();
    this.expiry = new Map();
    this.status = 'ready';
  }

  _purgeExpired(key) {
    const expiresAt = this.expiry.get(key);

    if (expiresAt && expiresAt <= Date.now()) {
      this.store.delete(key);
      this.expiry.delete(key);
    }
  }

  async get(key) {
    this._purgeExpired(key);
    return this.store.get(key) ?? null;
  }

  async set(key, value, mode, ttlSeconds) {
    this.store.set(key, value);

    if (mode === 'EX' && ttlSeconds) {
      this.expiry.set(key, Date.now() + ttlSeconds * 1000);
    } else {
      this.expiry.delete(key);
    }

    return 'OK';
  }

  async del(...keys) {
    let deleted = 0;

    keys.forEach((key) => {
      if (this.store.delete(key)) {
        deleted += 1;
      }
      this.expiry.delete(key);
    });

    return deleted;
  }

  async incr(key) {
    this._purgeExpired(key);
    const current = parseInt(this.store.get(key) || '0', 10) + 1;
    this.store.set(key, String(current));
    return current;
  }

  async expire(key, ttlSeconds) {
    if (!this.store.has(key)) {
      return 0;
    }

    this.expiry.set(key, Date.now() + ttlSeconds * 1000);
    return 1;
  }

  async ttl(key) {
    this._purgeExpired(key);
    const expiresAt = this.expiry.get(key);

    if (!expiresAt) {
      return this.store.has(key) ? -1 : -2;
    }

    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  }

  async exists(key) {
    this._purgeExpired(key);
    return this.store.has(key) ? 1 : 0;
  }

  async keys(pattern) {
    const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
    return [...this.store.keys()].filter((key) => key.startsWith(prefix));
  }

  async quit() {
    this.store.clear();
    this.expiry.clear();
    this.status = 'end';
  }

  async connect() {
    this.status = 'ready';
  }
}

module.exports = {
  MemoryRedisClient,
};
