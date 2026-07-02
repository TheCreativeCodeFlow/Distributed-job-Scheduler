import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { requestIdMiddleware } from './middlewares/request-id.js';
import { correlationIdMiddleware } from './middlewares/correlation-id.js';
import { requestLoggerMiddleware } from './middlewares/request-logger.js';
import { errorHandlerMiddleware } from './middlewares/error-handler.js';
import { apiRouter } from './routes/index.js';
import { healthRouter } from './health/index.js';
import { setupSwagger } from './docs/swagger.js';
import { NotFoundError } from './errors/index.js';

const app = express();

// Standard Security & Performance Enhancers
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Identifiers and Loggers context
app.use(requestIdMiddleware);
app.use(correlationIdMiddleware);
app.use(requestLoggerMiddleware);

// OpenAPI Documentation route
setupSwagger(app);

// Root level health endpoints mapping
app.use('/', healthRouter);

// Versioned APIs
app.use('/api/v1', apiRouter);

// Fallback 404 handler
app.use((req, res, next) => {
  next(
    new NotFoundError(
      `Resource not found for path: ${req.originalUrl || req.url}`,
    ),
  );
});

// Global central error handler middleware
app.use(errorHandlerMiddleware);

export { app };
export default app;
