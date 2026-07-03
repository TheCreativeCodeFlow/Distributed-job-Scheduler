/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { WorkerRepository } from '../repositories/worker.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import { Worker, WorkerStatus } from '@prisma/client';

vi.mock('../repositories/worker.js');

describe('Worker Registration & Lifecycle Module', () => {
  const mockUserId = 'user-id-123';
  const mockWorkerId = '99999999-9999-9999-9999-999999999999';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock db.$transaction
    vi.spyOn(db, '$transaction').mockImplementation(((
      callback: (tx: unknown) => Promise<unknown>,
    ) => {
      return callback(db);
    }) as any);

    token = TokenService.generateAccessToken({
      sub: mockUserId,
      email: 'operator@domain.com',
      role: 'DEVELOPER',
    });
  });

  describe('POST /workers/register', () => {
    it('should register a new worker successfully', async () => {
      const mockWorker = {
        id: mockWorkerId,
        hostname: 'node-1',
        instanceId: 'inst-1',
        version: '1.0.0',
        supportedQueues: ['default'],
        supportedTags: ['gpu'],
        maxConcurrency: 10,
        status: WorkerStatus.REGISTERING,
        registeredAt: new Date(),
      } as Worker;

      vi.spyOn(WorkerRepository, 'findByHostnameAndInstance').mockResolvedValue(
        null,
      );
      vi.spyOn(WorkerRepository, 'create').mockResolvedValue(mockWorker);

      const res = await request(app)
        .post('/api/v1/workers/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          hostname: 'node-1',
          instanceId: 'inst-1',
          version: '1.0.0',
          supportedQueues: ['default'],
          supportedTags: ['gpu'],
          maxConcurrency: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(mockWorkerId);
      expect(res.body.status).toBe('REGISTERING');
    });

    it('should return the existing registration if worker is active', async () => {
      const mockWorker = {
        id: mockWorkerId,
        hostname: 'node-1',
        instanceId: 'inst-1',
        status: WorkerStatus.IDLE,
      } as Worker;

      vi.spyOn(WorkerRepository, 'findByHostnameAndInstance').mockResolvedValue(
        mockWorker,
      );

      const res = await request(app)
        .post('/api/v1/workers/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          hostname: 'node-1',
          instanceId: 'inst-1',
          version: '1.0.0',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(mockWorkerId);
      expect(res.body.status).toBe('IDLE');
    });

    it('should transition OFFLINE worker back to REGISTERING', async () => {
      const mockOfflineWorker = {
        id: mockWorkerId,
        hostname: 'node-1',
        instanceId: 'inst-1',
        status: WorkerStatus.OFFLINE,
      } as Worker;

      const mockRegisteredWorker = {
        ...mockOfflineWorker,
        status: WorkerStatus.REGISTERING,
      } as Worker;

      vi.spyOn(WorkerRepository, 'findByHostnameAndInstance').mockResolvedValue(
        mockOfflineWorker,
      );
      vi.spyOn(WorkerRepository, 'update').mockResolvedValue(
        mockRegisteredWorker,
      );

      const res = await request(app)
        .post('/api/v1/workers/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          hostname: 'node-1',
          instanceId: 'inst-1',
          version: '1.0.0',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('REGISTERING');
    });
  });

  describe('PATCH /workers/:workerId', () => {
    it('should successfully transition from REGISTERING to IDLE', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.REGISTERING,
      } as Worker;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);
      vi.spyOn(WorkerRepository, 'update').mockResolvedValue({
        ...mockWorker,
        status: WorkerStatus.IDLE,
      } as Worker);

      const res = await request(app)
        .patch(`/api/v1/workers/${mockWorkerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: WorkerStatus.IDLE,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('IDLE');
    });

    it('should reject invalid transitions (e.g. OFFLINE to IDLE directly)', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.OFFLINE,
      } as Worker;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);

      const res = await request(app)
        .patch(`/api/v1/workers/${mockWorkerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: WorkerStatus.IDLE,
        });

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('Invalid worker status transition');
    });
  });

  describe('DELETE /workers/:workerId', () => {
    it('should transition worker to OFFLINE (deregistered)', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.IDLE,
      } as Worker;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);
      vi.spyOn(WorkerRepository, 'update').mockResolvedValue({
        ...mockWorker,
        status: WorkerStatus.OFFLINE,
      } as Worker);

      const res = await request(app)
        .delete(`/api/v1/workers/${mockWorkerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OFFLINE');
    });
  });

  describe('GET /workers/:workerId/status', () => {
    it('should return the status of a worker', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.REGISTERING,
      } as Worker;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);

      const res = await request(app)
        .get(`/api/v1/workers/${mockWorkerId}/status`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('REGISTERING');
    });
  });
});
