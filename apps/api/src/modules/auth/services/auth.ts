import { UserRepository } from '../repositories/user.js';
import { PasswordService } from './password.js';
import { TokenService, JwtPayload } from './token.js';
import { TokenBlocklist } from './token-blocklist.js';
import { ConflictError, AuthenticationError } from '../../../errors/index.js';
import { logger } from '../../../logger/index.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthenticationService {
  /**
   * Registers a new user.
   */
  public static async register(data: {
    email: string;
    name?: string;
    password: string;
  }): Promise<{ user: { id: string; email: string; name: string | null } }> {
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      // Intentionally generic log — avoid logging the email to prevent PII leakage
      logger.warn('User registration failed - email already in use.');
      throw new ConflictError('Email address is already registered.');
    }

    const passwordHash = await PasswordService.hash(data.password);
    const user = await UserRepository.create({
      email: data.email,
      passwordHash,
      ...(data.name !== undefined ? { name: data.name } : {}),
    });

    logger.info({ userId: user.id }, 'User registered successfully.');
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Logins an existing user and returns token pair.
   */
  public static async login(data: {
    email: string;
    password: string;
  }): Promise<AuthTokens> {
    const user = await UserRepository.findByEmail(data.email);
    if (!user) {
      // Intentionally generic — no user enumeration via timing or message differences
      logger.warn('Login attempt failed - user not found.');
      throw new AuthenticationError('Invalid email or password.');
    }

    const isValid = await PasswordService.verify(
      data.password,
      user.passwordHash,
    );
    if (!isValid) {
      logger.warn(
        { userId: user.id },
        'Login attempt failed - invalid password.',
      );
      throw new AuthenticationError('Invalid email or password.');
    }

    // Primary role (default to DEVELOPER if memberships is empty)
    const primaryRole = user.memberships[0]?.role || 'DEVELOPER';

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: primaryRole,
    };

    const accessToken = TokenService.generateAccessToken(payload);
    const refreshToken = TokenService.generateRefreshToken(payload);

    logger.info({ userId: user.id }, 'User logged in successfully.');
    return { accessToken, refreshToken };
  }

  /**
   * Performs refresh token rotation with blocklist replay prevention.
   */
  public static async refresh(refreshToken: string): Promise<AuthTokens> {
    // 1. Verify token signature, expiry, issuer, audience
    const decoded = TokenService.verifyToken(refreshToken);

    // 2. Check if this refresh token has already been rotated (replay attack prevention)
    const isBlocked = await TokenBlocklist.isBlocked(decoded.jti);
    if (isBlocked) {
      logger.warn(
        { userId: decoded.sub, jti: decoded.jti },
        'Refresh token replay detected — blocklisted JTI presented.',
      );
      throw new AuthenticationError(
        'Refresh token has already been used. Please log in again.',
      );
    }

    // 3. Fetch user to ensure they still exist and get current role
    const user = await UserRepository.findById(decoded.sub);
    if (!user) {
      throw new AuthenticationError(
        'User associated with this token does not exist.',
      );
    }

    // 4. Blocklist the old refresh token JTI
    await TokenBlocklist.add(
      decoded.jti,
      TokenService.getRefreshTokenTtlSeconds(),
    );

    // 5. Generate new tokens
    const primaryRole = user.memberships[0]?.role || 'DEVELOPER';
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: primaryRole,
    };

    const newAccessToken = TokenService.generateAccessToken(payload);
    const newRefreshToken = TokenService.generateRefreshToken(payload);

    logger.info({ userId: user.id }, 'Refresh token rotated successfully.');
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
