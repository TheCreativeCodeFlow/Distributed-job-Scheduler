import type { Job } from './job';

export interface RetryMetrics {
  totalRetries: number;
  pendingRetries: number;
  exhaustedRetries: number;
  averageAttempts: number;
  successRate: number; // e.g. 85.5%
}

export interface JobRetryDetails {
  id: string;
  jobId: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  strategy: 'EXPONENTIAL' | 'LINEAR' | 'FIXED';
  backoffFactor: number;
  jitter: boolean;
  lastFailureReason: string | null;
  createdAt: string;
  updatedAt: string;
  attemptsHistory: Array<{
    attemptNumber: number;
    startedAt: string;
    finishedAt: string;
    error: string | null;
    exitCode: number | null;
  }>;
}

export interface RetryJobListParams {
  search?: string;
  queueId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'nextRetryAt' | 'retryCount';
  sortOrder?: 'asc' | 'desc';
}

export interface RetryJobListResult {
  items: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
