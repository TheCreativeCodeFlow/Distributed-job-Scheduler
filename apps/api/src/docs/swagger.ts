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
    '/organizations/{organizationId}/projects': {
      post: {
        summary: 'Create Project',
        parameters: [
          {
            name: 'organizationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  metadata: { type: 'object' },
                  settings: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Project created successfully.' },
        },
      },
      get: {
        summary: 'List Projects',
        parameters: [
          {
            name: 'organizationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'List of projects.' },
        },
      },
    },
    '/projects/{projectId}': {
      get: {
        summary: 'Get Project',
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Project details.' },
        },
      },
      patch: {
        summary: 'Update Project',
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  metadata: { type: 'object' },
                  settings: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Project updated.' },
        },
      },
      delete: {
        summary: 'Archive Project',
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          204: { description: 'Project archived.' },
        },
      },
    },
    '/projects/{projectId}/restore': {
      post: {
        summary: 'Restore Project',
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Project restored.' },
        },
      },
    },
    '/projects/{projectId}/settings': {
      patch: {
        summary: 'Update Project Settings',
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['settings'],
                properties: {
                  settings: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Settings updated.' },
        },
      },
    },
    '/projects/{projectId}/queues': {
      post: {
        summary: 'Create Queue',
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug', 'retryPolicyId'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'integer', default: 0 },
                  maxConcurrency: { type: 'integer', default: 10 },
                  rateLimit: { type: 'integer' },
                  retryPolicyId: { type: 'string', format: 'uuid' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Queue created successfully.' },
        },
      },
      get: {
        summary: 'List Queues',
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'List of queues.' },
        },
      },
    },
    '/queues/{queueId}': {
      get: {
        summary: 'Get Queue',
        parameters: [
          {
            name: 'queueId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Queue details.' },
        },
      },
      patch: {
        summary: 'Update Queue',
        parameters: [
          {
            name: 'queueId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'integer' },
                  maxConcurrency: { type: 'integer' },
                  rateLimit: { type: 'integer' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Queue updated.' },
        },
      },
      delete: {
        summary: 'Archive Queue',
        parameters: [
          {
            name: 'queueId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          204: { description: 'Queue archived.' },
        },
      },
    },
    '/queues/{queueId}/restore': {
      post: {
        summary: 'Restore Queue',
        parameters: [
          {
            name: 'queueId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Queue restored.' },
        },
      },
    },
    '/queues/{queueId}/jobs': {
      post: {
        summary: 'Submit Job',
        parameters: [
          {
            name: 'queueId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['payload'],
                properties: {
                  payload: { type: 'object' },
                  priority: { type: 'integer', default: 1 },
                  metadata: { type: 'object' },
                  idempotencyKey: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Job submitted successfully.' },
        },
      },
      get: {
        summary: 'List Jobs',
        parameters: [
          {
            name: 'queueId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'List of jobs in the queue.' },
        },
      },
    },
    '/jobs/{jobId}': {
      get: {
        summary: 'Get Job',
        parameters: [
          {
            name: 'jobId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Job details.' },
        },
      },
    },
    '/jobs/{jobId}/cancel': {
      post: {
        summary: 'Cancel Job',
        parameters: [
          {
            name: 'jobId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Job cancelled.' },
        },
      },
    },
    '/jobs/{jobId}/status': {
      get: {
        summary: 'Get Job Status',
        parameters: [
          {
            name: 'jobId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Job status response.' },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
