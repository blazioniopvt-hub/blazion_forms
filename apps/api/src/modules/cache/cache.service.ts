import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

// ============================================================
// Redis Cache Service — High-Performance Caching Layer
// Handles: API response caching, session store, rate counters
// Target: <5ms cache hits, 10x reduction in DB queries
// ============================================================

interface CacheOptions {
  ttl?: number; // seconds
  prefix?: string;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, { value: string; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout;

  // In production, replace Map with ioredis client:
  // private redis: Redis;

  async onModuleInit() {
    this.logger.log('Cache service initialized (in-memory mode)');
    // Production: this.redis = new Redis(process.env.REDIS_URL);
    // Cleanup expired keys every 60s
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  async onModuleDestroy() {
    clearInterval(this.cleanupInterval);
    // Production: await this.redis.quit();
  }

  // ── Core Operations ─────────────────────────

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: any, ttl = 300): Promise<void> {
    this.cache.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttl * 1000,
    });
    // Production: await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
    // Production: await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    // Delete all keys matching a glob pattern
    const prefix = pattern.replace('*', '');
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
    // Production:
    // const keys = await this.redis.keys(pattern);
    // if (keys.length) await this.redis.del(...keys);
  }

  // ── Cache-Aside Pattern ─────────────────────
  // Fetches from cache first, falls back to loader, caches result

  async getOrSet<T>(key: string, loader: () => Promise<T>, ttl = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await loader();
    await this.set(key, value, ttl);
    return value;
  }

  // ── Atomic Counter (rate limiting, analytics) ──

  async increment(key: string, ttl = 60): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.set(key, { value: '1', expiresAt: Date.now() + ttl * 1000 });
      return 1;
    }
    const newVal = parseInt(entry.value) + 1;
    entry.value = String(newVal);
    return newVal;
    // Production: return this.redis.incr(key); + this.redis.expire(key, ttl);
  }

  // ── Distributed Lock ────────────────────────
  // Prevents duplicate processing in multi-instance deployments

  async acquireLock(key: string, ttl = 30): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const existing = await this.get(lockKey);
    if (existing) return false;
    await this.set(lockKey, '1', ttl);
    return true;
    // Production: return this.redis.set(lockKey, '1', 'EX', ttl, 'NX') === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.del(`lock:${key}`);
  }

  // ── Cache Key Builders ──────────────────────

  static keys = {
    form: (id: string) => `form:${id}`,
    formPublic: (slug: string) => `form:public:${slug}`,
    formFields: (id: string) => `form:fields:${id}`,
    formAnalytics: (id: string, days: number) => `analytics:${id}:${days}`,
    workspaceForms: (wsId: string) => `ws:forms:${wsId}`,
    userProfile: (id: string) => `user:${id}`,
    responseCount: (formId: string) => `responses:count:${formId}`,
    rateLimit: (ip: string, endpoint: string) => `rate:${endpoint}:${ip}`,
    searchIndex: (formId: string) => `search:${formId}`,
    plans: () => 'billing:plans',
  };

  // ── Utilities ───────────────────────────────

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) this.logger.debug(`Cleaned ${cleaned} expired cache entries`);
  }

  async getStats() {
    return {
      keys: this.cache.size,
      memoryEstimate: `${Math.round([...this.cache.values()].reduce((sum, e) => sum + e.value.length, 0) / 1024)}KB`,
    };
  }
}
