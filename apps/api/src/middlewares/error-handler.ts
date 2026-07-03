import { Request, Response, NextFunction } from 'express';
import { BaseError, InternalServerError } from '../errors/index.js';
import { logger } from '../logger/index.js';

export const errorHandlerMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  const instance = req.originalUrl || req.url;

  if (err instanceof BaseError) {
    logger.warn(
      {
        requestId: req.id,
        correlationId: req.correlationId,
        statusCode: err.statusCode,
        title: err.title,
        detail: err.detail,
      },
      'Application Error',
    );
    return res.status(err.statusCode).json(err.toResponse(instance));
  }

  // Handle standard HTTP/Express errors (e.g. from body-parser, express.json)
  if (err && typeof err === 'object') {
    const errObject = err as Record<string, unknown>;
    if (
      typeof errObject.statusCode === 'number' ||
      typeof errObject.status === 'number'
    ) {
      const status = (errObject.statusCode || errObject.status) as number;
      if (status >= 400 && status < 500) {
        logger.warn(
          {
            requestId: req.id,
            correlationId: req.correlationId,
            statusCode: status,
            title: (errObject.type as string) || 'Request Error',
            detail:
              (errObject.message as string) ||
              'A request processing error occurred.',
          },
          'HTTP Middleware Error',
        );
        return res.status(status).json({
          type: `https://errors.scheduler.com/http-error-${status}`,
          title: (errObject.name as string) || 'HTTP Error',
          status,
          detail:
            (errObject.message as string) ||
            'A request processing error occurred.',
          instance,
        });
      }
    }
  }

  // Fallback for unhandled internal system errors
  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error(
    {
      requestId: req.id,
      correlationId: req.correlationId,
      error: errorObj.message,
      stack: errorObj.stack,
    },
    'Unhandled Internal System Exception',
  );

  const fallbackError = new InternalServerError(
    'An unexpected internal system error occurred.',
  );
  return res.status(500).json(fallbackError.toResponse(instance));
};
