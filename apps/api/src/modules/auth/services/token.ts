import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../../../config/index.js';
import { AuthenticationError } from '../../../errors/index.js';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string; // Primary role
}

export interface JwtInternalPayload extends JwtPayload {
  jti: string; // JWT ID — used for blocklisting
  iss: string; // Issuer
  aud: string; // Audience
}

const ISSUER = 'distributed-job-scheduler';
const AUDIENCE = 'distributed-job-scheduler-api';
const ALGORITHM = 'HS256';

export class TokenService {
  private static readonly JWT_SECRET = config.jwt.secret;
  private static readonly ACCESS_TOKEN_TTL = '15m';
  private static readonly REFRESH_TOKEN_TTL = '7d';
  private static readonly REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 604800s

  /**
   * Generates a signed Access Token with jti, iss, aud claims.
   */
  public static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(
      { ...payload, jti: randomUUID(), iss: ISSUER, aud: AUDIENCE },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_TTL, algorithm: ALGORITHM },
    );
  }

  /**
   * Generates a signed Refresh Token with jti, iss, aud claims.
   */
  public static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(
      { ...payload, jti: randomUUID(), iss: ISSUER, aud: AUDIENCE },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_TTL, algorithm: ALGORITHM },
    );
  }

  /**
   * Returns the refresh token TTL in seconds (for blocklist expiry).
   */
  public static getRefreshTokenTtlSeconds(): number {
    return this.REFRESH_TOKEN_TTL_SECONDS;
  }

  /**
   * Verifies and decodes a signed JWT token.
   * Validates algorithm, issuer, audience, expiry, and payload structure.
   */
  public static verifyToken(token: string): JwtInternalPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
        audience: AUDIENCE,
      }) as jwt.JwtPayload;

      if (!decoded.sub || !decoded.email || !decoded.role || !decoded.jti) {
        throw new AuthenticationError('Invalid token payload structure.');
      }

      return {
        sub: decoded.sub,
        email: decoded.email as string,
        role: decoded.role as string,
        jti: decoded.jti as string,
        iss: decoded.iss as string,
        aud: decoded.aud as string,
      };
    } catch (error) {
      const err = error as Error;
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired.');
      }
      if (err instanceof AuthenticationError) {
        throw err;
      }
      throw new AuthenticationError('Invalid authentication token.');
    }
  }
}
