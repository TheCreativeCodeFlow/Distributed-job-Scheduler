import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.js';
import { ProjectQueryService } from '../services/query.js';
import { AuthenticationError } from '../../../errors/index.js';

export class ProjectController {
  /**
   * POST /organizations/:organizationId/projects
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
      const result = await ProjectService.create(
        req.user.id,
        req.params.organizationId!,
        req.body,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /organizations/:organizationId/projects
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
      const result = await ProjectQueryService.listForOrg(
        req.user.id,
        req.params.organizationId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /projects/:projectId
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
      const result = await ProjectQueryService.getProject(
        req.user.id,
        req.params.projectId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /projects/:projectId
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
      const result = await ProjectService.update(
        req.user.id,
        req.params.projectId!,
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /projects/:projectId
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
      await ProjectService.delete(req.user.id, req.params.projectId!);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /projects/:projectId/restore
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
      const result = await ProjectService.restore(
        req.user.id,
        req.params.projectId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /projects/:projectId/settings
   */
  public static async updateSettings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await ProjectService.update(
        req.user.id,
        req.params.projectId!,
        { settings: req.body.settings },
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
