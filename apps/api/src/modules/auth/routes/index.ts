import { Router } from 'express';
import { AuthController } from '../controllers/auth.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from '../schemas/index.js';
import { validate } from '../../../middlewares/validator.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../../../middlewares/rate-limit.js';

const router = Router();

// Auth-sensitive endpoints: tight rate limiter (10 req / 15 min / IP)
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  AuthController.register,
);
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  AuthController.login,
);
router.post(
  '/refresh',
  authRateLimiter,
  validate(refreshSchema),
  AuthController.refresh,
);

// Stateless logout — auth rate limiter not required but apply global
router.post('/logout', AuthController.logout);

// Protected: GET current user profile
router.get('/me', requireAuth, AuthController.me);

export const authRouter = router;
export default authRouter;
