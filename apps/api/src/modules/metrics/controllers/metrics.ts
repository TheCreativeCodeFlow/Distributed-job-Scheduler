import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metrics.js';
import { AuthenticationError } from '../../../errors/index.js';

export class MetricsController {
  /**
   * GET /api/v1/metrics
   */
  public static async getPrometheus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await MetricsService.getPrometheusMetrics(req.user.id);
      res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/metrics/queues
   */
  public static async getQueues(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await MetricsService.getQueuesMetrics(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/metrics/workers
   */
  public static async getWorkers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await MetricsService.getWorkersMetrics();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/metrics/jobs
   */
  public static async getJobs(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await MetricsService.getJobsMetrics(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/metrics/retries
   */
  public static async getRetries(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await MetricsService.getRetriesMetrics(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/metrics/dlq
   */
  public static async getDlq(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await MetricsService.getDlqMetrics(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/metrics/scheduler
   */
  public static async getScheduler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await MetricsService.getSchedulerMetrics();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/metrics/system
   */
  public static async getSystem(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await MetricsService.getSystemMetrics();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
