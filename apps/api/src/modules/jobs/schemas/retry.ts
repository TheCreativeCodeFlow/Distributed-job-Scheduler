import { z } from 'zod';

export const manualRetrySchema = {
  params: z.object({
    jobId: z.string().uuid('Invalid job ID format.'),
  }),
};

export const getRetryStatusSchema = {
  params: z.object({
    jobId: z.string().uuid('Invalid job ID format.'),
  }),
};
