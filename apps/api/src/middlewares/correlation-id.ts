import { Request, Response, NextFunction } from 'express';

export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const correlationId =
    (req.headers['x-correlation-id'] as string) || req.id || '';
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
};
