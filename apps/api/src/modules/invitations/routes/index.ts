import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.js';
import {
  createInvitationSchema,
  listInvitationsSchema,
  getInvitationSchema,
  revokeInvitationSchema,
  acceptInvitationSchema,
  declineInvitationSchema,
} from '../schemas/index.js';
import { validate } from '../../../middlewares/validator.js';
import { requireAuth } from '../../auth/middleware/auth.js';

// Root invitations router (e.g. /api/v1/invitations)
const invitationsRouter = Router();

invitationsRouter.post(
  '/:token/accept',
  requireAuth,
  validate(acceptInvitationSchema),
  InvitationController.accept,
);

invitationsRouter.post(
  '/:token/decline',
  requireAuth,
  validate(declineInvitationSchema),
  InvitationController.decline,
);

// Organization invitations router (mounted as sub-router /organizations/:organizationId/invitations)
const orgInvitationsRouter = Router({ mergeParams: true });

orgInvitationsRouter.post(
  '/',
  requireAuth,
  validate(createInvitationSchema),
  InvitationController.create,
);

orgInvitationsRouter.get(
  '/',
  requireAuth,
  validate(listInvitationsSchema),
  InvitationController.list,
);

orgInvitationsRouter.get(
  '/:invitationId',
  requireAuth,
  validate(getInvitationSchema),
  InvitationController.get,
);

orgInvitationsRouter.delete(
  '/:invitationId',
  requireAuth,
  validate(revokeInvitationSchema),
  InvitationController.revoke,
);

export { invitationsRouter, orgInvitationsRouter };
