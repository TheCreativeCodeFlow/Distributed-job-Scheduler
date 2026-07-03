import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { requestIdMiddleware } from './middlewares/request-id.js';
import { correlationIdMiddleware } from './middlewares/correlation-id.js';
import { requestLoggerMiddleware } from './middlewares/request-logger.js';
import { errorHandlerMiddleware } from './middlewares/error-handler.js';
import { payloadSanitizerMiddleware } from './middlewares/payload-sanitizer.js';
import { globalRateLimiter } from './middlewares/rate-limit.js';
import { apiRouter } from './routes/index.js';
import { healthRouter } from './health/index.js';
import { setupSwagger } from './docs/swagger.js';
import { NotFoundError } from './errors/index.js';
import { config } from './config/index.js';

const app = express();

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Swagger UI requires inline styles
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false, // Swagger UI compatibility
  }),
);

// ─── CORS: explicit allowlist ─────────────────────────────────────────────────
const allowedOrigins = config.corsOrigins ?? ['http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (e.g., curl, server-to-server) that send no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' is not allowed.`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Correlation-ID',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Correlation-ID',
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  }),
);

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── Body Parsing with size limits ───────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ─── Prototype Pollution Prevention ──────────────────────────────────────────
app.use(payloadSanitizerMiddleware);

// ─── Global Rate Limiter (200 req/min/IP) ────────────────────────────────────
app.use(globalRateLimiter);

// ─── Request Context ─────────────────────────────────────────────────────────
app.use(requestIdMiddleware);
app.use(correlationIdMiddleware);
app.use(requestLoggerMiddleware);

// ─── OpenAPI Documentation ────────────────────────────────────────────────────
setupSwagger(app);

// ─── Health ───────────────────────────────────────────────────────────────────
app.use('/', healthRouter);

// ─── Versioned APIs ───────────────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ─── 404 Fallback ─────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(
    new NotFoundError(
      `Resource not found for path: ${req.originalUrl || req.url}`,
    ),
  );
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandlerMiddleware);

export { app };
export default app;
