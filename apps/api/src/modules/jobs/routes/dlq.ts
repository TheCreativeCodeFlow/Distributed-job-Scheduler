import { Router } from 'express';
import { DlqController } from '../controllers/dlq.js';
import {
  getDlqEntrySchema,
  replayDlqEntrySchema,
  deleteDlqEntrySchema,
} from '../schemas/dlq.js';
import { validate } from '../../../middlewares/validator.js';
import { requireAuth } from '../../auth/middleware/auth.js';

const dlqRouter = Router();

dlqRouter.get('/', requireAuth, DlqController.list);

dlqRouter.get('/metrics', requireAuth, DlqController.getMetrics);

dlqRouter.get(
  '/:entryId',
  requireAuth,
  validate(getDlqEntrySchema),
  DlqController.get,
);

dlqRouter.post(
  '/:entryId/replay',
  requireAuth,
  validate(replayDlqEntrySchema),
  DlqController.replay,
);

dlqRouter.delete(
  '/:entryId',
  requireAuth,
  validate(deleteDlqEntrySchema),
  DlqController.purge,
);

export { dlqRouter };
