/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { ProjectRepository } from '../repositories/project.js';
import { OrganizationRepository } from '../../organizations/repositories/organization.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import { MembershipRole, Project, OrganizationMember } from '@prisma/client';

vi.mock('../repositories/project.js');
vi.mock('../../organizations/repositories/organization.js');

describe('Project Management Module', () => {
  const mockUserId = 'user-id-123';
  const mockOrgId = '00000000-0000-0000-0000-000000000000';
  const mockProjectId = '33333333-3333-3333-3333-333333333333';
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

  describe('POST /organizations/:organizationId/projects', () => {
    it('should successfully create a project when operator is ORG_OWNER', async () => {
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
        name: 'Mock Project',
        slug: 'mock-project',
        isArchived: false,
        isActive: true,
        metadata: {},
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as Project;

      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_OWNER,
      } as unknown as OrganizationMember);
      vi.spyOn(ProjectRepository, 'findByName').mockResolvedValue(null);
      vi.spyOn(ProjectRepository, 'findBySlug').mockResolvedValue(null);
      vi.spyOn(ProjectRepository, 'create').mockResolvedValue(mockProject);

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Mock Project',
          slug: 'mock-project',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', mockProjectId);
    });

    it('should block project creation if name or slug already exists', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_OWNER,
      } as unknown as OrganizationMember);
      vi.spyOn(ProjectRepository, 'findByName').mockResolvedValue({
        id: 'existing',
      } as any);

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Mock Project',
          slug: 'mock-project',
        });

      expect(res.status).toBe(409);
      expect(res.body.detail).toContain('already exists');
    });
  });

  describe('GET /projects/:projectId', () => {
    it('should return project details to active organization members', async () => {
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
        name: 'Mock Project',
      } as any;

      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as any);

      const res = await request(app)
        .get(`/api/v1/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', mockProjectId);
    });

    it('should deny retrieval to non-members (tenant isolation)', async () => {
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
      } as any;

      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(null); // Not a member

      const res = await request(app)
        .get(`/api/v1/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404); // returns 404 for tenant security
    });
  });

  describe('PATCH /projects/:projectId', () => {
    it('should reject Developer updates that change general parameters (name)', async () => {
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
        name: 'Mock Project',
      } as any;

      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER, // Developer role
      } as any);

      const res = await request(app)
        .patch(`/api/v1/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Changed Name',
        });

      expect(res.status).toBe(403);
      expect(res.body.detail).toContain('metadata');
    });

    it('should allow Developer updates changing only metadata', async () => {
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
        name: 'Mock Project',
        metadata: {},
      } as any;

      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as any);
      vi.spyOn(ProjectRepository, 'update').mockResolvedValue({
        ...mockProject,
        metadata: { env: 'prod' },
      });

      const res = await request(app)
        .patch(`/api/v1/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          metadata: { env: 'prod' },
        });

      expect(res.status).toBe(200);
      expect(res.body.metadata).toEqual({ env: 'prod' });
    });
  });

  describe('POST /projects/:projectId/restore', () => {
    it('should successfully restore project when operator is PROJECT_MAINTAINER', async () => {
      const mockProject = {
        id: mockProjectId,
        organizationId: mockOrgId,
        isArchived: true,
      } as any;

      vi.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject);
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.PROJECT_MAINTAINER,
      } as any);
      vi.spyOn(ProjectRepository, 'update').mockResolvedValue({
        ...mockProject,
        isArchived: false,
      });

      const res = await request(app)
        .post(`/api/v1/projects/${mockProjectId}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.isArchived).toBe(false);
    });
  });
});
