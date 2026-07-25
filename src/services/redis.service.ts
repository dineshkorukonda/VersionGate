import Redis from "ioredis";
import { logger } from "../utils/logger";

class RedisService {
  private client: Redis | null = null;
  private pubClient: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.init();
  }

  private init() {
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times > 3) return null; // stop reconnecting after 3 tries if redis not available
          return Math.min(times * 100, 1000);
        },
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        logger.info({ redisUrl }, "Connected to Redis server");
      });

      this.client.on("error", (err) => {
        if (this.isConnected) {
          logger.warn({ err: err.message }, "Redis connection error");
        }
        this.isConnected = false;
      });

      // Silently try connecting in background
      this.client.connect().catch(() => {
        logger.debug("Redis server not reachable — using PostgreSQL fallback for locks/logs");
      });
    } catch (err) {
      logger.debug({ err }, "Redis initialization skipped");
    }
  }

  public isAvailable(): boolean {
    return this.isConnected && this.client !== null && this.client.status === "ready";
  }

  /**
   * Acquire a distributed lock with automatic expiration (TTL in ms).
   */
  async acquireLock(key: string, ttlMs: number = 900_000): Promise<boolean> {
    if (!this.isAvailable() || !this.client) return false;
    try {
      const lockKey = `lock:${key}`;
      const result = await this.client.set(lockKey, "locked", "PX", ttlMs, "NX");
      return result === "OK";
    } catch {
      return false;
    }
  }

  /**
   * Release a distributed lock.
   */
  async releaseLock(key: string): Promise<void> {
    if (!this.isAvailable() || !this.client) return;
    try {
      await this.client.del(`lock:${key}`);
    } catch (err) {
      logger.debug({ err, key }, "Failed to release Redis lock");
    }
  }

  /**
   * Publish a log line to a channel for real-time WebSocket listeners.
   */
  async publishLog(jobId: string, logLine: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      if (!this.pubClient && this.client) {
        this.pubClient = this.client.duplicate();
        await this.pubClient.connect();
      }
      if (this.pubClient) {
        await this.pubClient.publish(`job:logs:${jobId}`, logLine);
      }
    } catch {
      // Ignore pubsub publish errors
    }
  }
}

export const redisService = new RedisService();
export default redisService;
