/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { WorkerRepository } from '../repositories/worker.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import { Worker, WorkerStatus, Job, JobStatus } from '@prisma/client';

vi.mock('../repositories/worker.js');

describe('Worker Polling & Atomic Job Claiming', () => {
  const mockUserId = 'user-id-123';
  const mockWorkerId = '99999999-9999-9999-9999-999999999999';
  const mockJobId = '77777777-7777-7777-7777-777777777777';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock db.$transaction
    vi.spyOn(db, '$transaction').mockImplementation(((
      callback: (tx: any) => Promise<any>,
    ) => {
      return callback(db);
    }) as any);

    vi.spyOn(db.workerLease, 'create').mockResolvedValue({} as any);

    token = TokenService.generateAccessToken({
      sub: mockUserId,
      email: 'operator@domain.com',
      role: 'DEVELOPER',
    });
  });

  describe('POST /workers/:workerId/poll', () => {
    it('should successfully poll and claim a job when worker is IDLE and has capacity', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.IDLE,
        maxConcurrency: 5,
        supportedQueues: ['default'],
      } as Worker;

      const mockJob = {
        id: mockJobId,
        status: JobStatus.CLAIMED,
        workerId: mockWorkerId,
      } as Job;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);
      vi.spyOn(db.job, 'count').mockResolvedValue(0);

      // Mock raw SQL returning a job ID
      vi.spyOn(db, '$queryRawUnsafe').mockResolvedValue([{ id: mockJobId }]);
      vi.spyOn(db.job, 'update').mockResolvedValue(mockJob);

      const res = await request(app)
        .post(`/api/v1/workers/${mockWorkerId}/poll`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          supportedQueues: ['default'],
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mockJobId);
      expect(res.body.status).toBe('CLAIMED');
    });

    it('should return 204 No Content when no eligible jobs are available', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.IDLE,
        maxConcurrency: 5,
        supportedQueues: ['default'],
      } as Worker;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);
      vi.spyOn(db.job, 'count').mockResolvedValue(0);
      vi.spyOn(db, '$queryRawUnsafe').mockResolvedValue([]);

      const res = await request(app)
        .post(`/api/v1/workers/${mockWorkerId}/poll`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          supportedQueues: ['default'],
        });

      expect(res.status).toBe(204);
    });

    it('should reject poll requests if worker is not IDLE', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.REGISTERING,
        maxConcurrency: 5,
      } as Worker;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);

      const res = await request(app)
        .post(`/api/v1/workers/${mockWorkerId}/poll`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          supportedQueues: ['default'],
        });

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('Worker is not IDLE');
    });

    it('should reject poll requests if worker is at maximum capacity', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.IDLE,
        maxConcurrency: 2,
        supportedQueues: ['default'],
      } as Worker;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);
      vi.spyOn(db.job, 'count').mockResolvedValue(2); // Current active claims = 2

      const res = await request(app)
        .post(`/api/v1/workers/${mockWorkerId}/poll`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          supportedQueues: ['default'],
        });

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('capacity limits exceeded');
    });
  });

  describe('GET /jobs/:jobId/claim', () => {
    it('should successfully claim a specific job directly', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.IDLE,
        maxConcurrency: 5,
      } as Worker;

      const mockJob = {
        id: mockJobId,
        status: JobStatus.CLAIMED,
        workerId: mockWorkerId,
      } as Job;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);
      vi.spyOn(db.job, 'count').mockResolvedValue(0);
      vi.spyOn(db, '$queryRawUnsafe').mockResolvedValue([{ id: mockJobId }]);
      vi.spyOn(db.job, 'update').mockResolvedValue(mockJob);

      const res = await request(app)
        .get(`/api/v1/jobs/${mockJobId}/claim`)
        .query({ workerId: mockWorkerId })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mockJobId);
      expect(res.body.status).toBe('CLAIMED');
    });
  });
});
