import { Router } from 'express';
import { JobController } from '../controllers/job.js';
import {
  submitJobSchema,
  listJobsSchema,
  getJobSchema,
  cancelJobSchema,
  getJobStatusSchema,
  scheduleJobSchema,
  listScheduledJobsSchema,
  getScheduledJobSchema,
  cancelScheduledJobSchema,
} from '../schemas/index.js';
import { validate } from '../../../middlewares/validator.js';
import { requireAuth } from '../../auth/middleware/auth.js';

// Root jobs router (e.g. /api/v1/jobs)
const jobsRouter = Router();

jobsRouter.get(
  '/:jobId',
  requireAuth,
  validate(getJobSchema),
  JobController.get,
);

jobsRouter.post(
  '/:jobId/cancel',
  requireAuth,
  validate(cancelJobSchema),
  JobController.cancel,
);

jobsRouter.get(
  '/:jobId/status',
  requireAuth,
  validate(getJobStatusSchema),
  JobController.status,
);

// Queue jobs sub-router (e.g. /api/v1/queues/:queueId/jobs)
const queuesJobsRouter = Router({ mergeParams: true });

queuesJobsRouter.post(
  '/',
  requireAuth,
  validate(submitJobSchema),
  JobController.submit,
);

queuesJobsRouter.get(
  '/',
  requireAuth,
  validate(listJobsSchema),
  JobController.list,
);

queuesJobsRouter.post(
  '/schedule',
  requireAuth,
  validate(scheduleJobSchema),
  JobController.schedule,
);

queuesJobsRouter.get(
  '/scheduled',
  requireAuth,
  validate(listScheduledJobsSchema),
  JobController.listScheduled,
);

// Root scheduled-jobs router (e.g. /api/v1/scheduled-jobs)
const scheduledJobsRouter = Router();

scheduledJobsRouter.get(
  '/:scheduledJobId',
  requireAuth,
  validate(getScheduledJobSchema),
  JobController.getScheduled,
);

scheduledJobsRouter.post(
  '/:scheduledJobId/cancel',
  requireAuth,
  validate(cancelScheduledJobSchema),
  JobController.cancelScheduled,
);

export { jobsRouter, queuesJobsRouter, scheduledJobsRouter };
