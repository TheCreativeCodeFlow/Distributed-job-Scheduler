/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import { SchedulerService } from '../services/scheduler.js';

describe('Scheduler Promotion Engine', () => {
  const mockUserId = 'user-id-123';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    SchedulerService.resetMetrics();

    // Mock db.$transaction
    vi.spyOn(db, '$transaction').mockImplementation(((
      callback: (tx: any) => Promise<any>,
    ) => {
      return callback(db);
    }) as any);

    token = TokenService.generateAccessToken({
      sub: mockUserId,
      email: 'operator@domain.com',
      role: 'DEVELOPER',
    });
  });

  describe('POST /scheduler/promote', () => {
    it('should successfully promote scheduled jobs', async () => {
      const mockCandidates = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          job_id: '22222222-2222-2222-2222-222222222222',
        },
      ];

      vi.spyOn(db, '$queryRaw').mockResolvedValue(mockCandidates);
      vi.spyOn(db.job, 'updateMany').mockResolvedValue({ count: 1 } as any);

      const res = await request(app)
        .post('/api/v1/scheduler/promote')
        .set('Authorization', `Bearer ${token}`)
        .send({ batchSize: 10 });

      expect(res.status).toBe(200);
      expect(res.body.promotedCount).toBe(1);
    });

    it('should return 0 when no eligible jobs are found', async () => {
      vi.spyOn(db, '$queryRaw').mockResolvedValue([]);

      const res = await request(app)
        .post('/api/v1/scheduler/promote')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.promotedCount).toBe(0);
    });

    it('should reject invalid batchSize', async () => {
      const res = await request(app)
        .post('/api/v1/scheduler/promote')
        .set('Authorization', `Bearer ${token}`)
        .send({ batchSize: -5 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('title', 'Validation Error');
    });
  });

  describe('GET /scheduler/status', () => {
    it('should return scheduler status details', async () => {
      const res = await request(app)
        .get('/api/v1/scheduler/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.lastPromotionCycleAt).toBeNull();
    });
  });

  describe('GET /scheduler/metrics', () => {
    it('should report metrics for promotions', async () => {
      const mockCandidates = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          job_id: '22222222-2222-2222-2222-222222222222',
        },
      ];

      vi.spyOn(db, '$queryRaw').mockResolvedValue(mockCandidates);
      vi.spyOn(db.job, 'updateMany').mockResolvedValue({ count: 1 } as any);

      // Trigger a promotion cycle
      await SchedulerService.promote(5);

      const res = await request(app)
        .get('/api/v1/scheduler/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalPromoted).toBe(1);
      expect(res.body.lastPromotedCount).toBe(1);
      expect(res.body.errorCount).toBe(0);
    });
  });
});
