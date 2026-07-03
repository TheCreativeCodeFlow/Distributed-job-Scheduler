/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import { Job, JobStatus, JobExecution, ExecutionStatus } from '@prisma/client';

describe('Job Execution Engine', () => {
  const mockUserId = 'user-id-123';
  const mockWorkerId = '99999999-9999-9999-9999-999999999999';
  const mockJobId = '77777777-7777-7777-7777-777777777777';
  const mockExecutionId = '66666666-6666-6666-6666-666666666666';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock db.$transaction
    vi.spyOn(db, '$transaction').mockImplementation(((
      callback: (tx: any) => Promise<any>,
    ) => {
      return callback(db);
    }) as any);

    vi.spyOn(db.workerLease, 'updateMany').mockResolvedValue({
      count: 1,
    } as any);

    token = TokenService.generateAccessToken({
      sub: mockUserId,
      email: 'operator@domain.com',
      role: 'DEVELOPER',
    });
  });

  describe('POST /jobs/:jobId/start', () => {
    it('should successfully start execution of a CLAIMED job owned by the worker', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.CLAIMED,
        workerId: mockWorkerId,
      } as Job;

      const mockExecution = {
        id: mockExecutionId,
        jobId: mockJobId,
        workerId: mockWorkerId,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      } as JobExecution;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);
      vi.spyOn(db.job, 'update').mockResolvedValue(mockJob);
      vi.spyOn(db.jobExecution, 'create').mockResolvedValue(mockExecution);

      const res = await request(app)
        .post(`/api/v1/jobs/${mockJobId}/start`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          workerId: mockWorkerId,
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mockExecutionId);
      expect(res.body.status).toBe('RUNNING');
    });

    it('should reject start execution if the job status is not CLAIMED', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.QUEUED,
        workerId: mockWorkerId,
      } as Job;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);

      const res = await request(app)
        .post(`/api/v1/jobs/${mockJobId}/start`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          workerId: mockWorkerId,
        });

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('is not in CLAIMED status');
    });

    it('should reject start execution if the job belongs to another worker', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.CLAIMED,
        workerId: 'different-worker-id',
      } as Job;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);

      const res = await request(app)
        .post(`/api/v1/jobs/${mockJobId}/start`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          workerId: mockWorkerId,
        });

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('belongs to another worker');
    });
  });

  describe('POST /jobs/:jobId/complete', () => {
    it('should successfully complete execution of a RUNNING job', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.RUNNING,
        workerId: mockWorkerId,
      } as Job;

      const mockExecution = {
        id: mockExecutionId,
        jobId: mockJobId,
        workerId: mockWorkerId,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(Date.now() - 5000),
      } as JobExecution;

      const mockUpdatedExecution = {
        ...mockExecution,
        status: ExecutionStatus.SUCCESS,
        finishedAt: new Date(),
        durationMs: 5000,
        exitCode: 0,
        result: { done: true },
      } as any;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);
      vi.spyOn(db.jobExecution, 'findFirst').mockResolvedValue(mockExecution);
      vi.spyOn(db.job, 'update').mockResolvedValue(mockJob);
      vi.spyOn(db.jobExecution, 'update').mockResolvedValue(
        mockUpdatedExecution,
      );

      const res = await request(app)
        .post(`/api/v1/jobs/${mockJobId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          workerId: mockWorkerId,
          result: { done: true },
          exitCode: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('SUCCESS');
      expect(res.body.durationMs).toBe(5000);
      expect(res.body.result).toEqual({ done: true });
    });

    it('should reject completion if the job is not currently RUNNING', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.CLAIMED,
        workerId: mockWorkerId,
      } as Job;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);

      const res = await request(app)
        .post(`/api/v1/jobs/${mockJobId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          workerId: mockWorkerId,
        });

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('is not in RUNNING status');
    });
  });

  describe('POST /jobs/:jobId/fail', () => {
    it('should successfully fail execution of a RUNNING job', async () => {
      const mockJob = {
        id: mockJobId,
        status: JobStatus.RUNNING,
        workerId: mockWorkerId,
      } as Job;

      const mockExecution = {
        id: mockExecutionId,
        jobId: mockJobId,
        workerId: mockWorkerId,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(Date.now() - 3000),
      } as JobExecution;

      const mockFailedExecution = {
        ...mockExecution,
        status: ExecutionStatus.ERROR,
        finishedAt: new Date(),
        durationMs: 3000,
        exitCode: 1,
        error: { message: 'fatal' },
      } as any;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);
      vi.spyOn(db.jobExecution, 'findFirst').mockResolvedValue(mockExecution);
      vi.spyOn(db.job, 'update').mockResolvedValue(mockJob);
      vi.spyOn(db.jobExecution, 'update').mockResolvedValue(
        mockFailedExecution,
      );

      const res = await request(app)
        .post(`/api/v1/jobs/${mockJobId}/fail`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          workerId: mockWorkerId,
          error: { message: 'fatal' },
          exitCode: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ERROR');
      expect(res.body.error).toEqual({ message: 'fatal' });
      expect(res.body.exitCode).toBe(1);
    });
  });

  describe('GET /jobs/:jobId/execution', () => {
    it('should successfully fetch latest execution metadata details', async () => {
      const mockExecution = {
        id: mockExecutionId,
        jobId: mockJobId,
        workerId: mockWorkerId,
        status: ExecutionStatus.SUCCESS,
        startedAt: new Date(),
      } as JobExecution;

      vi.spyOn(db.jobExecution, 'findFirst').mockResolvedValue(mockExecution);

      const res = await request(app)
        .get(`/api/v1/jobs/${mockJobId}/execution`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mockExecutionId);
    });
  });
});
