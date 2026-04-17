import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const FIVE_MINUTES = 300;

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  private isReady = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('redis.host');
    const port = this.config.get<number>('redis.port') ?? 6379;

    if (!host) {
      this.logger.warn('REDIS_HOST not set — caching disabled (DB will be queried each time)');
      return;
    }

    this.client = new Redis({
      host,
      port,
      password: this.config.get<string>('redis.password') || undefined,
      lazyConnect: true,
      retryStrategy: () => null, // don't retry — fail fast
    });

    this.client.on('connect', () => {
      this.isReady = true;
      this.logger.log(`Redis connected: ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.isReady = false;
      this.logger.warn(`Redis error: ${err.message} — caching disabled`);
    });

    this.client.connect().catch(() => {
      this.logger.warn('Redis connection failed — running without cache');
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  /** Get a cached JSON value. Returns null on miss or if Redis is down. */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady || !this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /** Set a JSON value with TTL in seconds (default 5 minutes). */
  async set(key: string, value: unknown, ttl = FIVE_MINUTES): Promise<void> {
    if (!this.isReady || !this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch {
      // caching is best-effort
    }
  }

  /** Delete a cached key (call on config update to invalidate). */
  async del(key: string): Promise<void> {
    if (!this.isReady || !this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // ignore
    }
  }
}
