import { Router } from 'express';
import { MetricsController } from '../controllers/metrics.js';
import { requireAuth } from '../../auth/middleware/auth.js';

const metricsRouter = Router();

metricsRouter.get('/', requireAuth, MetricsController.getPrometheus);
metricsRouter.get('/queues', requireAuth, MetricsController.getQueues);
metricsRouter.get('/workers', requireAuth, MetricsController.getWorkers);
metricsRouter.get('/jobs', requireAuth, MetricsController.getJobs);
metricsRouter.get('/retries', requireAuth, MetricsController.getRetries);
metricsRouter.get('/dlq', requireAuth, MetricsController.getDlq);
metricsRouter.get('/scheduler', requireAuth, MetricsController.getScheduler);
metricsRouter.get('/system', requireAuth, MetricsController.getSystem);

export { metricsRouter };
