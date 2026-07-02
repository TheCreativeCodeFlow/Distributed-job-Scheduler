import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { OrganizationRepository } from '../repositories/organization.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import {
  MembershipRole,
  Organization,
  OrganizationMember,
} from '@prisma/client';

vi.mock('../repositories/organization.js');

describe('Organization Core Module', () => {
  const mockUserId = 'user-id-123';
  const mockOrgId = '00000000-0000-0000-0000-000000000000';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock db.$transaction to run the callback directly
    /* eslint-disable @typescript-eslint/no-explicit-any */
    vi.spyOn(db, '$transaction').mockImplementation(((
      callback: (tx: unknown) => Promise<unknown>,
    ) => {
      return callback(db);
    }) as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Generate valid authentication token
    token = TokenService.generateAccessToken({
      sub: mockUserId,
      email: 'test@domain.com',
      role: 'DEVELOPER',
    });
  });

  describe('POST /organizations', () => {
    it('should successfully create an organization and assign owner role', async () => {
      const mockOrg = {
        id: mockOrgId,
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description',
        logoUrl: 'https://logo.com/img.png',
        metadata: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.spyOn(OrganizationRepository, 'findBySlug').mockResolvedValue(null);
      vi.spyOn(OrganizationRepository, 'create').mockResolvedValue(
        mockOrg as unknown as Organization,
      );
      vi.spyOn(OrganizationRepository, 'createMembership').mockResolvedValue(
        {} as unknown as OrganizationMember,
      );

      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Organization',
          slug: 'test-org',
          description: 'Test description',
          logoUrl: 'https://logo.com/img.png',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', mockOrgId);
      expect(res.body).toHaveProperty('slug', 'test-org');
    });

    it('should return conflict error if organization slug already exists', async () => {
      const mockOrg = {
        id: mockOrgId,
        slug: 'test-org',
      } as unknown as Organization;

      vi.spyOn(OrganizationRepository, 'findBySlug').mockResolvedValue(mockOrg);

      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Organization',
          slug: 'test-org',
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('title', 'Conflict');
    });
  });

  describe('GET /organizations/:organizationId', () => {
    it('should allow retrieve if user has active membership', async () => {
      const mockOrg = {
        id: mockOrgId,
        name: 'Test Org',
        slug: 'test-org',
      } as unknown as Organization;

      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as unknown as OrganizationMember);
      vi.spyOn(OrganizationRepository, 'findById').mockResolvedValue(mockOrg);

      const res = await request(app)
        .get(`/api/v1/organizations/${mockOrgId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', mockOrgId);
    });

    it('should deny access if user is not a member', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/organizations/${mockOrgId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404); // Should throw NotFound to protect privacy of other orgs
    });
  });

  describe('PATCH /organizations/:organizationId', () => {
    it('should successfully update details if requester is owner', async () => {
      const mockUpdatedOrg = {
        id: mockOrgId,
        name: 'Updated Org',
        slug: 'test-org',
      } as unknown as Organization;

      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_OWNER,
      } as unknown as OrganizationMember);
      vi.spyOn(OrganizationRepository, 'update').mockResolvedValue(
        mockUpdatedOrg,
      );

      const res = await request(app)
        .patch(`/api/v1/organizations/${mockOrgId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Org',
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Org');
    });

    it('should deny updates if user is not the owner', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as unknown as OrganizationMember);

      const res = await request(app)
        .patch(`/api/v1/organizations/${mockOrgId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Org',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /organizations/:organizationId', () => {
    it('should soft delete organization if owner', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_OWNER,
      } as unknown as OrganizationMember);
      vi.spyOn(OrganizationRepository, 'softDelete').mockResolvedValue(
        {} as unknown as Organization,
      );

      const res = await request(app)
        .delete(`/api/v1/organizations/${mockOrgId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });

    it('should prevent soft deletion if developer', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as unknown as OrganizationMember);

      const res = await request(app)
        .delete(`/api/v1/organizations/${mockOrgId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
