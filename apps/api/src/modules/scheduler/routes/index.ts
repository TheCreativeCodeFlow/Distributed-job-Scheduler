import { Router } from 'express';
import { SchedulerController } from '../controllers/scheduler.js';
import { promoteSchema } from '../schemas/index.js';
import { validate } from '../../../middlewares/validator.js';
import { requireAuth } from '../../auth/middleware/auth.js';

const schedulerRouter = Router();

schedulerRouter.post(
  '/promote',
  requireAuth,
  validate(promoteSchema),
  SchedulerController.promote,
);

schedulerRouter.get('/status', requireAuth, SchedulerController.status);

schedulerRouter.get('/metrics', requireAuth, SchedulerController.metrics);

export { schedulerRouter };
