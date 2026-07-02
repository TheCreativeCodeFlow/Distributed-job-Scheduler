import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.js';
import { MembershipController } from '../controllers/membership.js';
import { orgInvitationsRouter } from '../../invitations/index.js';
import { orgProjectsRouter } from '../../projects/index.js';
import { AdministrationController } from '../controllers/administration.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationSchema,
  deleteOrganizationSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  listMembersSchema,
  getMemberSchema,
  transferOwnershipSchema,
  updateSettingsSchema,
  getOrgActivitySchema,
  getOrgStatsSchema,
  suspendOrgSchema,
  reactivateOrgSchema,
} from '../schemas/index.js';
import { validate } from '../../../middlewares/validator.js';
import { requireAuth } from '../../auth/middleware/auth.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  validate(createOrganizationSchema),
  OrganizationController.create,
);
router.get('/', requireAuth, OrganizationController.list);
router.get(
  '/:organizationId',
  requireAuth,
  validate(getOrganizationSchema),
  OrganizationController.get,
);
router.patch(
  '/:organizationId',
  requireAuth,
  validate(updateOrganizationSchema),
  OrganizationController.update,
);
router.delete(
  '/:organizationId',
  requireAuth,
  validate(deleteOrganizationSchema),
  OrganizationController.delete,
);

// Membership routes
router.post(
  '/:organizationId/members',
  requireAuth,
  validate(addMemberSchema),
  MembershipController.add,
);
router.get(
  '/:organizationId/members',
  requireAuth,
  validate(listMembersSchema),
  MembershipController.list,
);
router.get(
  '/:organizationId/members/:memberId',
  requireAuth,
  validate(getMemberSchema),
  MembershipController.get,
);
router.patch(
  '/:organizationId/members/:memberId',
  requireAuth,
  validate(updateMemberRoleSchema),
  MembershipController.update,
);
router.delete(
  '/:organizationId/members/:memberId',
  requireAuth,
  validate(removeMemberSchema),
  MembershipController.delete,
);

router.use('/:organizationId/invitations', orgInvitationsRouter);

// Administrative routes
router.post(
  '/:organizationId/transfer-ownership',
  requireAuth,
  validate(transferOwnershipSchema),
  AdministrationController.transferOwnership,
);
router.get(
  '/:organizationId/activity',
  requireAuth,
  validate(getOrgActivitySchema),
  AdministrationController.getActivityLog,
);
router.get(
  '/:organizationId/statistics',
  requireAuth,
  validate(getOrgStatsSchema),
  AdministrationController.getStatistics,
);
router.patch(
  '/:organizationId/settings',
  requireAuth,
  validate(updateSettingsSchema),
  AdministrationController.updateSettings,
);
router.post(
  '/:organizationId/suspend',
  requireAuth,
  validate(suspendOrgSchema),
  AdministrationController.suspend,
);
router.post(
  '/:organizationId/reactivate',
  requireAuth,
  validate(reactivateOrgSchema),
  AdministrationController.reactivate,
);

router.use('/:organizationId/projects', orgProjectsRouter);

export const organizationRouter = router;
export default organizationRouter;
