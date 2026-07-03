import { Request, Response, NextFunction } from 'express';
import { DlqService } from '../services/dlq.js';
import { AuthenticationError } from '../../../errors/index.js';
import { AuditLogger } from '../../audit/audit-logger.js';

export class DlqController {
  /**
   * GET /api/v1/dlq
   */
  public static async list(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await DlqService.list(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dlq/metrics
   */
  public static async getMetrics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await DlqService.getMetrics(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dlq/:entryId
   */
  public static async get(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await DlqService.get(req.user.id, req.params.entryId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/dlq/:entryId/replay
   */
  public static async replay(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await DlqService.replay(req.user.id, req.params.entryId!);

      AuditLogger.log({
        action: 'dlq.replayed',
        userId: req.user.id,
        resourceId: req.params.entryId!,
        resourceType: 'DeadLetterEntry',
        ip: req.ip,
        correlationId: req.correlationId,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/dlq/:entryId
   */
  public static async purge(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await DlqService.purge(req.user.id, req.params.entryId!);

      AuditLogger.log({
        action: 'dlq.purged',
        userId: req.user.id,
        resourceId: req.params.entryId!,
        resourceType: 'DeadLetterEntry',
        ip: req.ip,
        correlationId: req.correlationId,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
