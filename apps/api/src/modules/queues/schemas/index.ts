import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createQueueSchema = {
  body: z.object({
    name: z
      .string()
      .min(1, 'Name must be at least 1 character long.')
      .max(100, 'Name must be less than 100 characters.'),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters long.')
      .max(64, 'Slug must be less than 64 characters.')
      .regex(
        slugRegex,
        'Slug must contain only lowercase alphanumeric characters and single hyphens, and cannot start or end with a hyphen.',
      )
      .transform((val) => val.toLowerCase().trim()),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters.')
      .optional(),
    priority: z
      .number()
      .int()
      .nonnegative('Priority must be non-negative.')
      .default(0),
    maxConcurrency: z
      .number()
      .int()
      .positive('Max concurrency must be positive.')
      .default(10),
    rateLimit: z
      .number()
      .int()
      .positive('Rate limit must be positive.')
      .optional(),
    retryPolicyId: z.string().uuid('Invalid retry policy ID format.'),
    metadata: z.record(z.unknown()).default({}),
  }),
  params: z.object({
    projectId: z.string().uuid('Invalid project ID format.'),
  }),
};

export const listQueuesSchema = {
  params: z.object({
    projectId: z.string().uuid('Invalid project ID format.'),
  }),
};

export const getQueueSchema = {
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const updateQueueSchema = {
  body: z.object({
    name: z
      .string()
      .min(1, 'Name must be at least 1 character long.')
      .max(100, 'Name must be less than 100 characters.')
      .optional(),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters.')
      .optional(),
    priority: z.number().int().nonnegative().optional(),
    maxConcurrency: z.number().int().positive().optional(),
    rateLimit: z.number().int().positive().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const archiveQueueSchema = {
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const restoreQueueSchema = {
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const pauseQueueSchema = {
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const resumeQueueSchema = {
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const drainQueueSchema = {
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const enableQueueSchema = {
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const disableQueueSchema = {
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const getQueueStatusSchema = {
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};
