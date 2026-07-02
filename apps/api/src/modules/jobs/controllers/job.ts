import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.js';
import { JobQueryService } from '../services/query.js';
import { AuthenticationError } from '../../../errors/index.js';

export class JobController {
  /**
   * POST /queues/:queueId/jobs
   */
  public static async submit(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await JobService.submit(
        req.user.id,
        req.params.queueId!,
        req.body,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /queues/:queueId/jobs
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
      const result = await JobQueryService.listForQueue(
        req.user.id,
        req.params.queueId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /jobs/:jobId
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
      const result = await JobQueryService.getJob(
        req.user.id,
        req.params.jobId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /jobs/:jobId/cancel
   */
  public static async cancel(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await JobService.cancel(req.user.id, req.params.jobId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /jobs/:jobId/status
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
      const job = await JobQueryService.getJob(req.user.id, req.params.jobId!);
      res.status(200).json({ status: job.status });
    } catch (error) {
      next(error);
    }
  }
}
