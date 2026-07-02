import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/index.js';

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();
  const reqLogger = logger.child({
    requestId: req.id,
    correlationId: req.correlationId,
  });

  reqLogger.info(
    { method: req.method, url: req.url, ip: req.ip },
    'Incoming Request',
  );

  res.on('finish', () => {
    const duration = Date.now() - start;
    reqLogger.info(
      {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
      },
      'Request Completed',
    );
  });

  next();
};
