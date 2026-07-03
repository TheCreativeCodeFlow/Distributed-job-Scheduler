import { Request, Response, NextFunction } from 'express';
import { QueueService } from '../services/queue.js';
import { QueueQueryService } from '../services/query.js';
import { AuthenticationError } from '../../../errors/index.js';

export class QueueController {
  /**
   * POST /projects/:projectId/queues
   */
  public static async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await QueueService.create(
        req.user.id,
        req.params.projectId!,
        req.body,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /projects/:projectId/queues
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
      const result = await QueueQueryService.listForProject(
        req.user.id,
        req.params.projectId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /queues/:queueId
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
      const result = await QueueQueryService.getQueue(
        req.user.id,
        req.params.queueId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /queues/:queueId
   */
  public static async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await QueueService.update(
        req.user.id,
        req.params.queueId!,
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /queues/:queueId
   */
  public static async delete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      // DELETE is the public reversible archive operation.
      await QueueService.archive(req.user.id, req.params.queueId!);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /queues/:queueId/restore
   */
  public static async restore(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await QueueService.restore(
        req.user.id,
        req.params.queueId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /queues/:queueId/pause
   */
  public static async pause(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await QueueService.pause(req.user.id, req.params.queueId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /queues/:queueId/resume
   */
  public static async resume(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await QueueService.resume(
        req.user.id,
        req.params.queueId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /queues/:queueId/drain
   */
  public static async drain(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await QueueService.drain(req.user.id, req.params.queueId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /queues/:queueId/enable
   */
  public static async enable(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await QueueService.enable(
        req.user.id,
        req.params.queueId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /queues/:queueId/disable
   */
  public static async disable(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await QueueService.disable(
        req.user.id,
        req.params.queueId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /queues/:queueId/status
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
      const status = await QueueQueryService.getOperationalStatus(
        req.user.id,
        req.params.queueId!,
      );
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }
}
