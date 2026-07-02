import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Distributed Job Scheduler API',
    version: '1.0.0',
    description: 'API Documentation for the Distributed Job Scheduler Platform',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'v1 API Endpoint',
    },
  ],
  paths: {
    '/live': {
      get: {
        summary: 'Liveness Check',
        description: 'Returns UP if the server instance is running.',
        responses: {
          200: {
            description: 'System is live.',
          },
        },
      },
    },
    '/ready': {
      get: {
        summary: 'Readiness Check',
        description:
          'Returns READY if downstream database and cache connections are successful.',
        responses: {
          200: {
            description: 'System is ready to accept traffic.',
          },
          503: {
            description: 'Downstream service unavailable.',
          },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Health Metrics',
        description: 'Returns memory, latency, and uptime telemetry metrics.',
        responses: {
          200: {
            description: 'Detailed system health reports.',
          },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
