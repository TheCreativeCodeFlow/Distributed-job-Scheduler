/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { OrganizationRepository } from '../repositories/organization.js';
import { db } from '../../../database/index.js';
import { TokenService } from '../../auth/services/token.js';
import {
  MembershipRole,
  OrganizationMember,
  Organization,
} from '@prisma/client';

vi.mock('../repositories/organization.js');

describe('Organization Administration Module', () => {
  const mockUserId = 'user-id-123';
  const mockOrgId = '00000000-0000-0000-0000-000000000000';
  const mockTargetUserId = '44444444-4444-4444-4444-444444444444';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock db.$transaction
    vi.spyOn(db, '$transaction').mockImplementation(((
      callback: (tx: any) => Promise<unknown>,
    ) => {
      // Return custom transactional tx mock
      const mockTx = {
        organizationMember: {
          update: vi.fn().mockImplementation(({ where, data }) => {
            return Promise.resolve({ id: where.id, ...data });
          }),
        },
      };
      return callback(mockTx);
    }) as any);

    // Operator authorization token
    token = TokenService.generateAccessToken({
      sub: mockUserId,
      email: 'owner@domain.com',
      role: 'DEVELOPER',
    });
  });

  describe('POST /organizations/:organizationId/transfer-ownership', () => {
    it('should successfully transfer ownership when operator is ORG_OWNER and target is member', async () => {
      const mockOperatorMembership = {
        id: 'm-operator',
        userId: mockUserId,
        role: MembershipRole.ORG_OWNER,
      } as OrganizationMember;

      const mockTargetMembership = {
        id: 'm-target',
        userId: mockTargetUserId,
        role: MembershipRole.DEVELOPER,
      } as OrganizationMember;

      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(
        mockOperatorMembership,
      );
      vi.spyOn(
        OrganizationRepository,
        'findMembershipByUserId',
      ).mockResolvedValue(mockTargetMembership);

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/transfer-ownership`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetUserId: mockTargetUserId,
        });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('ORG_OWNER');
    });

    it('should reject ownership transfer if requester is not the ORG_OWNER', async () => {
      const mockOperatorMembership = {
        id: 'm-operator',
        userId: mockUserId,
        role: MembershipRole.ORG_ADMIN, // Admin, not owner
      } as OrganizationMember;

      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(
        mockOperatorMembership,
      );

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/transfer-ownership`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetUserId: mockTargetUserId,
        });

      expect(res.status).toBe(403);
    });

    it('should reject ownership transfer if target user is not a member', async () => {
      const mockOperatorMembership = {
        id: 'm-operator',
        userId: mockUserId,
        role: MembershipRole.ORG_OWNER,
      } as OrganizationMember;

      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(
        mockOperatorMembership,
      );
      vi.spyOn(
        OrganizationRepository,
        'findMembershipByUserId',
      ).mockResolvedValue(null); // Not a member

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/transfer-ownership`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetUserId: mockTargetUserId,
        });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /organizations/:organizationId/suspend', () => {
    it('should successfully suspend when operator is ORG_OWNER', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_OWNER,
      } as any);
      vi.spyOn(OrganizationRepository, 'update').mockResolvedValue({
        id: mockOrgId,
        isSuspended: true,
      } as unknown as Organization);

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/suspend`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.isSuspended).toBe(true);
    });

    it('should reject suspension if operator is not ORG_OWNER', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_ADMIN,
      } as any);

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/suspend`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /organizations/:organizationId/settings', () => {
    it('should allow ORG_ADMIN to update settings', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_ADMIN,
      } as any);
      vi.spyOn(OrganizationRepository, 'update').mockResolvedValue({
        id: mockOrgId,
        metadata: { timezone: 'UTC' },
      } as unknown as Organization);

      const res = await request(app)
        .patch(`/api/v1/organizations/${mockOrgId}/settings`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          metadata: { timezone: 'UTC' },
        });

      expect(res.status).toBe(200);
      expect(res.body.metadata).toEqual({ timezone: 'UTC' });
    });
  });

  describe('GET /organizations/:organizationId/statistics', () => {
    it('should return correct counters if operator is ORG_ADMIN', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_ADMIN,
      } as any);
      vi.spyOn(db.organizationMember, 'count').mockResolvedValue(5);
      vi.spyOn(db.organizationInvitation, 'count').mockResolvedValue(2);

      const res = await request(app)
        .get(`/api/v1/organizations/${mockOrgId}/statistics`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        memberCount: 5,
        activeInvitations: 2,
        activeProjects: 0,
        queueCount: 0,
        jobCount: 0,
      });
    });
  });
});
