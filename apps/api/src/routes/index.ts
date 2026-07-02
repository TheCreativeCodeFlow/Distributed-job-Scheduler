import { Router } from 'express';
import { healthRouter } from '../health/index.js';
import { authRouter } from '../modules/auth/index.js';
import { organizationRouter } from '../modules/organizations/index.js';
import { invitationsRouter } from '../modules/invitations/index.js';
import { projectsRouter } from '../modules/projects/index.js';
import { queuesRouter } from '../modules/queues/index.js';
import { jobsRouter } from '../modules/jobs/index.js';

const router = Router();

// Register v1 routes
router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/organizations', organizationRouter);
router.use('/invitations', invitationsRouter);
router.use('/projects', projectsRouter);
router.use('/queues', queuesRouter);
router.use('/jobs', jobsRouter);

export const apiRouter = router;
