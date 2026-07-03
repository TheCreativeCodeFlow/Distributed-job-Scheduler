import type { Job } from './job';
import type { Queue } from './queue';

export type ExecutionStatus =
  'CLAIMED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Execution {
  id: string;
  jobId: string;
  workerId: string | null;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt: string | null;
  duration: number | null; // in ms
  exitCode: number | null;
  retryCount: number;
  error: string | null;
  result: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  job?: Job;
  queue?: Queue;
}

export interface ExecutionListParams {
  search?: string;
  status?: ExecutionStatus;
  workerId?: string;
  queueId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'startedAt' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface ExecutionListResult {
  items: Execution[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
