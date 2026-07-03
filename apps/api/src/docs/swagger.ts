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
    '/jobs/{jobId}/claim': {
      get: {
        summary: 'Atomic Direct Job Claim',
        parameters: [
          {
            name: 'jobId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'workerId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Job claimed successfully.' },
        },
      },
    },
    '/jobs/{jobId}/start': {
      post: {
        summary: 'Start Job Execution',
        parameters: [
          {
            name: 'jobId',
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
                required: ['workerId'],
                properties: {
                  workerId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Job execution started successfully.' },
        },
      },
    },
    '/jobs/{jobId}/complete': {
      post: {
        summary: 'Complete Job Execution',
        parameters: [
          {
            name: 'jobId',
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
                required: ['workerId'],
                properties: {
                  workerId: { type: 'string', format: 'uuid' },
                  result: { type: 'object' },
                  exitCode: { type: 'integer' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Job execution completed.' },
        },
      },
    },
    '/jobs/{jobId}/fail': {
      post: {
        summary: 'Fail Job Execution',
        parameters: [
          {
            name: 'jobId',
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
                required: ['workerId'],
                properties: {
                  workerId: { type: 'string', format: 'uuid' },
                  error: { type: 'object' },
                  exitCode: { type: 'integer' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Job execution failed.' },
        },
      },
    },
    '/jobs/{jobId}/execution': {
      get: {
        summary: 'Get Latest Job Execution Details',
        parameters: [
          {
            name: 'jobId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Execution metadata details.' },
        },
      },
    },
    '/queues/{queueId}/jobs/schedule': {
      post: {
        summary: 'Schedule Job',
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
                  executeAt: { type: 'string', format: 'date-time' },
                  delay: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Scheduled job created successfully.' },
        },
      },
    },
    '/queues/{queueId}/jobs/scheduled': {
      get: {
        summary: 'List Scheduled Jobs',
        parameters: [
          {
            name: 'queueId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'List of scheduled jobs.' },
        },
      },
    },
    '/scheduled-jobs/{scheduledJobId}': {
      get: {
        summary: 'Get Scheduled Job',
        parameters: [
          {
            name: 'scheduledJobId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Scheduled job details.' },
        },
      },
    },
    '/scheduled-jobs/{scheduledJobId}/cancel': {
      post: {
        summary: 'Cancel Scheduled Job',
        parameters: [
          {
            name: 'scheduledJobId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Scheduled job cancelled.' },
        },
      },
    },
    '/workers/register': {
      post: {
        summary: 'Register Worker',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['hostname', 'instanceId', 'version'],
                properties: {
                  hostname: { type: 'string' },
                  instanceId: { type: 'string' },
                  version: { type: 'string' },
                  supportedQueues: { type: 'array', items: { type: 'string' } },
                  supportedTags: { type: 'array', items: { type: 'string' } },
                  maxConcurrency: { type: 'integer', default: 5 },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Worker registered successfully.' },
        },
      },
    },
    '/workers': {
      get: {
        summary: 'List Workers',
        responses: {
          200: { description: 'List of registered workers.' },
        },
      },
    },
    '/workers/{workerId}': {
      get: {
        summary: 'Get Worker',
        parameters: [
          {
            name: 'workerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Worker details.' },
        },
      },
      patch: {
        summary: 'Update Worker Capabilities or Status',
        parameters: [
          {
            name: 'workerId',
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
                  status: { type: 'string' },
                  supportedQueues: { type: 'array', items: { type: 'string' } },
                  supportedTags: { type: 'array', items: { type: 'string' } },
                  maxConcurrency: { type: 'integer' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Worker updated successfully.' },
        },
      },
      delete: {
        summary: 'Deregister Worker',
        parameters: [
          {
            name: 'workerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Worker deregistered.' },
        },
      },
    },
    '/workers/{workerId}/status': {
      get: {
        summary: 'Get Worker Status',
        parameters: [
          {
            name: 'workerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Worker status response.' },
        },
      },
    },
    '/workers/{workerId}/poll': {
      post: {
        summary: 'Poll Queue and Claim Job',
        parameters: [
          {
            name: 'workerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  supportedQueues: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Job claimed.' },
          204: { description: 'No eligible jobs found.' },
        },
      },
    },
    '/workers/{workerId}/claims': {
      get: {
        summary: 'Get Worker Claims',
        parameters: [
          {
            name: 'workerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'List of active worker claims.' },
        },
      },
    },
    '/workers/{workerId}/heartbeat': {
      post: {
        summary: 'Post Worker Heartbeat',
        parameters: [
          {
            name: 'workerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  cpuUsage: { type: 'number' },
                  memoryUsage: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Heartbeat logged and leases renewed.' },
        },
      },
      get: {
        summary: 'Get Worker Last Heartbeat Details',
        parameters: [
          {
            name: 'workerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Heartbeat details returned.' },
        },
      },
    },
    '/workers/{workerId}/lease': {
      get: {
        summary: 'Get Worker Lease Details',
        parameters: [
          {
            name: 'workerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Active lease details.' },
          204: { description: 'No active lease found.' },
        },
      },
    },
    '/workers/{workerId}/recover': {
      post: {
        summary: 'Recover Worker',
        parameters: [
          {
            name: 'workerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Worker successfully recovered.' },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
