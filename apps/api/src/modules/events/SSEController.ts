import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../auth/services/token.js';
import { AuthenticationError } from '../../errors/index.js';
import { EventBusService, type SSEEventPayload } from './EventBusService.js';
import { logger } from '../../logger/index.js';

/**
 * SSEController
 *
 * Handles GET /api/v1/events/stream
 *
 * Authentication: Bearer token passed as ?token=<accessToken> query param.
 * The native EventSource API cannot send custom headers, so we accept the
 * token as a query parameter and validate it via TokenService.
 *
 * Each connected client gets its own listener on the EventBusService.
 * On disconnect the listener is cleaned up immediately to prevent memory leaks.
 */
export class SSEController {
  public static async stream(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // ── 1. Authenticate via query token ──────────────────────────────────────
    const rawToken =
      (req.query.token as string | undefined) ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.substring(7)
        : undefined);

    if (!rawToken) {
      next(
        new AuthenticationError(
          'Authentication token is required for SSE stream.',
        ),
      );
      return;
    }

    let userId: string;
    let userEmail: string;
    try {
      const decoded = TokenService.verifyToken(rawToken);
      userId = decoded.sub;
      userEmail = decoded.email;
    } catch {
      next(new AuthenticationError('Invalid or expired authentication token.'));
      return;
    }

    // ── 2. Set SSE headers ────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.flushHeaders();

    logger.info({ userId, userEmail }, 'SSE client connected.');

    // ── 3. Send initial connection confirmation ───────────────────────────────
    const writeEvent = (type: string, data: unknown) => {
      try {
        res.write(`event: ${type}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (
          typeof (res as unknown as { flush?: () => void }).flush === 'function'
        ) {
          (res as unknown as { flush: () => void }).flush();
        }
      } catch {
        // Client already disconnected
      }
    };

    writeEvent('connected', {
      userId,
      timestamp: new Date().toISOString(),
      message: 'SSE connection established.',
    });

    // ── 4. Heartbeat ping every 25 seconds (prevents proxy timeout) ───────────
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
        if (
          typeof (res as unknown as { flush?: () => void }).flush === 'function'
        ) {
          (res as unknown as { flush: () => void }).flush();
        }
      } catch {
        clearInterval(heartbeatInterval);
      }
    }, 25_000);

    // ── 5. Subscribe to EventBusService and forward events ────────────────────
    const onEvent = (payload: SSEEventPayload) => {
      writeEvent(payload.type, payload);
    };

    EventBusService.on('sse:event', onEvent);

    // ── 6. Cleanup on client disconnect ───────────────────────────────────────
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      EventBusService.off('sse:event', onEvent);
      logger.info({ userId }, 'SSE client disconnected.');
    });

    req.on('error', () => {
      clearInterval(heartbeatInterval);
      EventBusService.off('sse:event', onEvent);
    });
  }
}
