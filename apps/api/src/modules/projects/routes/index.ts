import { Router } from 'express';
import { ProjectController } from '../controllers/project.js';
import {
  createProjectSchema,
  listProjectsSchema,
  getProjectSchema,
  updateProjectSchema,
  archiveProjectSchema,
  restoreProjectSchema,
  updateProjectSettingsSchema,
} from '../schemas/index.js';
import { validate } from '../../../middlewares/validator.js';
import { requireAuth } from '../../auth/middleware/auth.js';

// Root projects router (e.g. /api/v1/projects)
const projectsRouter = Router();

projectsRouter.get(
  '/:projectId',
  requireAuth,
  validate(getProjectSchema),
  ProjectController.get,
);

projectsRouter.patch(
  '/:projectId',
  requireAuth,
  validate(updateProjectSchema),
  ProjectController.update,
);

projectsRouter.delete(
  '/:projectId',
  requireAuth,
  validate(archiveProjectSchema),
  ProjectController.delete,
);

projectsRouter.post(
  '/:projectId/restore',
  requireAuth,
  validate(restoreProjectSchema),
  ProjectController.restore,
);

projectsRouter.patch(
  '/:projectId/settings',
  requireAuth,
  validate(updateProjectSettingsSchema),
  ProjectController.updateSettings,
);

// Organization projects sub-router (e.g. /api/v1/organizations/:organizationId/projects)
const orgProjectsRouter = Router({ mergeParams: true });

orgProjectsRouter.post(
  '/',
  requireAuth,
  validate(createProjectSchema),
  ProjectController.create,
);

orgProjectsRouter.get(
  '/',
  requireAuth,
  validate(listProjectsSchema),
  ProjectController.list,
);

export { projectsRouter, orgProjectsRouter };
