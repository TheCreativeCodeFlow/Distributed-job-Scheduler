import { Router } from 'express';
import { WorkerController } from '../controllers/worker.js';
import {
  registerWorkerSchema,
  getWorkerSchema,
  updateWorkerSchema,
  deregisterWorkerSchema,
  getWorkerStatusSchema,
  pollQueueSchema,
  getClaimsSchema,
  heartbeatSchema,
  getLeaseSchema,
  recoverWorkerSchema,
} from '../schemas/index.js';
import { validate } from '../../../middlewares/validator.js';
import { requireAuth } from '../../auth/middleware/auth.js';

const workersRouter = Router();

workersRouter.post(
  '/register',
  requireAuth,
  validate(registerWorkerSchema),
  WorkerController.register,
);

workersRouter.get('/', requireAuth, WorkerController.list);

workersRouter.get(
  '/:workerId',
  requireAuth,
  validate(getWorkerSchema),
  WorkerController.get,
);

workersRouter.patch(
  '/:workerId',
  requireAuth,
  validate(updateWorkerSchema),
  WorkerController.update,
);

workersRouter.delete(
  '/:workerId',
  requireAuth,
  validate(deregisterWorkerSchema),
  WorkerController.deregister,
);

workersRouter.get(
  '/:workerId/status',
  requireAuth,
  validate(getWorkerStatusSchema),
  WorkerController.status,
);

workersRouter.post(
  '/:workerId/poll',
  requireAuth,
  validate(pollQueueSchema),
  WorkerController.poll,
);

workersRouter.get(
  '/:workerId/claims',
  requireAuth,
  validate(getClaimsSchema),
  WorkerController.getClaims,
);

workersRouter.post(
  '/:workerId/heartbeat',
  requireAuth,
  validate(heartbeatSchema),
  WorkerController.heartbeat,
);

workersRouter.get(
  '/:workerId/heartbeat',
  requireAuth,
  validate(heartbeatSchema),
  WorkerController.getHeartbeat,
);

workersRouter.get(
  '/:workerId/lease',
  requireAuth,
  validate(getLeaseSchema),
  WorkerController.getLease,
);

workersRouter.post(
  '/:workerId/recover',
  requireAuth,
  validate(recoverWorkerSchema),
  WorkerController.recover,
);

export { workersRouter };
