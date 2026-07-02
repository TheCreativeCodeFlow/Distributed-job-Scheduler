/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { OrganizationRepository } from '../repositories/organization.js';
import {
  UserRepository,
  UserWithMemberships,
} from '../../auth/repositories/user.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import { MembershipRole, OrganizationMember } from '@prisma/client';

vi.mock('../repositories/organization.js');
vi.mock('../../auth/repositories/user.js');

describe('Organization Membership Module', () => {
  const mockUserId = 'user-id-123';
  const mockOrgId = '00000000-0000-0000-0000-000000000000';
  const mockMemberId = '11111111-1111-1111-1111-111111111111';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock db.$transaction to run the callback directly
    vi.spyOn(db, '$transaction').mockImplementation(((
      callback: (tx: unknown) => Promise<unknown>,
    ) => {
      return callback(db);
    }) as any);

    // Generate valid authentication token
    token = TokenService.generateAccessToken({
      sub: mockUserId,
      email: 'operator@domain.com',
      role: 'DEVELOPER',
    });
  });

  describe('POST /organizations/:organizationId/members', () => {
    it('should successfully add a member when operator is ORG_OWNER', async () => {
      const mockTargetUser = {
        id: 'target-user-123',
        email: 'target@domain.com',
        name: 'Target User',
        passwordHash: 'hashed-pass',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        memberships: [],
      } as unknown as UserWithMemberships;

      const mockMembership = {
        id: mockMemberId,
        userId: 'target-user-123',
        organizationId: mockOrgId,
        role: MembershipRole.DEVELOPER,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'target-user-123',
          email: 'target@domain.com',
          name: 'Target User',
        },
      };

      // Operator is owner
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        id: 'm-operator',
        userId: mockUserId,
        organizationId: mockOrgId,
        role: MembershipRole.ORG_OWNER,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as OrganizationMember);
      // Target user exists
      vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(mockTargetUser);
      // No duplicate membership
      vi.spyOn(
        OrganizationRepository,
        'findMembershipByUserId',
      ).mockResolvedValue(null);
      // Create succeeded
      vi.spyOn(OrganizationRepository, 'createMembership').mockResolvedValue(
        mockMembership as any,
      );

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'target@domain.com',
          role: 'DEVELOPER',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', mockMemberId);
    });

    it('should reject adding member if target user is already a member', async () => {
      const mockTargetUser = {
        id: 'target-user-123',
        email: 'target@domain.com',
        name: 'Target User',
        passwordHash: 'hashed-pass',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        memberships: [],
      } as unknown as UserWithMemberships;

      const mockExisting = {
        id: 'm-1',
        userId: 'target-user-123',
        organizationId: mockOrgId,
        role: MembershipRole.DEVELOPER,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as OrganizationMember;

      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        id: 'm-operator',
        userId: mockUserId,
        organizationId: mockOrgId,
        role: MembershipRole.ORG_OWNER,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as OrganizationMember);
      vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(mockTargetUser);
      vi.spyOn(
        OrganizationRepository,
        'findMembershipByUserId',
      ).mockResolvedValue(mockExisting);

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'target@domain.com',
          role: 'DEVELOPER',
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('title', 'Conflict');
    });
  });

  describe('GET /organizations/:organizationId/members', () => {
    it('should return members list if requester is member', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        id: 'm-operator',
        userId: mockUserId,
        organizationId: mockOrgId,
        role: MembershipRole.DEVELOPER,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as OrganizationMember);
      vi.spyOn(OrganizationRepository, 'listMembers').mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/v1/organizations/${mockOrgId}/members`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should deny listing if requester is not a member (tenant isolation)', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/organizations/${mockOrgId}/members`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404); // returns 404 for security privacy
    });
  });

  describe('PATCH /organizations/:organizationId/members/:memberId', () => {
    it('should successfully update role if operator is owner', async () => {
      const mockTarget = {
        id: mockMemberId,
        userId: 'target-user-123',
        organizationId: mockOrgId,
        role: MembershipRole.DEVELOPER,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'target-user-123',
          email: 'target@domain.com',
          name: 'Target User',
        },
      };

      vi.spyOn(OrganizationRepository, 'findMemberById').mockResolvedValue(
        mockTarget as any,
      );
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        id: 'm-operator',
        userId: mockUserId,
        organizationId: mockOrgId,
        role: MembershipRole.ORG_OWNER,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as OrganizationMember);
      vi.spyOn(OrganizationRepository, 'updateMembership').mockResolvedValue({
        ...mockTarget,
        role: MembershipRole.ORG_ADMIN,
      } as unknown as OrganizationMember);

      const res = await request(app)
        .patch(`/api/v1/organizations/${mockOrgId}/members/${mockMemberId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          role: 'ORG_ADMIN',
        });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('ORG_ADMIN');
    });

    it('should prevent demoting sole owner', async () => {
      const mockTarget = {
        id: mockMemberId,
        userId: 'target-user-123',
        organizationId: mockOrgId,
        role: MembershipRole.ORG_OWNER,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'target-user-123',
          email: 'target@domain.com',
          name: 'Target User',
        },
      };

      vi.spyOn(OrganizationRepository, 'findMemberById').mockResolvedValue(
        mockTarget as any,
      );
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        id: 'm-operator',
        userId: mockUserId,
        organizationId: mockOrgId,
        role: MembershipRole.ORG_OWNER,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as OrganizationMember);
      vi.spyOn(OrganizationRepository, 'listMembers').mockResolvedValue([
        mockTarget as any,
      ]); // Only 1 owner

      const res = await request(app)
        .patch(`/api/v1/organizations/${mockOrgId}/members/${mockMemberId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          role: 'DEVELOPER',
        });

      expect(res.status).toBe(409);
      expect(res.body.detail).toContain('sole Organization Owner');
    });
  });

  describe('DELETE /organizations/:organizationId/members/:memberId', () => {
    it('should allow self-removal if user is not sole owner', async () => {
      const mockTarget = {
        id: mockMemberId,
        userId: mockUserId,
        organizationId: mockOrgId,
        role: MembershipRole.DEVELOPER,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: mockUserId,
          email: 'operator@domain.com',
          name: 'Operator Name',
        },
      };

      vi.spyOn(OrganizationRepository, 'findMemberById').mockResolvedValue(
        mockTarget as any,
      );
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(
        mockTarget as unknown as OrganizationMember,
      );
      vi.spyOn(OrganizationRepository, 'deleteMembership').mockResolvedValue(
        mockTarget as unknown as OrganizationMember,
      );

      const res = await request(app)
        .delete(`/api/v1/organizations/${mockOrgId}/members/${mockMemberId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });

    it('should block leaving organization if sole owner', async () => {
      const mockTarget = {
        id: mockMemberId,
        userId: mockUserId,
        organizationId: mockOrgId,
        role: MembershipRole.ORG_OWNER,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: mockUserId,
          email: 'operator@domain.com',
          name: 'Operator Name',
        },
      };

      vi.spyOn(OrganizationRepository, 'findMemberById').mockResolvedValue(
        mockTarget as any,
      );
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(
        mockTarget as unknown as OrganizationMember,
      );
      vi.spyOn(OrganizationRepository, 'listMembers').mockResolvedValue([
        mockTarget as any,
      ]);

      const res = await request(app)
        .delete(`/api/v1/organizations/${mockOrgId}/members/${mockMemberId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(409);
    });
  });
});
