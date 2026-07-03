import type { Queue } from './queue';
import type { Project, ProjectOrganization } from './project';

export type JobStatus =
  | 'SCHEDULED'
  | 'QUEUED'
  | 'CLAIMED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'DEAD_LETTER'
  | 'RETRY_PENDING'
  | 'RETRY_EXHAUSTED';

export interface Job {
  id: string;
  queueId: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  priority: number;
  attempts: number;
  workerId: string | null;
  scheduledAt: string;
  idempotencyKey: string | null;
  metadata: Record<string, unknown>;
  submittedBy: string | null;
  createdAt: string;
  updatedAt: string;
  queue?: Queue;
  project?: Project;
  organization?: ProjectOrganization;
}

export interface JobExecution {
  id: string;
  jobId: string;
  workerId: string;
  status: 'RUNNING' | 'SUCCESS' | 'ERROR';
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  exitCode: number | null;
  result: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  worker?: {
    id: string;
    hostname: string;
  };
}

export interface JobListParams {
  search?: string;
  status?: JobStatus | 'ALL';
  queueId?: string;
  projectId?: string;
  workerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priority' | 'attempts' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface JobListResult {
  items: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubmitJobInput {
  queueId: string;
  payload: Record<string, unknown>;
  priority: number;
  metadata: Record<string, unknown>;
  idempotencyKey?: string;
}
