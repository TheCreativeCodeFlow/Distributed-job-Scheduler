import { Request, Response, NextFunction } from 'express';
import { InvitationService } from '../services/invitation.js';
import { InvitationQueryService } from '../services/query.js';
import { AuthenticationError } from '../../../errors/index.js';

export class InvitationController {
  /**
   * POST /organizations/:organizationId/invitations
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
      const result = await InvitationService.create(
        req.user.id,
        req.params.organizationId!,
        req.body.email,
        req.body.role,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /organizations/:organizationId/invitations
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
      const result = await InvitationQueryService.listForOrg(
        req.user.id,
        req.params.organizationId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /organizations/:organizationId/invitations/:invitationId
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
      const result = await InvitationQueryService.getInvitationDetails(
        req.user.id,
        req.params.organizationId!,
        req.params.invitationId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /organizations/:organizationId/invitations/:invitationId
   */
  public static async revoke(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await InvitationService.revoke(
        req.user.id,
        req.params.organizationId!,
        req.params.invitationId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /invitations/:token/accept
   */
  public static async accept(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await InvitationService.accept(
        req.params.token!,
        req.user.id,
        req.user.email,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /invitations/:token/decline
   */
  public static async decline(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await InvitationService.decline(
        req.params.token!,
        req.user.email,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
