import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  Job,
  JobExecution,
  JobListParams,
  JobListResult,
  SubmitJobInput,
} from '../types/job';
import type { Queue } from '../types/queue';
import type { Project, ProjectOrganization } from '../types/project';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (params: JobListParams) => [...jobKeys.lists(), params] as const,
  detail: (id: string) => [...jobKeys.all, 'detail', id] as const,
  status: (id: string) => [...jobKeys.detail(id), 'status'] as const,
  executions: (id: string) => [...jobKeys.detail(id), 'executions'] as const,
};

export function useJobs(params: JobListParams = {}) {
  return useQuery<JobListResult>({
    queryKey: jobKeys.list(params),
    queryFn: async () => {
      // 1. Fetch organization hierarchies to locate projects/queues
      const organizations = (await apiClient.get('/organizations'))
        .data as ProjectOrganization[];
      const projectGroups = await Promise.all(
        organizations.map(async (organization) => {
          const projects = (
            await apiClient.get(`/organizations/${organization.id}/projects`)
          ).data as Project[];
          return projects.map((project) => ({ ...project, organization }));
        }),
      );
      const projects = projectGroups.flat();

      // Filter projects if projectId parameter is provided
      const selectedProjects = params.projectId
        ? projects.filter((project) => project.id === params.projectId)
        : projects;

      // 2. Fetch all queues under the selected projects
      const queueGroups = await Promise.all(
        selectedProjects.map(async (project) => {
          const queues = (await apiClient.get(`/projects/${project.id}/queues`))
            .data as Queue[];
          return queues.map((queue) => ({
            ...queue,
            project,
            organization: project.organization,
          }));
        }),
      );
      const queues = queueGroups.flat();

      // Filter queues if queueId parameter is provided
      const selectedQueues = params.queueId
        ? queues.filter((queue) => queue.id === params.queueId)
        : queues;

      // 3. Parallel fetch jobs for each selected queue
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

      // 4. Client side search and parameter filters
      const search = params.search?.trim().toLowerCase();
      const filtered = allJobs.filter((job) => {
        const matchesSearch =
          !search ||
          job.id.toLowerCase().includes(search) ||
          job.idempotencyKey?.toLowerCase().includes(search) ||
          job.queue?.name.toLowerCase().includes(search) ||
          job.project?.name.toLowerCase().includes(search);

        const matchesStatus =
          !params.status ||
          params.status === 'ALL' ||
          job.status === params.status;

        const matchesWorker =
          !params.workerId || job.workerId === params.workerId;

        return matchesSearch && matchesStatus && matchesWorker;
      });

      // 5. Client side sorting
      const sortBy = params.sortBy ?? 'createdAt';
      const direction = params.sortOrder === 'asc' ? 1 : -1;
      filtered.sort((left, right) => {
        const values = {
          createdAt: [left.createdAt, right.createdAt],
          priority: [left.priority, right.priority],
          attempts: [left.attempts, right.attempts],
          status: [left.status, right.status],
        }[sortBy] as [string | number, string | number];

        const result =
          typeof values[0] === 'string'
            ? String(values[0]).localeCompare(String(values[1]))
            : Number(values[0]) - Number(values[1]);
        return result * direction;
      });

      // 6. Pagination
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      return {
        items: filtered.slice((page - 1) * limit, page * limit),
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      };
    },
    placeholderData: (previous) => previous,
  });
}

export function useJob(jobId: string) {
  return useQuery<Job>({
    queryKey: jobKeys.detail(jobId),
    queryFn: async () => {
      const job = (await apiClient.get(`/jobs/${jobId}`)).data as Job;
      // Get related queue details to populate full workspace hierarchy
      try {
        const queue = (await apiClient.get(`/queues/${job.queueId}`))
          .data as Queue;
        const project = (await apiClient.get(`/projects/${queue.projectId}`))
          .data as Project;
        return {
          ...job,
          queue: {
            ...queue,
            project,
          },
          project,
        };
      } catch {
        return job;
      }
    },
    enabled: Boolean(jobId),
  });
}

export function useJobStatus(jobId: string) {
  return useQuery<{ status: Job['status'] }>({
    queryKey: jobKeys.status(jobId),
    queryFn: async () => (await apiClient.get(`/jobs/${jobId}/status`)).data,
    enabled: Boolean(jobId),
  });
}

export function useJobExecutions(jobId: string) {
  return useQuery<JobExecution[]>({
    queryKey: jobKeys.executions(jobId),
    queryFn: async () => {
      try {
        const execution = (await apiClient.get(`/jobs/${jobId}/execution`))
          .data as JobExecution;
        return execution ? [execution] : [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(jobId),
  });
}

export function useSubmitJob() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ queueId, ...body }: SubmitJobInput) =>
      (await apiClient.post(`/queues/${queueId}/jobs`, body)).data as Job,
    onSuccess: (job) => {
      client.invalidateQueries({ queryKey: jobKeys.lists() });
      client.invalidateQueries({ queryKey: ['queues', 'detail', job.queueId] });
      client.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useCancelJob() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) =>
      (await apiClient.post(`/jobs/${jobId}/cancel`)).data as Job,
    onSuccess: (job) => {
      client.invalidateQueries({ queryKey: jobKeys.lists() });
      client.invalidateQueries({ queryKey: jobKeys.detail(job.id) });
      client.invalidateQueries({ queryKey: jobKeys.status(job.id) });
      client.invalidateQueries({ queryKey: ['queues', 'detail', job.queueId] });
      client.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}
