import { BaseError } from './base.js';

export class ValidationError extends BaseError {
  public readonly statusCode = 400;
  public readonly title = 'Validation Error';
  public readonly invalidParams?:
    Array<{ name: string; reason: string }> | undefined;

  constructor(
    detail: string,
    invalidParams?: Array<{ name: string; reason: string }> | undefined,
    instance?: string | undefined,
  ) {
    super(detail, 'https://errors.scheduler.com/validation-error', instance);
    this.invalidParams = invalidParams;
  }

  public override toResponse(instancePath?: string) {
    const base = super.toResponse(instancePath);
    if (this.invalidParams !== undefined) {
      base.invalidParams = this.invalidParams;
    } else {
      base.invalidParams = [];
    }
    return base;
  }
}

export class AuthenticationError extends BaseError {
  public readonly statusCode = 401;
  public readonly title = 'Unauthorized';

  constructor(
    detail = 'Authentication is required.',
    instance?: string | undefined,
  ) {
    super(detail, 'https://errors.scheduler.com/unauthorized', instance);
  }
}

export class AuthorizationError extends BaseError {
  public readonly statusCode = 403;
  public readonly title = 'Forbidden';

  constructor(detail = 'Access denied.', instance?: string | undefined) {
    super(detail, 'https://errors.scheduler.com/forbidden', instance);
  }
}

export class NotFoundError extends BaseError {
  public readonly statusCode = 404;
  public readonly title = 'Not Found';

  constructor(detail = 'Resource not found.', instance?: string | undefined) {
    super(detail, 'https://errors.scheduler.com/not-found', instance);
  }
}

export class ConflictError extends BaseError {
  public readonly statusCode = 409;
  public readonly title = 'Conflict';

  constructor(
    detail = 'Resource conflict detected.',
    instance?: string | undefined,
  ) {
    super(detail, 'https://errors.scheduler.com/conflict', instance);
  }
}

export class RateLimitError extends BaseError {
  public readonly statusCode = 429;
  public readonly title = 'Too Many Requests';

  constructor(detail = 'Rate limit exceeded.', instance?: string | undefined) {
    super(detail, 'https://errors.scheduler.com/rate-limit', instance);
  }
}

export class InternalServerError extends BaseError {
  public readonly statusCode = 500;
  public readonly title = 'Internal Server Error';

  constructor(
    detail = 'An unexpected error occurred.',
    instance?: string | undefined,
  ) {
    super(detail, 'https://errors.scheduler.com/internal-error', instance);
  }
}

export { BaseError };
