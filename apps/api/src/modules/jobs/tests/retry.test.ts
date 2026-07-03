/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import { RetryService } from '../services/retry.js';
import { JobStatus, Job, RetryPolicy } from '@prisma/client';

describe('Retry Engine', () => {
  const mockUserId = 'user-id-123';
  const mockJobId = '77777777-7777-7777-7777-777777777777';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    RetryService.resetMetrics();

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

  describe('Retry delay & scheduling tests', () => {
    it('should schedule retry, apply backoff and jitter, and transition to RETRY_PENDING', async () => {
      const mockJob = {
        id: mockJobId,
        queueId: 'queue-123',
        status: JobStatus.RUNNING,
        attempts: 0, // first attempt failed (will become 1)
        queue: {
          retryPolicy: {
            maxAttempts: 3,
            backoffFactor: 2.0,
          } as RetryPolicy,
        } as any,
      } as any;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);
      const updateJobSpy = vi
        .spyOn(db.job, 'update')
        .mockResolvedValue(mockJob);
      const upsertScheduledSpy = vi
        .spyOn(db.scheduledJob, 'upsert')
        .mockResolvedValue({} as any);

      await RetryService.handleFailure(db, mockJobId);

      expect(updateJobSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockJobId },
          data: {
            status: JobStatus.RETRY_PENDING,
            attempts: 1,
          },
        }),
      );

      expect(upsertScheduledSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { jobId: mockJobId },
          create: expect.objectContaining({
            jobId: mockJobId,
            queueId: 'queue-123',
          }),
        }),
      );
    });

    it('should transition to RETRY_EXHAUSTED when retry attempts are exhausted', async () => {
      const mockJob = {
        id: mockJobId,
        queueId: 'queue-123',
        status: JobStatus.RUNNING,
        attempts: 2, // next attempt is 3, which is equal to maxAttempts
        queue: {
          retryPolicy: {
            maxAttempts: 3,
            backoffFactor: 2.0,
          } as RetryPolicy,
        } as any,
      } as any;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);
      const updateJobSpy = vi
        .spyOn(db.job, 'update')
        .mockResolvedValue(mockJob);

      await RetryService.handleFailure(db, mockJobId);

      expect(updateJobSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockJobId },
          data: {
            status: JobStatus.RETRY_EXHAUSTED,
            attempts: 3,
          },
        }),
      );
    });
  });

  describe('POST /jobs/:jobId/retry', () => {
    it('should successfully trigger manual retry for failed/exhausted jobs', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.RETRY_EXHAUSTED,
        attempts: 3,
      } as Job;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);
      vi.spyOn(db.scheduledJob, 'deleteMany').mockResolvedValue({
        count: 1,
      } as any);
      vi.spyOn(db.job, 'update').mockResolvedValue({
        ...mockJob,
        status: JobStatus.QUEUED,
        attempts: 4,
      } as any);

      const res = await request(app)
        .post(`/api/v1/jobs/${mockJobId}/retry`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('QUEUED');
      expect(res.body.attempts).toBe(4);
    });

    it('should reject manual retry for active/non-failed jobs', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.RUNNING,
        attempts: 1,
      } as Job;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);

      const res = await request(app)
        .post(`/api/v1/jobs/${mockJobId}/retry`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain(
        'Cannot manually retry job in RUNNING status',
      );
    });
  });

  describe('GET /jobs/:jobId/retries', () => {
    it('should return retry status details for a job', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.RETRY_PENDING,
        attempts: 2,
        queue: {
          retryPolicy: {
            maxAttempts: 3,
            backoffFactor: 2.0,
          } as RetryPolicy,
        } as any,
        scheduledJob: {
          nextRunAt: new Date(),
        },
      } as any;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);

      const res = await request(app)
        .get(`/api/v1/jobs/${mockJobId}/retries`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.attempts).toBe(2);
      expect(res.body.maxAttempts).toBe(3);
      expect(res.body.nextRetryAt).toBeDefined();
    });
  });

  describe('GET /retries/metrics', () => {
    it('should retrieve overall retry metrics', async () => {
      const mockJob = {
        id: mockJobId,
        queueId: 'queue-123',
        status: JobStatus.RUNNING,
        attempts: 0,
        queue: {
          retryPolicy: {
            maxAttempts: 3,
            backoffFactor: 2.0,
          } as RetryPolicy,
        } as any,
      } as any;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);
      vi.spyOn(db.job, 'update').mockResolvedValue(mockJob);
      vi.spyOn(db.scheduledJob, 'upsert').mockResolvedValue({} as any);
      vi.spyOn(db.job, 'count').mockResolvedValue(1);

      // Trigger one failure
      await RetryService.handleFailure(db, mockJobId);

      const res = await request(app)
        .get('/api/v1/retries/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalRetried).toBe(1);
      expect(res.body.totalExhausted).toBe(0);
      expect(res.body.activeRetryPending).toBe(1);
    });
  });
});
