import { z } from 'zod';

export const submitJobSchema = {
  body: z.object({
    payload: z.record(z.unknown()).describe('Payload for job processing.'),
    priority: z
      .number()
      .int()
      .positive('Priority must be a positive integer.')
      .default(1),
    metadata: z.record(z.unknown()).default({}),
    idempotencyKey: z
      .string()
      .min(1, 'Idempotency key must not be empty.')
      .optional(),
  }),
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const listJobsSchema = {
  params: z.object({
    queueId: z.string().uuid('Invalid queue ID format.'),
  }),
};

export const getJobSchema = {
  params: z.object({
    jobId: z.string().uuid('Invalid job ID format.'),
  }),
};

export const cancelJobSchema = {
  params: z.object({
    jobId: z.string().uuid('Invalid job ID format.'),
  }),
};

export const getJobStatusSchema = {
  params: z.object({
    jobId: z.string().uuid('Invalid job ID format.'),
  }),
};
