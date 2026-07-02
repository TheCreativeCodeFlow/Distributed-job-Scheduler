import { Request, Response, NextFunction } from 'express';
import { AdministrationService } from '../services/administration.js';
import { AuthenticationError } from '../../../errors/index.js';

export class AdministrationController {
  /**
   * POST /organizations/:organizationId/transfer-ownership
   */
  public static async transferOwnership(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await AdministrationService.transferOwnership(
        req.user.id,
        req.params.organizationId!,
        req.body.targetUserId,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /organizations/:organizationId/settings
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
      const result = await AdministrationService.updateSettings(
        req.user.id,
        req.params.organizationId!,
        req.body.metadata,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /organizations/:organizationId/suspend
   */
  public static async suspend(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await AdministrationService.suspend(
        req.user.id,
        req.params.organizationId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /organizations/:organizationId/reactivate
   */
  public static async reactivate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await AdministrationService.reactivate(
        req.user.id,
        req.params.organizationId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /organizations/:organizationId/activity
   */
  public static async getActivityLog(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await AdministrationService.getActivityLog(
        req.user.id,
        req.params.organizationId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /organizations/:organizationId/statistics
   */
  public static async getStatistics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await AdministrationService.getStatistics(
        req.user.id,
        req.params.organizationId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
