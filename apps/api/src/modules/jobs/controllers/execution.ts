import { Request, Response, NextFunction } from 'express';
import { JobExecutionService } from '../services/execution.js';
import { AuthenticationError } from '../../../errors/index.js';

export class JobExecutionController {
  /**
   * POST /jobs/:jobId/start
   */
  public static async start(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await JobExecutionService.startExecution(
        req.user.id,
        req.params.jobId!,
        req.body.workerId,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /jobs/:jobId/complete
   */
  public static async complete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await JobExecutionService.completeExecution(
        req.user.id,
        req.params.jobId!,
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /jobs/:jobId/fail
   */
  public static async fail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await JobExecutionService.failExecution(
        req.user.id,
        req.params.jobId!,
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /jobs/:jobId/execution
   */
  public static async getExecution(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await JobExecutionService.getExecution(
        req.user.id,
        req.params.jobId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
