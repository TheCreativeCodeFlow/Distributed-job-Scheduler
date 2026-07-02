import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organization.js';
import { OrganizationQueryService } from '../services/query.js';
import { AuthenticationError } from '../../../errors/index.js';

export class OrganizationController {
  /**
   * POST /organizations
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
      const result = await OrganizationService.create(req.user.id, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /organizations
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
      const result = await OrganizationQueryService.listForUser(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /organizations/:organizationId
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
      const result = await OrganizationQueryService.getById(
        req.user.id,
        req.params.organizationId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /organizations/:organizationId
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
      const result = await OrganizationService.update(
        req.user.id,
        req.params.organizationId!,
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /organizations/:organizationId
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
      await OrganizationService.softDelete(
        req.user.id,
        req.params.organizationId!,
      );
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}
