/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { TokenService } from '../../auth/services/token.js';
import { WorkerRepository } from '../repositories/worker.js';
import { WorkerService } from '../services/worker.js';
import { db } from '../../../database/index.js';
import { Worker, WorkerStatus, WorkerLease, LeaseStatus } from '@prisma/client';

vi.mock('../repositories/worker.js');

describe('Lease & Heartbeat Management', () => {
  const mockUserId = 'user-id-123';
  const mockWorkerId = '99999999-9999-9999-9999-999999999999';
  const mockLeaseId = '55555555-5555-5555-5555-555555555555';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();

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

  describe('POST /workers/:workerId/heartbeat', () => {
    it('should successfully log heartbeat and renew active leases', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.IDLE,
      } as Worker;

      const mockLeases = [
        {
          id: mockLeaseId,
          status: LeaseStatus.ACTIVE,
        },
      ] as WorkerLease[];

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);
      vi.spyOn(db.workerHeartbeat, 'create').mockResolvedValue({} as any);
      vi.spyOn(db.workerLease, 'findMany').mockResolvedValue(mockLeases);
      vi.spyOn(db.worker, 'update').mockResolvedValue(mockWorker);
      vi.spyOn(db.workerLease, 'update').mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/workers/${mockWorkerId}/heartbeat`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cpuUsage: 10,
          memoryUsage: 20,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('should reject heartbeat if the worker is OFFLINE', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.OFFLINE,
      } as Worker;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);

      const res = await request(app)
        .post(`/api/v1/workers/${mockWorkerId}/heartbeat`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('heartbeat rejected');
    });
  });

  describe('GET /workers/:workerId/lease', () => {
    it('should successfully retrieve worker active lease details', async () => {
      const mockWorker = {
        id: mockWorkerId,
      } as Worker;

      const mockLease = {
        id: mockLeaseId,
        status: LeaseStatus.ACTIVE,
      } as WorkerLease;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);
      vi.spyOn(db.workerLease, 'findFirst').mockResolvedValue(mockLease);

      const res = await request(app)
        .get(`/api/v1/workers/${mockWorkerId}/lease`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mockLeaseId);
    });
  });

  describe('POST /workers/:workerId/recover', () => {
    it('should successfully recover worker from LOST to IDLE', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.LOST,
      } as Worker;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);
      vi.spyOn(db.workerLease, 'updateMany').mockResolvedValue({} as any);
      vi.spyOn(db.worker, 'update').mockResolvedValue({
        ...mockWorker,
        status: WorkerStatus.IDLE,
      } as any);

      const res = await request(app)
        .post(`/api/v1/workers/${mockWorkerId}/recover`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('recovered');
    });

    it('should reject recovery if the worker status is not LOST', async () => {
      const mockWorker = {
        id: mockWorkerId,
        status: WorkerStatus.IDLE,
      } as Worker;

      vi.spyOn(WorkerRepository, 'findById').mockResolvedValue(mockWorker);

      const res = await request(app)
        .post(`/api/v1/workers/${mockWorkerId}/recover`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('is not in LOST status');
    });
  });

  describe('WorkerService.detectExpirations()', () => {
    it('should expire leases and mark workers LOST when expirations are found', async () => {
      const mockExpiredLeases = [
        {
          id: mockLeaseId,
          workerId: mockWorkerId,
          expiresAt: new Date(Date.now() - 1000),
        },
      ] as WorkerLease[];

      vi.spyOn(db.workerLease, 'findMany').mockResolvedValue(mockExpiredLeases);
      const updateLeaseSpy = vi
        .spyOn(db.workerLease, 'update')
        .mockResolvedValue({} as any);
      const updateWorkerSpy = vi
        .spyOn(db.worker, 'update')
        .mockResolvedValue({} as any);

      await WorkerService.detectExpirations();

      expect(updateLeaseSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockLeaseId },
          data: { status: LeaseStatus.EXPIRED },
        }),
      );

      expect(updateWorkerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockWorkerId },
          data: { status: WorkerStatus.LOST },
        }),
      );
    });
  });
});
