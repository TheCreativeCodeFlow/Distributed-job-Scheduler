import { logger } from '../logger/index.js';

const MIN_JWT_SECRET_LENGTH = 32;
const REQUIRED_VARS = ['JWT_SECRET', 'DATABASE_URL'] as const;

/**
 * Validates that all required environment variables are present and meet
 * minimum security requirements. Terminates the process if validation fails.
 */
export function validateConfig(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    logger.fatal(
      { missing },
      `FATAL: Missing required environment variables: ${missing.join(', ')}. Server cannot start.`,
    );
    process.exit(1);
  }

  // Enforce minimum JWT secret strength
  const jwtSecret = process.env['JWT_SECRET']!;
  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    logger.fatal(
      { length: jwtSecret.length, required: MIN_JWT_SECRET_LENGTH },
      `FATAL: JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters. Server cannot start.`,
    );
    process.exit(1);
  }

  // Warn about default/insecure secrets
  const INSECURE_VALUES = new Set([
    'secret',
    'password',
    'changeme',
    'jwt_secret',
    'your-secret',
  ]);
  if (INSECURE_VALUES.has(jwtSecret.toLowerCase())) {
    logger.warn(
      'WARNING: JWT_SECRET appears to be a default or insecure value. Please rotate immediately.',
    );
  }

  logger.info('Environment configuration validated successfully.');
}
