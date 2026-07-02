/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger/index.js';

export class Database {
  private static instance: PrismaClient | null = null;

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
      });

      // Bind Prisma events to Pino logger
      const client = Database.instance as any;
      client.$on('query', (e: any) => {
        logger.debug(
          { query: e.query, params: e.params, duration: `${e.duration}ms` },
          'Prisma Query',
        );
      });
      client.$on('info', (e: any) => {
        logger.info({ message: e.message }, 'Prisma Info');
      });
      client.$on('warn', (e: any) => {
        logger.warn({ message: e.message }, 'Prisma Warning');
      });
      client.$on('error', (e: any) => {
        logger.error({ message: e.message }, 'Prisma Error');
      });
    }
    return Database.instance;
  }

  public static async connect(): Promise<void> {
    const client = Database.getInstance();
    await client.$connect();
    logger.info('🔌 Database connection successfully established.');
  }

  public static async disconnect(): Promise<void> {
    if (Database.instance) {
      await Database.instance.$disconnect();
      logger.info('🔌 Database disconnected gracefully.');
      Database.instance = null;
    }
  }

  public static async checkHealth(): Promise<{
    ok: boolean;
    latencyMs?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      const client = Database.getInstance();
      await client.$queryRaw`SELECT 1`;
      return { ok: true, latencyMs: Date.now() - start };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Database health check failed');
      return { ok: false, error: error.message };
    }
  }
}

export const db = Database.getInstance();
export { PrismaClient };
