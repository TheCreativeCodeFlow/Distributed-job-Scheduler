import { Router } from 'express';
import { JobController } from '../controllers/job.js';
import { JobExecutionController } from '../controllers/execution.js';
import { WorkerController } from '../../workers/index.js';
import { claimJobSchema } from '../../workers/index.js';
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
  startExecutionSchema,
  completeExecutionSchema,
  failExecutionSchema,
  getExecutionSchema,
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

jobsRouter.get(
  '/:jobId/claim',
  requireAuth,
  validate(claimJobSchema),
  WorkerController.claimJob,
);

jobsRouter.post(
  '/:jobId/start',
  requireAuth,
  validate(startExecutionSchema),
  JobExecutionController.start,
);

jobsRouter.post(
  '/:jobId/complete',
  requireAuth,
  validate(completeExecutionSchema),
  JobExecutionController.complete,
);

jobsRouter.post(
  '/:jobId/fail',
  requireAuth,
  validate(failExecutionSchema),
  JobExecutionController.fail,
);

jobsRouter.get(
  '/:jobId/execution',
  requireAuth,
  validate(getExecutionSchema),
  JobExecutionController.getExecution,
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
