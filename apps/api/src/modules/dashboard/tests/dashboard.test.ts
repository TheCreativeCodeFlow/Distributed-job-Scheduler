/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { db } from '../../../database/index.js';
import { TokenService } from '../../auth/services/token.js';
import { RedisService } from '../../../redis/index.js';

const makeAuthHeader = (role = 'DEVELOPER') => {
  const token = TokenService.generateAccessToken({
    sub: 'user-123',
    email: 'test@example.com',
    role,
  });
  return `Bearer ${token}`;
};

describe('Dashboard APIs Integrations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Stub Redis so rate-limit and health checks work in unit tests
    vi.spyOn(RedisService, 'getInstance').mockReturnValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      ping: vi.fn().mockResolvedValue('PONG'),
    } as any);

    vi.spyOn(RedisService, 'checkHealth').mockResolvedValue({ ok: true });

    // Provide default spies for db to avoid real DB access
    vi.spyOn(db.organization, 'count').mockResolvedValue(0);
    vi.spyOn(db.project, 'count').mockResolvedValue(0);
    vi.spyOn(db.queue, 'count').mockResolvedValue(0);
    vi.spyOn(db.queue, 'findMany').mockResolvedValue([]);
    vi.spyOn(db.worker, 'count').mockResolvedValue(0);
    vi.spyOn(db.worker, 'findMany').mockResolvedValue([]);
    vi.spyOn(db.job, 'count').mockResolvedValue(0);
    vi.spyOn(db.job, 'findMany').mockResolvedValue([]);
    vi.spyOn(db.job, 'aggregate').mockResolvedValue({
      _sum: { attempts: 0 },
    } as any);
    vi.spyOn(db.deadLetterEntry, 'count').mockResolvedValue(0);
    vi.spyOn(db.deadLetterEntry, 'findMany').mockResolvedValue([]);
    vi.spyOn(db.jobExecution, 'count').mockResolvedValue(0);
    vi.spyOn(db.jobExecution, 'findMany').mockResolvedValue([]);
    vi.spyOn(db.jobExecution, 'aggregate').mockResolvedValue({
      _avg: { durationMs: 0 },
    } as any);
    vi.spyOn(db.organizationMember, 'findMany').mockResolvedValue([]);
    vi.spyOn(db.systemSetting, 'findFirst').mockResolvedValue(null);
    vi.spyOn(db.auditLog, 'count').mockResolvedValue(0);
    vi.spyOn(db, '$queryRaw').mockResolvedValue([1]);
  });

  describe('GET /dashboard/overview', () => {
    it('should block unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/dashboard/overview');
      expect(res.status).toBe(401);
    });

    it('should aggregate system-wide stats for SYSTEM_ADMIN', async () => {
      vi.spyOn(db.organizationMember, 'findMany').mockResolvedValue([]);
      vi.spyOn(db.organization, 'count').mockResolvedValue(10);
      vi.spyOn(db.project, 'count').mockResolvedValue(20);
      vi.spyOn(db.queue, 'count').mockResolvedValue(30);
      vi.spyOn(db.worker, 'count').mockResolvedValue(5);
      vi.spyOn(db.job, 'count').mockResolvedValue(8);
      vi.spyOn(db.deadLetterEntry, 'count').mockResolvedValue(2);

      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', makeAuthHeader('SYSTEM_ADMIN'));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        organizationsCount: 10,
        projectsCount: 20,
        queuesCount: 30,
        activeWorkersCount: 5,
        runningJobsCount: 8,
        scheduledJobsCount: 8,
        retryPendingJobsCount: 8,
        dlqEntriesCount: 2,
        systemUptimeSec: expect.any(Number),
        throughput: {
          completed24h: 8,
          failed24h: 8,
        },
      });
    });

    it('should enforce tenant isolation for standard DEVELOPER role', async () => {
      // Mock membership inside Org-1 only
      vi.spyOn(db.organizationMember, 'findMany').mockResolvedValue([
        { organizationId: 'org-1' },
      ] as any);

      vi.spyOn(db.project, 'count').mockResolvedValue(2);
      vi.spyOn(db.queue, 'count').mockResolvedValue(4);
      vi.spyOn(db.worker, 'count').mockResolvedValue(3);
      vi.spyOn(db.job, 'count').mockResolvedValue(1);
      vi.spyOn(db.deadLetterEntry, 'count').mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', makeAuthHeader('DEVELOPER'));

      expect(res.status).toBe(200);
      // Developer's organizationsCount should reflect membership list size (1)
      expect(res.body.organizationsCount).toBe(1);
      expect(res.body.projectsCount).toBe(2);
    });
  });

  describe('GET /dashboard/queues', () => {
    it('should retrieve list of queues with mapped depth details', async () => {
      vi.spyOn(db.organizationMember, 'findMany').mockResolvedValue([
        { organizationId: 'org-1' },
      ] as any);

      vi.spyOn(db.queue, 'findMany').mockResolvedValue([
        {
          id: 'q-1',
          name: 'high-priority',
          slug: 'high-priority',
          status: 'ACTIVE',
          project: { id: 'p-1', name: 'project-1' },
        },
      ] as any);

      vi.spyOn(db.job, 'count').mockResolvedValue(5);
      vi.spyOn(db.jobExecution, 'aggregate').mockResolvedValue({
        _avg: { durationMs: 120 },
      } as any);
      vi.spyOn(db.worker, 'count').mockResolvedValue(2);

      const res = await request(app)
        .get('/api/v1/dashboard/queues')
        .set('Authorization', makeAuthHeader('ORG_ADMIN'));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          id: 'q-1',
          name: 'high-priority',
          slug: 'high-priority',
          status: 'ACTIVE',
          project: { id: 'p-1', name: 'project-1' },
          depth: 5,
          waitingJobsCount: 5,
          runningJobsCount: 5,
          averageExecutionTimeMs: 120,
          activeWorkersCount: 2,
        },
      ]);
    });
  });

  describe('GET /dashboard/workers', () => {
    it('should list all registered active workers', async () => {
      vi.spyOn(db.worker, 'findMany').mockResolvedValue([
        {
          id: 'w-1',
          hostname: 'worker-node-1',
          status: 'IDLE',
          version: '1.0.0',
          supportedQueues: ['q-1'],
          maxConcurrency: 10,
          leases: [],
          executions: [],
        },
      ] as any);

      const res = await request(app)
        .get('/api/v1/dashboard/workers')
        .set('Authorization', makeAuthHeader('DEVELOPER'));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          id: 'w-1',
          hostname: 'worker-node-1',
          status: 'IDLE',
          version: '1.0.0',
          supportedQueues: ['q-1'],
          maxConcurrency: 10,
          runningJobsCount: 0,
          heartbeatAgeSec: null,
          leaseCount: 0,
        },
      ]);
    });
  });

  describe('GET /dashboard/jobs', () => {
    it('should validate query pagination bounds via Zod', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/jobs?page=-5')
        .set('Authorization', makeAuthHeader('DEVELOPER'));

      expect(res.status).toBe(400);
      expect(res.body.title).toBe('Validation Error');
    });

    it('should execute paginated job retrieval', async () => {
      vi.spyOn(db.organizationMember, 'findMany').mockResolvedValue([]);
      vi.spyOn(db.job, 'count').mockResolvedValue(100);
      vi.spyOn(db.job, 'findMany').mockResolvedValue([
        { id: 'j-1', priority: 1, status: 'QUEUED', queue: { name: 'q' } },
      ] as any);

      const res = await request(app)
        .get('/api/v1/dashboard/jobs?page=2&limit=15')
        .set('Authorization', makeAuthHeader('SYSTEM_ADMIN'));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        total: 100,
        page: 2,
        limit: 15,
        totalPages: 7,
        items: [
          { id: 'j-1', priority: 1, status: 'QUEUED', queue: { name: 'q' } },
        ],
      });
    });
  });

  describe('GET /dashboard/executions', () => {
    it('should support execution status filtering', async () => {
      vi.spyOn(db.organizationMember, 'findMany').mockResolvedValue([]);
      vi.spyOn(db.jobExecution, 'count').mockResolvedValue(1);
      vi.spyOn(db.jobExecution, 'findMany').mockResolvedValue([
        { id: 'exec-1', status: 'SUCCESS' },
      ] as any);

      const res = await request(app)
        .get('/api/v1/dashboard/executions?status=SUCCESS')
        .set('Authorization', makeAuthHeader('SYSTEM_ADMIN'));

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
    });
  });

  describe('GET /dashboard/retries', () => {
    it('should retrieve retries stats', async () => {
      vi.spyOn(db.job, 'aggregate').mockResolvedValue({
        _sum: { attempts: 15 },
      } as any);
      vi.spyOn(db.job, 'count').mockResolvedValue(5);

      const res = await request(app)
        .get('/api/v1/dashboard/retries')
        .set('Authorization', makeAuthHeader('DEVELOPER'));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalAttempts: 15,
        pendingRetries: 5,
        exhaustedRetries: 5,
      });
    });
  });

  describe('GET /dashboard/dlq', () => {
    it('should retrieve DLQ log overview', async () => {
      vi.spyOn(db.deadLetterEntry, 'count').mockResolvedValue(3);
      vi.spyOn(db.deadLetterEntry, 'findMany').mockResolvedValue([
        { id: 'dlq-1', failureReason: 'Error' },
      ] as any);

      const res = await request(app)
        .get('/api/v1/dashboard/dlq')
        .set('Authorization', makeAuthHeader('DEVELOPER'));

      expect(res.status).toBe(200);
      expect(res.body.activeEntries).toBe(3);
      expect(res.body.recentEntries).toHaveLength(1);
    });
  });

  describe('GET /dashboard/scheduler', () => {
    it('should return scheduler state', async () => {
      vi.spyOn(db.systemSetting, 'findFirst').mockResolvedValue({
        value: 'PAUSED',
      } as any);
      vi.spyOn(db.auditLog, 'count').mockResolvedValue(123);

      const res = await request(app)
        .get('/api/v1/dashboard/scheduler')
        .set('Authorization', makeAuthHeader('DEVELOPER'));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'PAUSED',
        loopIntervalMs: 5000,
        totalPromotedJobs: 123,
      });
    });
  });

  describe('GET /dashboard/activity', () => {
    it('should return activity list', async () => {
      vi.spyOn(db.job, 'findMany').mockResolvedValue([
        {
          id: 'job-1',
          status: 'COMPLETED',
          updatedAt: new Date(),
          queue: { name: 'q' },
        },
      ] as any);

      const res = await request(app)
        .get('/api/v1/dashboard/activity')
        .set('Authorization', makeAuthHeader('DEVELOPER'));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /dashboard/timeline', () => {
    it('should return timeline event sequence', async () => {
      vi.spyOn(db.job, 'findMany').mockResolvedValue([
        { id: 'job-1', createdAt: new Date(), queue: { name: 'q' } },
      ] as any);

      const res = await request(app)
        .get('/api/v1/dashboard/timeline')
        .set('Authorization', makeAuthHeader('DEVELOPER'));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /dashboard/health', () => {
    it('should return combined DB / Redis metrics', async () => {
      vi.spyOn(db, '$queryRaw').mockResolvedValue([1]);
      vi.spyOn(db.worker, 'count').mockResolvedValue(2);

      const res = await request(app)
        .get('/api/v1/dashboard/health')
        .set('Authorization', makeAuthHeader('DEVELOPER'));

      expect(res.status).toBe(200);
      expect(res.body.databaseStatus).toBe('HEALTHY');
      expect(res.body.redisStatus).toBe('HEALTHY');
    });
  });
});
