/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { InvitationRepository } from '../repositories/invitation.js';
import { OrganizationRepository } from '../../organizations/repositories/organization.js';
import {
  UserRepository,
  UserWithMemberships,
} from '../../auth/repositories/user.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import {
  MembershipRole,
  InvitationStatus,
  OrganizationInvitation,
  OrganizationMember,
} from '@prisma/client';

vi.mock('../repositories/invitation.js');
vi.mock('../../organizations/repositories/organization.js');
vi.mock('../../auth/repositories/user.js');

describe('Organization Invitation Module', () => {
  const mockUserId = 'user-id-123';
  const mockOrgId = '00000000-0000-0000-0000-000000000000';
  const mockInvitationId = '22222222-2222-2222-2222-222222222222';
  const mockToken = 'abcdef1234567890abcdef1234567890';
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

  describe('POST /organizations/:organizationId/invitations', () => {
    it('should successfully create an invitation when operator is ORG_OWNER', async () => {
      const mockInvitation = {
        id: mockInvitationId,
        organizationId: mockOrgId,
        email: 'invitee@domain.com',
        role: MembershipRole.DEVELOPER,
        inviterId: mockUserId,
        token: mockToken,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OrganizationInvitation;

      // Operator is owner
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_OWNER,
      } as unknown as OrganizationMember);
      // Invitee doesn't exist or is not a member
      vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(null);
      // No duplicate pending active invitation
      vi.spyOn(InvitationRepository, 'findActiveInvitation').mockResolvedValue(
        null,
      );
      // Create invitation resolved
      vi.spyOn(InvitationRepository, 'create').mockResolvedValue(
        mockInvitation,
      );

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/invitations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'invitee@domain.com',
          role: 'DEVELOPER',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', mockInvitationId);
      expect(res.body).toHaveProperty('status', 'PENDING');
    });

    it('should block invitation if the target email is already a member', async () => {
      const mockInvitee = {
        id: 'invitee-123',
        email: 'invitee@domain.com',
        memberships: [],
      } as unknown as UserWithMemberships;

      vi.spyOn(OrganizationRepository, 'getMembership').mockImplementation(
        async (userId) => {
          if (userId === mockUserId)
            return { role: MembershipRole.ORG_OWNER } as any;
          if (userId === 'invitee-123')
            return { role: MembershipRole.DEVELOPER } as any;
          return null;
        },
      );
      vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(mockInvitee);

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/invitations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'invitee@domain.com',
          role: 'DEVELOPER',
        });

      expect(res.status).toBe(409);
      expect(res.body.detail).toContain('already a member');
    });

    it('should block invitation if there is already a pending active invitation', async () => {
      const mockActiveInvitation = { id: 'inv-active' } as any;

      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_OWNER,
      } as any);
      vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(InvitationRepository, 'findActiveInvitation').mockResolvedValue(
        mockActiveInvitation,
      );

      const res = await request(app)
        .post(`/api/v1/organizations/${mockOrgId}/invitations`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'invitee@domain.com',
          role: 'DEVELOPER',
        });

      expect(res.status).toBe(409);
      expect(res.body.detail).toContain('active invitation already exists');
    });
  });

  describe('GET /organizations/:organizationId/invitations', () => {
    it('should list invitations for members', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.DEVELOPER,
      } as any);
      vi.spyOn(InvitationRepository, 'listForOrg').mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/v1/organizations/${mockOrgId}/invitations`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should deny list for non-members (tenant isolation)', async () => {
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/organizations/${mockOrgId}/invitations`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /organizations/:organizationId/invitations/:invitationId', () => {
    it("should allow ORG_OWNER to revoke others' invitations", async () => {
      const mockInvitation = {
        id: mockInvitationId,
        organizationId: mockOrgId,
        inviterId: 'other-user-id',
        status: InvitationStatus.PENDING,
      } as any;

      vi.spyOn(InvitationRepository, 'findById').mockResolvedValue(
        mockInvitation,
      );
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_OWNER,
      } as any);
      vi.spyOn(InvitationRepository, 'updateStatus').mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.REVOKED,
      });

      const res = await request(app)
        .delete(
          `/api/v1/organizations/${mockOrgId}/invitations/${mockInvitationId}`,
        )
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('REVOKED');
    });

    it("should reject ORG_ADMIN revoking others' invitations", async () => {
      const mockInvitation = {
        id: mockInvitationId,
        organizationId: mockOrgId,
        inviterId: 'other-user-id',
        status: InvitationStatus.PENDING,
      } as any;

      vi.spyOn(InvitationRepository, 'findById').mockResolvedValue(
        mockInvitation,
      );
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue({
        role: MembershipRole.ORG_ADMIN,
      } as any);

      const res = await request(app)
        .delete(
          `/api/v1/organizations/${mockOrgId}/invitations/${mockInvitationId}`,
        )
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /invitations/:token/accept', () => {
    it('should accept invitation, create membership, and update status', async () => {
      const mockInvitation = {
        id: mockInvitationId,
        organizationId: mockOrgId,
        email: 'operator@domain.com',
        role: MembershipRole.DEVELOPER,
        inviterId: 'inviter-user',
        expiresAt: new Date(Date.now() + 100000),
        status: InvitationStatus.PENDING,
      } as any;

      vi.spyOn(InvitationRepository, 'findByToken').mockResolvedValue(
        mockInvitation,
      );
      vi.spyOn(OrganizationRepository, 'getMembership').mockResolvedValue(null); // not yet a member
      vi.spyOn(OrganizationRepository, 'createMembership').mockResolvedValue(
        {} as any,
      );
      vi.spyOn(InvitationRepository, 'updateStatus').mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
      });

      const res = await request(app)
        .post(`/api/v1/invitations/${mockToken}/accept`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ACCEPTED');
      expect(OrganizationRepository.createMembership).toHaveBeenCalled();
    });

    it('should reject accepting invitation if expired', async () => {
      const mockInvitation = {
        id: mockInvitationId,
        organizationId: mockOrgId,
        email: 'operator@domain.com',
        expiresAt: new Date(Date.now() - 1000), // Expired
        status: InvitationStatus.PENDING,
      } as any;

      vi.spyOn(InvitationRepository, 'findByToken').mockResolvedValue(
        mockInvitation,
      );
      vi.spyOn(InvitationRepository, 'updateStatus').mockResolvedValue(
        mockInvitation,
      );

      const res = await request(app)
        .post(`/api/v1/invitations/${mockToken}/accept`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(409);
      expect(res.body.detail).toContain('expired');
    });

    it("should reject accepting invitation if recipient email doesn't match operator user", async () => {
      const mockInvitation = {
        id: mockInvitationId,
        organizationId: mockOrgId,
        email: 'mismatched-recipient@domain.com',
        expiresAt: new Date(Date.now() + 100000),
        status: InvitationStatus.PENDING,
      } as any;

      vi.spyOn(InvitationRepository, 'findByToken').mockResolvedValue(
        mockInvitation,
      );

      const res = await request(app)
        .post(`/api/v1/invitations/${mockToken}/accept`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
