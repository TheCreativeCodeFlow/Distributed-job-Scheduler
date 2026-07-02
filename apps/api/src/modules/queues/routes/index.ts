import { Router } from 'express';
import { QueueController } from '../controllers/queue.js';
import {
  createQueueSchema,
  listQueuesSchema,
  getQueueSchema,
  updateQueueSchema,
  archiveQueueSchema,
  restoreQueueSchema,
  pauseQueueSchema,
  resumeQueueSchema,
  drainQueueSchema,
  enableQueueSchema,
  disableQueueSchema,
  getQueueStatusSchema,
} from '../schemas/index.js';
import { validate } from '../../../middlewares/validator.js';
import { requireAuth } from '../../auth/middleware/auth.js';

// Root queues router (e.g. /api/v1/queues)
const queuesRouter = Router();

queuesRouter.get(
  '/:queueId',
  requireAuth,
  validate(getQueueSchema),
  QueueController.get,
);

queuesRouter.patch(
  '/:queueId',
  requireAuth,
  validate(updateQueueSchema),
  QueueController.update,
);

queuesRouter.delete(
  '/:queueId',
  requireAuth,
  validate(archiveQueueSchema),
  QueueController.delete,
);

queuesRouter.post(
  '/:queueId/restore',
  requireAuth,
  validate(restoreQueueSchema),
  QueueController.restore,
);

queuesRouter.post(
  '/:queueId/pause',
  requireAuth,
  validate(pauseQueueSchema),
  QueueController.pause,
);

queuesRouter.post(
  '/:queueId/resume',
  requireAuth,
  validate(resumeQueueSchema),
  QueueController.resume,
);

queuesRouter.post(
  '/:queueId/drain',
  requireAuth,
  validate(drainQueueSchema),
  QueueController.drain,
);

queuesRouter.post(
  '/:queueId/enable',
  requireAuth,
  validate(enableQueueSchema),
  QueueController.enable,
);

queuesRouter.post(
  '/:queueId/disable',
  requireAuth,
  validate(disableQueueSchema),
  QueueController.disable,
);

queuesRouter.get(
  '/:queueId/status',
  requireAuth,
  validate(getQueueStatusSchema),
  QueueController.status,
);

// Project queues sub-router (e.g. /api/v1/projects/:projectId/queues)
const projectQueuesRouter = Router({ mergeParams: true });

projectQueuesRouter.post(
  '/',
  requireAuth,
  validate(createQueueSchema),
  QueueController.create,
);

projectQueuesRouter.get(
  '/',
  requireAuth,
  validate(listQueuesSchema),
  QueueController.list,
);

export { queuesRouter, projectQueuesRouter };
