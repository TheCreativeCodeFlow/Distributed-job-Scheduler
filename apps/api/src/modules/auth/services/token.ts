import jwt from 'jsonwebtoken';
import { config } from '../../../config/index.js';
import { AuthenticationError } from '../../../errors/index.js';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string; // Primary role
}

export class TokenService {
  private static readonly JWT_SECRET = config.jwt.secret;
  private static readonly ACCESS_TOKEN_TTL = '15m';
  private static readonly REFRESH_TOKEN_TTL = '7d';

  /**
   * Generates a signed Access Token.
   */
  public static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_TTL,
    });
  }

  /**
   * Generates a signed Refresh Token.
   */
  public static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_TTL,
    });
  }

  /**
   * Verifies and decodes a signed JWT token.
   */
  public static verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as jwt.JwtPayload;
      if (!decoded.sub || !decoded.email || !decoded.role) {
        throw new AuthenticationError('Invalid token payload structure.');
      }
      return {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      const err = error as Error;
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired.');
      }
      throw new AuthenticationError('Invalid authentication token.');
    }
  }
}
