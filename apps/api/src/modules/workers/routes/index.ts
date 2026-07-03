import { Router } from 'express';
import { WorkerController } from '../controllers/worker.js';
import {
  registerWorkerSchema,
  getWorkerSchema,
  updateWorkerSchema,
  deregisterWorkerSchema,
  getWorkerStatusSchema,
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

export { workersRouter };
