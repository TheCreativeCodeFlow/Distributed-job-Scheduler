import { Router } from 'express';
import { healthRouter } from '../health/index.js';

const router = Router();

// Register v1 routes
router.use('/', healthRouter);

export const apiRouter = router;
