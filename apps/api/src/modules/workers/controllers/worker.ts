import { Request, Response, NextFunction } from 'express';
import { WorkerService } from '../services/worker.js';
import { AuthenticationError } from '../../../errors/index.js';

export class WorkerController {
  /**
   * POST /workers/register
   */
  public static async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await WorkerService.register(req.user.id, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /workers
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
      const result = await WorkerService.list();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /workers/:workerId
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
      const result = await WorkerService.get(req.user.id, req.params.workerId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /workers/:workerId
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
      const result = await WorkerService.update(
        req.user.id,
        req.params.workerId!,
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /workers/:workerId
   */
  public static async deregister(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await WorkerService.deregister(
        req.user.id,
        req.params.workerId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /workers/:workerId/status
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
      const worker = await WorkerService.get(req.user.id, req.params.workerId!);
      res.status(200).json({ status: worker.status });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /workers/:workerId/poll
   */
  public static async poll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await WorkerService.pollAndClaim(
        req.user.id,
        req.params.workerId!,
        req.body?.supportedQueues,
      );
      if (!result) {
        res.status(204).send();
      } else {
        res.status(200).json(result);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /workers/:workerId/claims
   */
  public static async getClaims(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await WorkerService.getClaims(
        req.user.id,
        req.params.workerId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /jobs/:jobId/claim
   */
  public static async claimJob(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const workerId = req.query.workerId;
      if (typeof workerId !== 'string') {
        throw new AuthenticationError(
          'Worker ID must be provided as a query string.',
        );
      }
      const result = await WorkerService.claimJobDirectly(
        req.user.id,
        req.params.jobId!,
        workerId,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
