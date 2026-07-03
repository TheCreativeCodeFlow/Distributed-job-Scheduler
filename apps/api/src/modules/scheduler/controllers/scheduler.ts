import { Request, Response, NextFunction } from 'express';
import { SchedulerService } from '../services/scheduler.js';
import { AuthenticationError } from '../../../errors/index.js';

export class SchedulerController {
  /**
   * POST /api/v1/scheduler/promote
   */
  public static async promote(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const batchSize = req.body?.batchSize ?? 50;
      const promotedCount = await SchedulerService.promote(batchSize);
      res.status(200).json({ status: 'ok', promotedCount });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/scheduler/status
   */
  public static async status(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const statusInfo = await SchedulerService.getStatus();
      res.status(200).json(statusInfo);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/scheduler/metrics
   */
  public static async metrics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const metricsInfo = await SchedulerService.getMetrics();
      res.status(200).json(metricsInfo);
    } catch (error) {
      next(error);
    }
  }
}
