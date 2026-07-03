export type WorkerStatus =
  'REGISTERING' | 'IDLE' | 'RUNNING' | 'LOST' | 'RECOVERING' | 'OFFLINE';

export interface Worker {
  id: string;
  hostname: string;
  instanceId: string;
  version: string;
  status: WorkerStatus;
  maxConcurrency: number;
  activeClaimsCount: number;
  runningJobsCount: number;
  lastHeartbeat: string | null;
  supportedQueues: string[];
  supportedTags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerClaims {
  claims: Array<{
    jobId: string;
    queueId: string;
    claimedAt: string;
    expiresAt: string;
  }>;
}

export interface WorkerLease {
  leaseId: string;
  expiresAt: string;
  acquiredAt: string;
}

export interface RegisterWorkerInput {
  hostname: string;
  instanceId: string;
  version: string;
  maxConcurrency: number;
  supportedQueues: string[];
  supportedTags: string[];
  metadata?: Record<string, unknown>;
}

export interface WorkerListParams {
  search?: string;
  status?: WorkerStatus;
  queueId?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: 'hostname' | 'lastHeartbeat' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface WorkerListResult {
  items: Worker[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
