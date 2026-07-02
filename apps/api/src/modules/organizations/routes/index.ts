import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationSchema,
  deleteOrganizationSchema,
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

export const organizationRouter = router;
export default organizationRouter;
