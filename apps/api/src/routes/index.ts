import { Router } from 'express';
import { healthRouter } from '../health/index.js';
import { authRouter } from '../modules/auth/index.js';

const router = Router();

// Register v1 routes
router.use('/', healthRouter);
router.use('/auth', authRouter);

export const apiRouter = router;
