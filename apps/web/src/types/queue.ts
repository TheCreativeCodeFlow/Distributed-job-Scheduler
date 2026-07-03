import type { Project, ProjectOrganization } from './project';

export type QueueStatus =
  'ACTIVE' | 'PAUSED' | 'DRAINING' | 'DISABLED' | 'ARCHIVED';

export interface QueueOperationalMetrics {
  waitingJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  activeWorkers: number;
}

export interface Queue extends Partial<QueueOperationalMetrics> {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  description: string | null;
  priority: number;
  rateLimit: number | null;
  status: QueueStatus;
  maxConcurrency: number;
  metadata: Record<string, unknown>;
  isActive: boolean;
  isArchived: boolean;
  retryPolicyId: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  organization?: ProjectOrganization;
}

export interface QueueListParams {
  search?: string;
  status?: QueueStatus | 'ALL';
  projectId?: string;
  page?: number;
  limit?: number;
  sortBy?:
    'name' | 'project' | 'status' | 'priority' | 'waitingJobs' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface QueueListResult {
  items: Queue[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueueJob {
  id: string;
  status: string;
  workerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQueueInput {
  projectId: string;
  name: string;
  slug: string;
  description?: string;
  priority: number;
  maxConcurrency: number;
  rateLimit?: number;
  retryPolicyId: string;
  metadata: Record<string, unknown>;
}

export type QueueOperation =
  'archive' | 'restore' | 'pause' | 'resume' | 'drain' | 'enable' | 'disable';
