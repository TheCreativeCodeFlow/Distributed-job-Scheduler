import { z } from 'zod';
import { WorkerStatus } from '@prisma/client';

export const registerWorkerSchema = {
  body: z.object({
    hostname: z.string().min(1, 'Hostname must not be empty.'),
    instanceId: z.string().min(1, 'Instance ID must not be empty.'),
    version: z.string().min(1, 'Version must not be empty.'),
    supportedQueues: z.array(z.string()).default([]),
    supportedTags: z.array(z.string()).default([]),
    maxConcurrency: z
      .number()
      .int()
      .positive('Maximum concurrency must be a positive integer.')
      .default(5),
    metadata: z.record(z.unknown()).default({}),
  }),
};

export const getWorkerSchema = {
  params: z.object({
    workerId: z.string().uuid('Invalid worker ID format.'),
  }),
};

export const updateWorkerSchema = {
  body: z.object({
    status: z.nativeEnum(WorkerStatus).optional(),
    supportedQueues: z.array(z.string()).optional(),
    supportedTags: z.array(z.string()).optional(),
    maxConcurrency: z
      .number()
      .int()
      .positive('Maximum concurrency must be a positive integer.')
      .optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  params: z.object({
    workerId: z.string().uuid('Invalid worker ID format.'),
  }),
};

export const deregisterWorkerSchema = {
  params: z.object({
    workerId: z.string().uuid('Invalid worker ID format.'),
  }),
};

export const getWorkerStatusSchema = {
  params: z.object({
    workerId: z.string().uuid('Invalid worker ID format.'),
  }),
};

export const pollQueueSchema = {
  params: z.object({
    workerId: z.string().uuid('Invalid worker ID format.'),
  }),
  body: z
    .object({
      supportedQueues: z.array(z.string()).optional(),
    })
    .optional(),
};

export const getClaimsSchema = {
  params: z.object({
    workerId: z.string().uuid('Invalid worker ID format.'),
  }),
};

export const claimJobSchema = {
  params: z.object({
    jobId: z.string().uuid('Invalid job ID format.'),
  }),
  query: z.object({
    workerId: z.string().uuid('Invalid worker ID format.'),
  }),
};

export const heartbeatSchema = {
  params: z.object({
    workerId: z.string().uuid('Invalid worker ID format.'),
  }),
  body: z
    .object({
      cpuUsage: z.number().min(0).max(100).optional(),
      memoryUsage: z.number().min(0).max(100).optional(),
      timestamp: z.string().datetime().optional(),
    })
    .optional(),
};

export const getLeaseSchema = {
  params: z.object({
    workerId: z.string().uuid('Invalid worker ID format.'),
  }),
};

export const recoverWorkerSchema = {
  params: z.object({
    workerId: z.string().uuid('Invalid worker ID format.'),
  }),
};
