import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.js';
import { requireAuth } from '../../auth/middleware/auth.js';
import { requireRoles } from '../../auth/middleware/rbac.js';
import { validate } from '../../../middlewares/validator.js';
import { jobsQuerySchema, executionsQuerySchema } from '../schemas/index.js';

const router = Router();

// Apply auth globally to all dashboard paths
router.use(requireAuth);

// All valid roles can read dashboard stats (multitenancy checks are handled inside services)
router.use(
  requireRoles(
    'SYSTEM_ADMIN',
    'ORG_OWNER',
    'ORG_ADMIN',
    'DEVELOPER',
    'READ_ONLY',
  ),
);

router.get('/overview', DashboardController.getOverview);
router.get('/queues', DashboardController.getQueues);
router.get('/workers', DashboardController.getWorkers);

router.get(
  '/jobs',
  validate({ query: jobsQuerySchema }),
  DashboardController.getJobs,
);

router.get(
  '/executions',
  validate({ query: executionsQuerySchema }),
  DashboardController.getExecutions,
);

router.get('/retries', DashboardController.getRetries);
router.get('/dlq', DashboardController.getDlq);
router.get('/scheduler', DashboardController.getScheduler);
router.get('/activity', DashboardController.getActivity);
router.get('/timeline', DashboardController.getTimeline);
router.get('/health', DashboardController.getHealth);

export const dashboardRouter = router;
export default dashboardRouter;
