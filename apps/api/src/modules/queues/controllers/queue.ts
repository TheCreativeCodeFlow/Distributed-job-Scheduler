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
      await QueueService.delete(req.user.id, req.params.queueId!);
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
}
