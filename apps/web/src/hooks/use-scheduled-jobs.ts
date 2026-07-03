import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  ScheduledJob,
  ScheduledJobListParams,
  ScheduledJobListResult,
  CreateScheduledJobInput,
} from '../types/scheduled-job';
import type { Queue } from '../types/queue';
import type { Project, ProjectOrganization } from '../types/project';

export const scheduledJobKeys = {
  all: ['scheduled-jobs'] as const,
  lists: () => [...scheduledJobKeys.all, 'list'] as const,
  list: (params: ScheduledJobListParams) =>
    [...scheduledJobKeys.lists(), params] as const,
  detail: (id: string) => [...scheduledJobKeys.all, 'detail', id] as const,
};

export function useScheduledJobs(params: ScheduledJobListParams = {}) {
  return useQuery<ScheduledJobListResult>({
    queryKey: scheduledJobKeys.list(params),
    queryFn: async () => {
      // 1. Fetch organization project hierarchies
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

      const selectedProjects = params.projectId
        ? projects.filter((project) => project.id === params.projectId)
        : projects;

      // 2. Fetch queues under the selected projects
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

      const selectedQueues = params.queueId
        ? queues.filter((queue) => queue.id === params.queueId)
        : queues;

      // 3. Parallel fetch scheduled jobs for each selected queue
      const scheduledGroups = await Promise.all(
        selectedQueues.map(async (queue) => {
          try {
            const scheduled = (
              await apiClient.get(`/queues/${queue.id}/jobs/scheduled`)
            ).data as ScheduledJob[];
            return scheduled.map((sj) => ({
              ...sj,
              queue,
              project: queue.project,
              organization: queue.organization,
            }));
          } catch {
            return [];
          }
        }),
      );
      const allScheduled = scheduledGroups.flat();

      // 4. Client side search and parameter filters
      const search = params.search?.trim().toLowerCase();
      const filtered = allScheduled.filter((sj) => {
        const matchesSearch =
          !search ||
          sj.id.toLowerCase().includes(search) ||
          sj.jobId.toLowerCase().includes(search) ||
          sj.queue?.name.toLowerCase().includes(search) ||
          sj.project?.name.toLowerCase().includes(search);
        return matchesSearch;
      });

      // 5. Client side sorting
      const sortBy = params.sortBy ?? 'createdAt';
      const direction = params.sortOrder === 'asc' ? 1 : -1;
      filtered.sort((left, right) => {
        const values = {
          createdAt: [left.createdAt, right.createdAt],
          nextRunAt: [left.nextRunAt, right.nextRunAt],
        }[sortBy] as [string, string];

        return values[0].localeCompare(values[1]) * direction;
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

export function useScheduledJob(scheduledJobId: string) {
  return useQuery<ScheduledJob>({
    queryKey: scheduledJobKeys.detail(scheduledJobId),
    queryFn: async () => {
      const sj = (await apiClient.get(`/scheduled-jobs/${scheduledJobId}`))
        .data as ScheduledJob;
      try {
        const queue = (await apiClient.get(`/queues/${sj.queueId}`))
          .data as Queue;
        const project = (await apiClient.get(`/projects/${queue.projectId}`))
          .data as Project;
        return {
          ...sj,
          queue: {
            ...queue,
            project,
          },
          project,
        };
      } catch {
        return sj;
      }
    },
    enabled: Boolean(scheduledJobId),
  });
}

export function useCreateScheduledJob() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ queueId, ...body }: CreateScheduledJobInput) =>
      (await apiClient.post(`/queues/${queueId}/jobs/schedule`, body))
        .data as ScheduledJob,
    onSuccess: (sj) => {
      client.invalidateQueries({ queryKey: scheduledJobKeys.lists() });
      client.invalidateQueries({ queryKey: ['queues', 'detail', sj.queueId] });
      client.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useCancelScheduledJob() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (scheduledJobId: string) =>
      (await apiClient.post(`/scheduled-jobs/${scheduledJobId}/cancel`))
        .data as ScheduledJob,
    onSuccess: (sj) => {
      client.invalidateQueries({ queryKey: scheduledJobKeys.lists() });
      client.invalidateQueries({ queryKey: scheduledJobKeys.detail(sj.id) });
      client.invalidateQueries({ queryKey: ['queues', 'detail', sj.queueId] });
      client.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}
