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
