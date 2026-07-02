import { Router } from 'express';
import { AuthController } from '../controllers/auth.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from '../schemas/index.js';
import { validate } from '../../../middlewares/validator.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);
router.get('/me', requireAuth, AuthController.me);

export const authRouter = router;
export default authRouter;
