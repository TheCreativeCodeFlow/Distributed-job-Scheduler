import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  RetryMetrics,
  JobRetryDetails,
  RetryJobListParams,
  RetryJobListResult,
} from '../types/retry';
import type { Job } from '../types/job';
import type { Project, ProjectOrganization } from '../types/project';
import type { Queue } from '../types/queue';

export const retryKeys = {
  all: ['retries'] as const,
  metrics: () => [...retryKeys.all, 'metrics'] as const,
  lists: () => [...retryKeys.all, 'list'] as const,
  list: (params: RetryJobListParams) => [...retryKeys.lists(), params] as const,
  detail: (jobId: string) => [...retryKeys.all, 'detail', jobId] as const,
};

export function useRetryMetrics() {
  return useQuery<RetryMetrics>({
    queryKey: retryKeys.metrics(),
    queryFn: async () => {
      try {
        const res = await apiClient.get('/retries/metrics');
        return res.data as RetryMetrics;
      } catch {
        return {
          totalRetries: 0,
          pendingRetries: 0,
          exhaustedRetries: 0,
          averageAttempts: 0,
          successRate: 0,
        };
      }
    },
  });
}

export function useJobRetries(jobId: string) {
  return useQuery<JobRetryDetails>({
    queryKey: retryKeys.detail(jobId),
    queryFn: async () => {
      const res = await apiClient.get(`/jobs/${jobId}/retries`);
      return res.data as JobRetryDetails;
    },
    enabled: Boolean(jobId),
  });
}

export function useManualRetry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiClient.post(`/jobs/${jobId}/retry`);
      return res.data as Job;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: retryKeys.metrics() });
      queryClient.invalidateQueries({ queryKey: retryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: retryKeys.detail(job.id) });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', job.id] });
      queryClient.invalidateQueries({
        queryKey: ['queues', 'detail', job.queueId],
      });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useRetryJobs(params: RetryJobListParams = {}) {
  return useQuery<RetryJobListResult>({
    queryKey: retryKeys.list(params),
    queryFn: async () => {
      // 1. Fetch project-queue matrix to locate job endpoints
      const orgs = (await apiClient.get('/organizations'))
        .data as ProjectOrganization[];
      const projectGroups = await Promise.all(
        orgs.map(async (org) => {
          const projs = (
            await apiClient.get(`/organizations/${org.id}/projects`)
          ).data as Project[];
          return projs.map((p) => ({ ...p, organization: org }));
        }),
      );
      const projects = projectGroups.flat();

      const queueGroups = await Promise.all(
        projects.map(async (p) => {
          const qs = (await apiClient.get(`/projects/${p.id}/queues`))
            .data as Queue[];
          return qs.map((q) => ({
            ...q,
            project: p,
            organization: p.organization,
          }));
        }),
      );
      const queues = queueGroups.flat();

      const selectedQueues = params.queueId
        ? queues.filter((q) => q.id === params.queueId)
        : queues;

      // 2. Parallel fetch jobs under queues
      const jobGroups = await Promise.all(
        selectedQueues.map(async (queue) => {
          try {
            const jobs = (await apiClient.get(`/queues/${queue.id}/jobs`))
              .data as Job[];
            return jobs.map((job) => ({
              ...job,
              queue,
              project: queue.project,
              organization: queue.organization,
            }));
          } catch {
            return [];
          }
        }),
      );
      const allJobs = jobGroups.flat();

      // 3. Filter for retry jobs (attempts > 0 or status is RETRY_PENDING / RETRY_EXHAUSTED)
      let retryJobs = allJobs.filter(
        (job) =>
          job.attempts > 0 ||
          job.status === 'RETRY_PENDING' ||
          job.status === 'RETRY_EXHAUSTED',
      );

      // 4. Client side filtering
      if (params.search) {
        const query = params.search.trim().toLowerCase();
        retryJobs = retryJobs.filter(
          (job) =>
            job.id.toLowerCase().includes(query) ||
            job.queue?.name.toLowerCase().includes(query) ||
            job.project?.name.toLowerCase().includes(query),
        );
      }

      if (params.status && params.status !== 'ALL') {
        retryJobs = retryJobs.filter((job) => job.status === params.status);
      }

      // 5. Client side sorting
      const sortBy = params.sortBy ?? 'createdAt';
      const sortKey =
        sortBy === 'retryCount'
          ? 'attempts'
          : sortBy === 'nextRetryAt'
            ? 'scheduledAt'
            : sortBy;
      const order = params.sortOrder === 'desc' ? -1 : 1;
      retryJobs.sort((a, b) => {
        const valA = (a as any)[sortKey] ?? '';
        const valB = (b as any)[sortKey] ?? '';
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * order;
        }
        return (Number(valA) - Number(valB)) * order;
      });

      // 6. Pagination
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      const start = (page - 1) * limit;
      const items = retryJobs.slice(start, start + limit);

      return {
        items,
        total: retryJobs.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(retryJobs.length / limit)),
      };
    },
    placeholderData: (prev) => prev,
  });
}
