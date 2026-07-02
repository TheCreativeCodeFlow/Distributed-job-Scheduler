import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.js';
import { AuthenticationError } from '../../../errors/index.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Fallback to parsing cookies if present (optional but recommended for secure cookies)
  if (!token && req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(';').map((c) => c.trim().split('=')),
    );
    token = cookies['access_token'];
  }

  if (!token) {
    throw new AuthenticationError('Authentication token is missing.');
  }

  try {
    const decoded = TokenService.verifyToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};

// Augment Express Request type with authenticated user context
declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
