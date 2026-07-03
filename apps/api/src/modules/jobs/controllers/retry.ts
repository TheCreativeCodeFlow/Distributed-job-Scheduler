import { Request, Response, NextFunction } from 'express';
import { RetryService } from '../services/retry.js';
import { AuthenticationError } from '../../../errors/index.js';

export class RetryController {
  /**
   * POST /api/v1/jobs/:jobId/retry
   */
  public static async retry(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await RetryService.manualRetry(req.params.jobId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/jobs/:jobId/retries
   */
  public static async getRetryStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await RetryService.getRetryStatus(req.params.jobId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/retries/metrics
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
      const result = await RetryService.getMetrics();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
