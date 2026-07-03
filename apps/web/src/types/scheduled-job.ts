import type { Job } from './job';
import type { Queue } from './queue';
import type { Project, ProjectOrganization } from './project';

export interface ScheduledJob {
  id: string;
  jobId: string;
  queueId: string;
  cronExpression: string | null;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
  job?: Job;
  queue?: Queue;
  project?: Project;
  organization?: ProjectOrganization;
}

export interface ScheduledJobListParams {
  search?: string;
  queueId?: string;
  projectId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'nextRunAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ScheduledJobListResult {
  items: ScheduledJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateScheduledJobInput {
  queueId: string;
  payload: Record<string, unknown>;
  priority: number;
  metadata: Record<string, unknown>;
  idempotencyKey?: string;
  executeAt?: string; // ISO DateTime
  delay?: number; // duration in ms or s
}
