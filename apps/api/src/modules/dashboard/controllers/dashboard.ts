import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.js';
import { AuthenticationError } from '../../../errors/index.js';

export class DashboardController {
  private static checkAuth(req: Request) {
    if (!req.user) {
      throw new AuthenticationError('User is not authenticated.');
    }
    return {
      userId: req.user.id,
      isSystemAdmin: req.user.role === 'SYSTEM_ADMIN',
    };
  }

  /**
   * GET /dashboard/overview
   */
  public static async getOverview(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, isSystemAdmin } = DashboardController.checkAuth(req);
      const result = await DashboardService.getOverview(userId, isSystemAdmin);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/queues
   */
  public static async getQueues(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, isSystemAdmin } = DashboardController.checkAuth(req);
      const result = await DashboardService.getQueues(userId, isSystemAdmin);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/workers
   */
  public static async getWorkers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      DashboardController.checkAuth(req);
      const result = await DashboardService.getWorkers();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/jobs
   */
  public static async getJobs(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, isSystemAdmin } = DashboardController.checkAuth(req);
      const result = await DashboardService.getJobs(
        userId,
        isSystemAdmin,
        req.query as unknown as Parameters<typeof DashboardService.getJobs>[2],
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/executions
   */
  public static async getExecutions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, isSystemAdmin } = DashboardController.checkAuth(req);
      const result = await DashboardService.getExecutions(
        userId,
        isSystemAdmin,
        req.query as unknown as Parameters<
          typeof DashboardService.getExecutions
        >[2],
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/retries
   */
  public static async getRetries(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, isSystemAdmin } = DashboardController.checkAuth(req);
      const result = await DashboardService.getRetries(userId, isSystemAdmin);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/dlq
   */
  public static async getDlq(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, isSystemAdmin } = DashboardController.checkAuth(req);
      const result = await DashboardService.getDlq(userId, isSystemAdmin);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/scheduler
   */
  public static async getScheduler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      DashboardController.checkAuth(req);
      const result = await DashboardService.getScheduler();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/activity
   */
  public static async getActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, isSystemAdmin } = DashboardController.checkAuth(req);
      const result = await DashboardService.getActivity(userId, isSystemAdmin);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/timeline
   */
  public static async getTimeline(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, isSystemAdmin } = DashboardController.checkAuth(req);
      const result = await DashboardService.getTimeline(userId, isSystemAdmin);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/health
   */
  public static async getHealth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      DashboardController.checkAuth(req);
      const result = await DashboardService.getHealth();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
