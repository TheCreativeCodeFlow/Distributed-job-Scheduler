import { Router } from 'express';
import { SSEController } from '../SSEController.js';

const router = Router();

/**
 * GET /api/v1/events/stream
 *
 * Server-Sent Events stream endpoint. Authentication via ?token query param.
 * No rate limiting — long-lived connections don't fit the standard req/min model.
 */
router.get('/stream', SSEController.stream);

export const eventsRouter = router;
