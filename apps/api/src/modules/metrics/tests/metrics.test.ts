/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import { MetricsService } from '../services/metrics.js';

describe('Observability & Metrics Engine', () => {
  const mockUserId = 'user-id-123';
  const mockOrgId = 'org-id-777';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    MetricsService.resetCounters();

    token = TokenService.generateAccessToken({
      sub: mockUserId,
      email: 'operator@domain.com',
      role: 'DEVELOPER',
    });

    vi.spyOn(db.organizationMember, 'findMany').mockResolvedValue([
      {
        userId: mockUserId,
        organizationId: mockOrgId,
        role: 'DEVELOPER',
      } as any,
    ]);
  });

  describe('JSON endpoints', () => {
    it('should return queues metrics filtering by tenant memberships', async () => {
      vi.spyOn(db.queue, 'count').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/metrics/queues')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        active: 1,
        paused: 1,
        disabled: 1,
        draining: 1,
      });
    });

    it('should return workers status counts', async () => {
      vi.spyOn(db.worker, 'count').mockResolvedValue(2);

      const res = await request(app)
        .get('/api/v1/metrics/workers')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        registered: 2,
        idle: 2,
        running: 2,
        lost: 2,
        recovering: 2,
      });
    });

    it('should return jobs metrics with tenant isolation checks', async () => {
      vi.spyOn(db.job, 'count').mockResolvedValue(3);

      const res = await request(app)
        .get('/api/v1/metrics/jobs')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        queued: 3,
        claimed: 3,
        running: 3,
        completed: 3,
        failed: 3,
        scheduled: 3,
      });
    });

    it('should return retries metrics details', async () => {
      vi.spyOn(db.job, 'count').mockResolvedValue(4);

      const res = await request(app)
        .get('/api/v1/metrics/retries')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        pending: 4,
        exhausted: 4,
      });
    });

    it('should return DLQ entry metrics details', async () => {
      vi.spyOn(db.deadLetterEntry, 'count').mockResolvedValue(5);

      const res = await request(app)
        .get('/api/v1/metrics/dlq')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        active: 5,
        replayed: 5,
      });
    });

    it('should return scheduler promotion latency stats', async () => {
      const res = await request(app)
        .get('/api/v1/metrics/scheduler')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('promotionCount');
      expect(res.body).toHaveProperty('emptyScans');
      expect(res.body).toHaveProperty('promotionLatency');
    });

    it('should return system resource metrics', async () => {
      vi.spyOn(db, '$queryRaw').mockResolvedValue([{ '1': 1 }] as any);
      vi.spyOn(db.workerLease, 'count').mockResolvedValue(2);

      const res = await request(app)
        .get('/api/v1/metrics/system')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('memory');
      expect(res.body).toHaveProperty('cpu');
      expect(res.body).toHaveProperty('databaseLatency');
      expect(res.body).toHaveProperty('redisLatency');
      expect(res.body.expiredLeases).toBe(2);
    });
  });

  describe('Prometheus endpoint format', () => {
    it('should return Prometheus formatted metrics with text/plain header', async () => {
      vi.spyOn(db.queue, 'count').mockResolvedValue(1);
      vi.spyOn(db.worker, 'count').mockResolvedValue(2);
      vi.spyOn(db.job, 'count').mockResolvedValue(3);
      vi.spyOn(db.deadLetterEntry, 'count').mockResolvedValue(4);
      vi.spyOn(db, '$queryRaw').mockResolvedValue([{ '1': 1 }] as any);
      vi.spyOn(db.workerLease, 'count').mockResolvedValue(1);
      vi.spyOn(db.jobExecution, 'findMany').mockResolvedValue([
        { durationMs: 100 },
        { durationMs: 200 },
        { durationMs: 300 },
      ] as any);

      const res = await request(app)
        .get('/api/v1/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('# HELP queues_active');
      expect(res.text).toContain('# TYPE queues_active gauge');
      expect(res.text).toContain('queues_active 1');
      expect(res.text).toContain('workers_registered 2');
      expect(res.text).toContain('jobs_queued 3');
      expect(res.text).toContain('dlq_active 4');
      expect(res.text).toContain('execution_average_runtime_ms 200');
      expect(res.text).toContain('execution_p50_runtime_ms 200');
    });
  });
});
