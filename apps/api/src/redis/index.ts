import { Redis } from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../logger/index.js';

export class RedisService {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!RedisService.instance) {
      RedisService.instance = new Redis(config.redis.url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        reconnectOnError: (err) => {
          logger.warn(
            { err: err.message },
            'Redis connection error, reconnecting...',
          );
          return true;
        },
      });

      RedisService.instance.on('connect', () => {
        logger.info('🔌 Redis connecting...');
      });

      RedisService.instance.on('ready', () => {
        logger.info('🔌 Redis client ready and connected.');
      });

      RedisService.instance.on('error', (err) => {
        logger.error(
          { err: err.message },
          'Redis client encountered an error.',
        );
      });

      RedisService.instance.on('end', () => {
        logger.info('🔌 Redis connection ended.');
      });
    }
    return RedisService.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisService.instance) {
      await RedisService.instance.quit();
      logger.info('🔌 Redis connection closed gracefully.');
      RedisService.instance = null;
    }
  }

  public static async checkHealth(): Promise<{
    ok: boolean;
    latencyMs?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      const client = RedisService.getInstance();
      const status = await client.ping();
      if (status === 'PONG') {
        return { ok: true, latencyMs: Date.now() - start };
      }
      return { ok: false, error: `Invalid response: ${status}` };
    } catch (error) {
      const err = error as Error;
      logger.error({ error: err.message }, 'Redis health check failed');
      return { ok: false, error: err.message };
    }
  }
}

export const redis = RedisService.getInstance();
export { Redis };
