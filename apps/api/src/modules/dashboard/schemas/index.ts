import { z } from 'zod';
import { JobStatus, ExecutionStatus } from '@prisma/client';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const jobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(JobStatus).optional(),
  queueId: z.string().uuid().optional(),
  workerId: z.string().uuid().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'priority', 'scheduledAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const executionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(ExecutionStatus).optional(),
  jobId: z.string().uuid().optional(),
  workerId: z.string().uuid().optional(),
});

export const timeRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
