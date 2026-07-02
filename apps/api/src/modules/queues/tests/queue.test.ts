/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { QueueRepository } from '../repositories/queue.js';
import { ProjectRepository } from '../../projects/repositories/project.js';
import { OrganizationRepository } from '../../organizations/repositories/organization.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import {
  MembershipRole,
  Queue,
  OrganizationMember,
  Project,
  QueueStatus,
} from '@prisma/client';

vi.mock('../repositories/queue.js');
vi.mock('../../projects/repositories/project.js');
vi.mock('../../organizations/repositories/organization.js');

describe('Queue Management Module', () => {
  const mockUserId = 'user-id-123';
  const mockOrgId = '00000000-0000-0000-0000-000000000000';
  const mockProjectId = '33333333-3333-3333-3333-333333333333';
  const mockQueueId = '55555555-5555-5555-5555-555555555555';
  const mockRetryPolicyId = '66666666-6666-6666-6666-666666666666';
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

  describe('POST /projects/:projectId/queues', () => {
    it('should successfully create a queue when operator is ORG_OWNER', async () => {
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        name: 'Mock Queue',
        slug: 'mock-queue',
        priority: 0,
        rateLimit: null,
        status: QueueStatus.ACTIVE,
        maxConcurrency: 10,
        metadata: {},
        isActive: true,
        isArchived: false,
        retryPolicyId: mockRetryPolicyId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as Queue;

      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_OWNER,
      } as unknown as OrganizationMember);
      vi.spyOn(QueueRepository, 'findByName').mockResolvedValue(null);
      vi.spyOn(QueueRepository, 'findBySlug').mockResolvedValue(null);
      vi.spyOn(QueueRepository, 'create').mockResolvedValue(mockQueue);

      const res = await request(app)
        .post(`/api/v1/projects/${mockProjectId}/queues`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Mock Queue',
          slug: 'mock-queue',
          retryPolicyId: mockRetryPolicyId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', mockQueueId);
    });

    it('should block queue creation if name or slug already exists', async () => {
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_OWNER,
      } as unknown as OrganizationMember);
      vi.spyOn(QueueRepository, 'findByName').mockResolvedValue({
        id: 'existing',
      } as any);

      const res = await request(app)
        .post(`/api/v1/projects/${mockProjectId}/queues`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Mock Queue',
          slug: 'mock-queue',
          retryPolicyId: mockRetryPolicyId,
        });

      expect(res.status).toBe(409);
      expect(res.body.detail).toContain('already exists');
    });
  });

  describe('GET /queues/:queueId', () => {
    it('should return queue details to active organization members', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        name: 'Mock Queue',
      } as any;

      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as any);

      const res = await request(app)
        .get(`/api/v1/queues/${mockQueueId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', mockQueueId);
    });

    it('should deny retrieval to non-members (tenant isolation)', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
      } as any;

      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(null); // Not a member

      const res = await request(app)
        .get(`/api/v1/queues/${mockQueueId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /queues/:queueId', () => {
    it('should reject Developer updates that change general parameters (concurrency)', async () => {
      const mockQueue = { id: mockQueueId, projectId: mockProjectId } as any;
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as any);

      const res = await request(app)
        .patch(`/api/v1/queues/${mockQueueId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          maxConcurrency: 5,
        });

      expect(res.status).toBe(403);
      expect(res.body.detail).toContain('metadata');
    });

    it('should allow Developer updates changing only metadata', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        metadata: {},
      } as any;
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as any);
      vi.spyOn(QueueRepository, 'update').mockResolvedValue({
        ...mockQueue,
        metadata: { maxJobs: 100 },
      });

      const res = await request(app)
        .patch(`/api/v1/queues/${mockQueueId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          metadata: { maxJobs: 100 },
        });

      expect(res.status).toBe(200);
      expect(res.body.metadata).toEqual({ maxJobs: 100 });
    });
  });

  describe('POST /queues/:queueId/restore', () => {
    it('should successfully restore queue when operator is PROJECT_MAINTAINER', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        isArchived: true,
      } as any;
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as Project;

      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.PROJECT_MAINTAINER,
      } as any);
      vi.spyOn(QueueRepository, 'update').mockResolvedValue({
        ...mockQueue,
        isArchived: false,
        status: QueueStatus.ACTIVE,
      });

      const res = await request(app)
        .post(`/api/v1/queues/${mockQueueId}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.isArchived).toBe(false);
      expect(res.body.status).toBe('ACTIVE');
    });
  });

  describe('Queue Operational Controls State Transitions', () => {
    const mockProject = {
      id: mockProjectId,
      organizationId: mockOrgId,
    } as Project;

    beforeEach(() => {
      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_ADMIN,
      } as any);
    });

    it('should successfully transition ACTIVE -> PAUSED', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        status: QueueStatus.ACTIVE,
      } as any;
      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(QueueRepository, 'update').mockResolvedValue({
        ...mockQueue,
        status: QueueStatus.PAUSED,
      });

      const res = await request(app)
        .post(`/api/v1/queues/${mockQueueId}/pause`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PAUSED');
    });

    it('should reject invalid transition DISABLED -> PAUSED', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        status: QueueStatus.DISABLED,
      } as any;
      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);

      const res = await request(app)
        .post(`/api/v1/queues/${mockQueueId}/pause`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('Invalid queue state transition');
    });

    it('should successfully transition DISABLED -> ACTIVE on enable', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        status: QueueStatus.DISABLED,
      } as any;
      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(QueueRepository, 'update').mockResolvedValue({
        ...mockQueue,
        status: QueueStatus.ACTIVE,
      });

      const res = await request(app)
        .post(`/api/v1/queues/${mockQueueId}/enable`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ACTIVE');
    });

    it('should successfully transition ACTIVE -> DRAINING', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        status: QueueStatus.ACTIVE,
      } as any;
      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);
      vi.spyOn(QueueRepository, 'update').mockResolvedValue({
        ...mockQueue,
        status: QueueStatus.DRAINING,
      });

      const res = await request(app)
        .post(`/api/v1/queues/${mockQueueId}/drain`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('DRAINING');
    });

    it('should retrieve status using the status endpoint', async () => {
      const mockQueue = {
        id: mockQueueId,
        projectId: mockProjectId,
        status: QueueStatus.PAUSED,
      } as any;
      vi.spyOn(QueueRepository, 'findById').mockResolvedValue(mockQueue);

      const res = await request(app)
        .get(`/api/v1/queues/${mockQueueId}/status`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PAUSED');
    });
  });
});
