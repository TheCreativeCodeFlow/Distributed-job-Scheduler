/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { TokenService } from '../../auth/services/token.js';
import { db } from '../../../database/index.js';
import { RetryService } from '../services/retry.js';
import { JobStatus, DlqStatus, MembershipRole } from '@prisma/client';

describe('Dead Letter Queue Engine', () => {
  const mockUserId = 'user-id-123';
  const mockOrgId = 'org-id-777';
  const mockJobId = '55555555-5555-5555-5555-555555555555';
  const mockDlqId = '88888888-8888-8888-8888-888888888888';
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();

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

  describe('Automatic insertion on retry exhaustion', () => {
    it('should create DeadLetterEntry atomically when attempts exhaust', async () => {
      const mockJob = {
        id: mockJobId,
        queueId: 'queue-123',
        status: JobStatus.RUNNING,
        attempts: 2,
        queue: {
          retryPolicy: {
            maxAttempts: 3,
            backoffFactor: 2.0,
          },
        },
      } as any;

      vi.spyOn(db.job, 'findUnique').mockResolvedValue(mockJob);
      const updateJobSpy = vi
        .spyOn(db.job, 'update')
        .mockResolvedValue(mockJob);
      const createDlqSpy = vi
        .spyOn(db.deadLetterEntry, 'create')
        .mockResolvedValue({} as any);

      await RetryService.handleFailure(db, mockJobId);

      expect(updateJobSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockJobId },
          data: {
            status: JobStatus.RETRY_EXHAUSTED,
            attempts: 3,
          },
        }),
      );

      expect(createDlqSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            jobId: mockJobId,
            status: DlqStatus.ACTIVE,
            failureReason: 'Retry attempts exhausted.',
          },
        }),
      );
    });
  });

  describe('DLQ endpoints & RBAC', () => {
    const setupEntryMock = (
      userOrgId: string,
      role: MembershipRole,
      status: DlqStatus = DlqStatus.ACTIVE,
      entryOrgId = userOrgId,
    ) => {
      vi.spyOn(db.organizationMember, 'findMany').mockResolvedValue([
        { userId: mockUserId, organizationId: userOrgId, role } as any,
      ]);

      const mockEntry = {
        id: mockDlqId,
        jobId: mockJobId,
        status,
        failureReason: 'Testing',
        job: {
          queueId: 'queue-123',
          type: 'test-job',
          payload: { foo: 'bar' },
          metadata: {},
          priority: 'NORMAL',
          queue: {
            project: {
              organizationId: entryOrgId,
            },
          },
        },
      } as any;

      vi.spyOn(db.deadLetterEntry, 'findUnique').mockResolvedValue(mockEntry);
      return mockEntry;
    };

    it('should allow listing entries belonging to user organizations', async () => {
      vi.spyOn(db.organizationMember, 'findMany').mockResolvedValue([
        {
          userId: mockUserId,
          organizationId: mockOrgId,
          role: 'DEVELOPER',
        } as any,
      ]);

      const mockList = [
        {
          id: mockDlqId,
          jobId: mockJobId,
          status: DlqStatus.ACTIVE,
          job: {
            queue: {
              project: {
                organizationId: mockOrgId,
              },
            },
          },
        },
      ] as any[];

      vi.spyOn(db.deadLetterEntry, 'findMany').mockResolvedValue(mockList);

      const res = await request(app)
        .get('/api/v1/dlq')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(mockDlqId);
    });

    it('should allow fetching a specific entry details with valid membership', async () => {
      setupEntryMock(mockOrgId, 'DEVELOPER');

      const res = await request(app)
        .get(`/api/v1/dlq/${mockDlqId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mockDlqId);
    });

    it('should block detail fetch for non-members of the organization (tenant isolation)', async () => {
      // Setup mock where entry belongs to a different organization
      setupEntryMock(
        'my-allowed-org',
        'DEVELOPER',
        DlqStatus.ACTIVE,
        'some-other-org',
      );

      const res = await request(app)
        .get(`/api/v1/dlq/${mockDlqId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.detail).toContain('Access denied');
    });

    it('should block replay operations for READ_ONLY members', async () => {
      setupEntryMock(mockOrgId, 'READ_ONLY');

      const res = await request(app)
        .post(`/api/v1/dlq/${mockDlqId}/replay`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(403);
    });

    it('should allow replay for DEVELOPER role, create a new job and update DLQ entry status', async () => {
      setupEntryMock(mockOrgId, 'DEVELOPER');

      const createJobSpy = vi.spyOn(db.job, 'create').mockResolvedValue({
        id: 'new-job-uuid-123',
        status: JobStatus.QUEUED,
      } as any);

      const updateDlqSpy = vi
        .spyOn(db.deadLetterEntry, 'update')
        .mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/dlq/${mockDlqId}/replay`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(200);
      expect(createJobSpy).toHaveBeenCalled();
      expect(updateDlqSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockDlqId },
          data: { status: DlqStatus.REPLAYED },
        }),
      );
    });

    it('should block replay of already replayed entries', async () => {
      setupEntryMock(mockOrgId, 'DEVELOPER', DlqStatus.REPLAYED);

      const res = await request(app)
        .post(`/api/v1/dlq/${mockDlqId}/replay`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('already been replayed');
    });

    it('should allow DEVELOPER to purge a DLQ entry without deleting historical execution records', async () => {
      setupEntryMock(mockOrgId, 'DEVELOPER');

      const deleteDlqSpy = vi
        .spyOn(db.deadLetterEntry, 'delete')
        .mockResolvedValue({} as any);

      const res = await request(app)
        .delete(`/api/v1/dlq/${mockDlqId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(deleteDlqSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockDlqId },
        }),
      );
    });

    it('should block purge operations for READ_ONLY members', async () => {
      setupEntryMock(mockOrgId, 'READ_ONLY');

      const res = await request(app)
        .delete(`/api/v1/dlq/${mockDlqId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
