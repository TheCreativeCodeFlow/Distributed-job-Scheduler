import { Router } from 'express';
import { QueueController } from '../controllers/queue.js';
import {
  createQueueSchema,
  listQueuesSchema,
  getQueueSchema,
  updateQueueSchema,
  archiveQueueSchema,
  restoreQueueSchema,
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
