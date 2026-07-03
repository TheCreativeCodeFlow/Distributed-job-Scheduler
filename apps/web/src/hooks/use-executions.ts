import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  Execution,
  ExecutionListParams,
  ExecutionListResult,
} from '../types/execution';
import type { Job } from '../types/job';
import type { Queue } from '../types/queue';

export const executionKeys = {
  all: ['executions'] as const,
  lists: () => [...executionKeys.all, 'list'] as const,
  list: (params: ExecutionListParams) =>
    [...executionKeys.lists(), params] as const,
  detail: (jobId: string) => [...executionKeys.all, 'detail', jobId] as const,
};

export function useExecutions(params: ExecutionListParams = {}) {
  return useQuery<ExecutionListResult>({
    queryKey: executionKeys.list(params),
    queryFn: async () => {
      // 1. Fetch dashboard executions from backend
      const res = await apiClient.get('/dashboard/executions');
      const allExecutions = res.data as Execution[];

      // 2. Perform client-side filter mapping
      let filtered = [...allExecutions];

      if (params.search) {
        const query = params.search.trim().toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.id.toLowerCase().includes(query) ||
            e.jobId.toLowerCase().includes(query) ||
            e.workerId?.toLowerCase().includes(query),
        );
      }

      if (params.status) {
        filtered = filtered.filter((e) => e.status === params.status);
      }

      if (params.workerId) {
        filtered = filtered.filter((e) => e.workerId === params.workerId);
      }

      if (params.queueId) {
        filtered = filtered.filter((e) => e.job?.queueId === params.queueId);
      }

      // 3. Sorting
      const sortBy = params.sortBy ?? 'startedAt';
      const order = params.sortOrder === 'desc' ? -1 : 1;
      filtered.sort((a, b) => {
        let valA = a[sortBy] ?? '';
        let valB = b[sortBy] ?? '';
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * order;
        }
        return (Number(valA) - Number(valB)) * order;
      });

      // 4. Pagination
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);

      return {
        items,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useJobExecution(jobId: string) {
  return useQuery<Execution | null>({
    queryKey: executionKeys.detail(jobId),
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/jobs/${jobId}/execution`);
        const execution = res.data as Execution;
        if (!execution) return null;

        // Fetch parent job to get queue structure
        const jobRes = await apiClient.get(`/jobs/${jobId}`);
        const job = jobRes.data as Job;

        const queueRes = await apiClient.get(`/queues/${job.queueId}`);
        const queue = queueRes.data as Queue;

        return {
          ...execution,
          job: {
            ...job,
            queue,
          },
          queue,
        };
      } catch {
        return null;
      }
    },
    enabled: Boolean(jobId),
  });
}
