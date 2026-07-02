import { Request, Response, NextFunction } from 'express';
import { AuthenticationService } from '../services/auth.js';
import { config } from '../../../config/index.js';
import { AuthenticationError } from '../../../errors/index.js';

const COOKIE_NAME = 'refresh_token';
const isProd = config.env === 'production';

export class AuthController {
  /**
   * POST /auth/register
   */
  public static async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await AuthenticationService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/login
   */
  public static async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tokens = await AuthenticationService.login(req.body);

      // Set Refresh Token as secure cookie
      res.cookie(COOKIE_NAME, tokens.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({ accessToken: tokens.accessToken });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   */
  public static async logout(
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction,
  ): Promise<void> {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
    });
    res.status(204).end();
  }

  /**
   * POST /auth/refresh
   */
  public static async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Extract from cookie first, fallback to request body
      let token = req.cookies?.[COOKIE_NAME] || req.body.refreshToken;

      // Manual extraction from cookies header if cookie parser middleware isn't present
      if (!token && req.headers.cookie) {
        const cookies = Object.fromEntries(
          req.headers.cookie.split(';').map((c) => c.trim().split('=')),
        );
        token = cookies[COOKIE_NAME];
      }

      if (!token) {
        throw new AuthenticationError('Refresh token is missing.');
      }

      const tokens = await AuthenticationService.refresh(token);

      // Rotate Refresh Token cookie
      res.cookie(COOKIE_NAME, tokens.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({ accessToken: tokens.accessToken });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me
   */
  public static async me(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('User is not logged in.');
      }
      res.status(200).json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }
}
