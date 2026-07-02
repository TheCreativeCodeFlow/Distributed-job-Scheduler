/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { JobRepository } from '../repositories/job.js';
import { QueueRepository } from '../../queues/repositories/queue.js';
import { ProjectRepository } from '../../projects/repositories/project.js';
import { OrganizationRepository } from '../../organizations/repositories/organization.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import {
  MembershipRole,
  Job,
  Queue,
  Project,
  JobStatus,
  QueueStatus,
} from '@prisma/client';

vi.mock('../repositories/job.js');
vi.mock('../../queues/repositories/queue.js');
vi.mock('../../projects/repositories/project.js');
vi.mock('../../organizations/repositories/organization.js');

describe('Job Submission Engine', () => {
  const mockUserId = 'user-id-123';
  const mockOrgId = '00000000-0000-0000-0000-000000000000';
  const mockProjectId = '33333333-3333-3333-3333-333333333333';
  const mockQueueId = '55555555-5555-5555-5555-555555555555';
  const mockJobId = '77777777-7777-7777-7777-777777777777';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock db.$transaction
    vi.spyOn(db, '$transaction').mockImplementation(((
      callback: (tx: unknown) => Promise<unknown>,
    ) => {
      return callback(db);
    }) as any);

    // Operator authorization token
    token = TokenService.generateAccessToken({
      sub: mockUserId,
      email: 'operator@domain.com',
      role: 'DEVELOPER',
    });
  });

  describe('POST /queues/:queueId/jobs', () => {
    it('should successfully submit a job when queue is ACTIVE and operator is DEVELOPER', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        status: QueueStatus.ACTIVE,
        isActive: true,
        isArchived: false,
      } as Queue;

      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      const mockJob = {
        id: mockJobId,
        queueId: mockQueueId,
        payload: { task: 'run' },
        status: JobStatus.QUEUED,
        priority: 1,
        attempts: 0,
        createdAt: new Date(),
      } as any;

      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as any);
      vi.spyOn(JobRepository, 'findByIdempotencyKey').mockResolvedValue(null);
      vi.spyOn(JobRepository, 'create').mockResolvedValue(mockJob);

      const res = await request(app)
        .post(`/api/v1/queues/${mockQueueId}/jobs`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          payload: { task: 'run' },
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', mockJobId);
      expect(res.body.status).toBe('QUEUED');
    });

    it('should reject submissions when the queue is not active (e.g. PAUSED)', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        status: QueueStatus.PAUSED,
        isActive: true,
        isArchived: false,
      } as Queue;

      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);

      const res = await request(app)
        .post(`/api/v1/queues/${mockQueueId}/jobs`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          payload: { task: 'run' },
        });

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('active or unavailable');
    });

    it('should reject job submission for READ_ONLY viewers', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        status: QueueStatus.ACTIVE,
        isActive: true,
        isArchived: false,
      } as Queue;

      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.READ_ONLY,
      } as any);

      const res = await request(app)
        .post(`/api/v1/queues/${mockQueueId}/jobs`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          payload: { task: 'run' },
        });

      expect(res.status).toBe(403);
    });

    it('should return existing job on idempotency key match', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        status: QueueStatus.ACTIVE,
        isActive: true,
        isArchived: false,
      } as Queue;

      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;
      const mockJob = { id: mockJobId, status: JobStatus.QUEUED } as Job;

      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as any);
      vi.spyOn(JobRepository, 'findByIdempotencyKey').mockResolvedValue(
        mockJob,
      );

      const res = await request(app)
        .post(`/api/v1/queues/${mockQueueId}/jobs`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          payload: { task: 'run' },
          idempotencyKey: 'unique-key',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(mockJobId);
    });
  });

  describe('POST /jobs/:jobId/cancel', () => {
    it('should successfully cancel a QUEUED job', async () => {
      const mockJob = {
        id: mockJobId,
        queueId: mockQueueId,
        status: JobStatus.QUEUED,
      } as Job;
      const mockQueue = { id: mockQueueId, projectId: mockProjectId } as any;
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      vi.spyOn(JobRepository, 'findById').mockResolvedValue(mockJob);
      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as any);
      vi.spyOn(JobRepository, 'updateStatus').mockResolvedValue({
        ...mockJob,
        status: JobStatus.CANCELLED,
      });

      const res = await request(app)
        .post(`/api/v1/jobs/${mockJobId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CANCELLED');
    });
  });

  describe('GET /jobs/:jobId/status', () => {
    it('should return job status to members', async () => {
      const mockJob = {
        id: mockJobId,
        queueId: mockQueueId,
        status: JobStatus.QUEUED,
      } as Job;
      const mockQueue = { id: mockQueueId, projectId: mockProjectId } as any;
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      vi.spyOn(JobRepository, 'findById').mockResolvedValue(mockJob);
      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.READ_ONLY,
      } as any);

      const res = await request(app)
        .get(`/api/v1/jobs/${mockJobId}/status`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('QUEUED');
    });
  });
});
