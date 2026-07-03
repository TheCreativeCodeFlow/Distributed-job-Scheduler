import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter: 200 requests per minute per IP.
 * Applied to all API routes.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    title: 'Too Many Requests',
    detail: 'You have exceeded the request rate limit. Please try again later.',
  },
});

/**
 * Auth-specific rate limiter: 10 requests per 15 minutes per IP.
 * Applied to POST /auth/login and POST /auth/register.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    title: 'Too Many Requests',
    detail:
      'Too many authentication attempts from this IP. Please wait 15 minutes before retrying.',
  },
  skipSuccessfulRequests: false,
});
