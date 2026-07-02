import { Router, Request, Response } from 'express';
import { Database } from '../database/index.js';
import { RedisService } from '../redis/index.js';
import { config } from '../config/index.js';

const router = Router();

// /live endpoint - simple diagnostic confirmation
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// /ready endpoint - downstream connections status check
router.get('/ready', async (req: Request, res: Response) => {
  const dbHealth = await Database.checkHealth();
  const redisHealth = await RedisService.checkHealth();

  if (dbHealth.ok && redisHealth.ok) {
    return res.status(200).json({ status: 'READY' });
  }

  return res.status(503).json({
    status: 'NOT_READY',
    details: {
      database: dbHealth.ok ? 'UP' : 'DOWN',
      redis: redisHealth.ok ? 'UP' : 'DOWN',
    },
  });
});

// /health endpoint - comprehensive dashboard metrics
router.get('/health', async (req: Request, res: Response) => {
  const dbHealth = await Database.checkHealth();
  const redisHealth = await RedisService.checkHealth();
  const memory = process.memoryUsage();

  const isHealthy = dbHealth.ok && redisHealth.ok;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DOWN',
    version: '1.0.0',
    environment: config.env,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbHealth.ok ? 'UP' : 'DOWN',
        latencyMs: dbHealth.latencyMs,
        error: dbHealth.error,
      },
      redis: {
        status: redisHealth.ok ? 'UP' : 'DOWN',
        latencyMs: redisHealth.latencyMs,
        error: redisHealth.error,
      },
    },
    system: {
      memoryUsage: {
        rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
      },
    },
  });
});

export const healthRouter = router;
