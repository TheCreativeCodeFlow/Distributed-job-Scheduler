import { Request, Response, NextFunction } from 'express';
import { MembershipService } from '../services/membership.js';
import { MembershipQueryService } from '../services/membershipQuery.js';
import { AuthenticationError } from '../../../errors/index.js';

export class MembershipController {
  /**
   * POST /organizations/:organizationId/members
   */
  public static async add(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not authenticated.');
      }
      const result = await MembershipService.addMember(
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
   * GET /organizations/:organizationId/members
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
      const result = await MembershipQueryService.listMembers(
        req.user.id,
        req.params.organizationId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /organizations/:organizationId/members/:memberId
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
      const result = await MembershipQueryService.getMemberDetails(
        req.user.id,
        req.params.organizationId!,
        req.params.memberId!,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /organizations/:organizationId/members/:memberId
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
      const result = await MembershipService.updateRole(
        req.user.id,
        req.params.organizationId!,
        req.params.memberId!,
        req.body.role,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /organizations/:organizationId/members/:memberId
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
      await MembershipService.removeMember(
        req.user.id,
        req.params.organizationId!,
        req.params.memberId!,
      );
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}
