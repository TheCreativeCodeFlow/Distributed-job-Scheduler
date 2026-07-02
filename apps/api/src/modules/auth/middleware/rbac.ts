import { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from '../../../errors/index.js';

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AuthorizationError('Access denied. User is not authenticated.'),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          `Access denied. Required role: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
        ),
      );
    }

    next();
  };
};
