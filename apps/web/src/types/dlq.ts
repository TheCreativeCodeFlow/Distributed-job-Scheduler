import type { Job } from './job';

export type DlqStatus = 'ACTIVE' | 'REPLAYED';

export interface DeadLetterEntry {
  id: string;
  jobId: string;
  status: DlqStatus;
  failureReason: string;
  errorStack: string | null;
  quarantinedAt: string;
  job: Job;
}

export interface DlqMetrics {
  totalActive: number;
  totalReplayed: number;
}

export interface DlqListParams {
  search?: string;
  queueId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'quarantinedAt' | 'failureReason';
  sortOrder?: 'asc' | 'desc';
}

export interface DlqListResult {
  items: DeadLetterEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
