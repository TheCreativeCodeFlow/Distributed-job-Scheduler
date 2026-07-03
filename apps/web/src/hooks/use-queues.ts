import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  CreateQueueInput,
  Queue,
  QueueJob,
  QueueListParams,
  QueueListResult,
  QueueOperation,
  QueueOperationalMetrics,
} from '../types/queue';
import type { Project, ProjectOrganization } from '../types/project';

export const queueKeys = {
  all: ['queues'] as const,
  lists: () => [...queueKeys.all, 'list'] as const,
  list: (params: QueueListParams) => [...queueKeys.lists(), params] as const,
  detail: (id: string) => [...queueKeys.all, 'detail', id] as const,
  status: (id: string) => [...queueKeys.detail(id), 'status'] as const,
  jobs: (id: string) => [...queueKeys.detail(id), 'jobs'] as const,
};

export function useQueues(params: QueueListParams = {}) {
  return useQuery<QueueListResult>({
    queryKey: queueKeys.list(params),
    queryFn: async () => {
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
      const selected = params.projectId
        ? projects.filter((project) => project.id === params.projectId)
        : projects;
      const queueGroups = await Promise.all(
        selected.map(async (project) => {
          const queues = (await apiClient.get(`/projects/${project.id}/queues`))
            .data as Queue[];
          return queues.map((queue) => ({
            ...queue,
            project,
            organization: project.organization,
          }));
        }),
      );
      const search = params.search?.trim().toLowerCase();
      const filtered = queueGroups.flat().filter((queue) => {
        const matchesSearch =
          !search ||
          queue.name.toLowerCase().includes(search) ||
          queue.slug.toLowerCase().includes(search) ||
          queue.project?.name.toLowerCase().includes(search) ||
          queue.organization?.name.toLowerCase().includes(search);
        return (
          matchesSearch &&
          (!params.status ||
            params.status === 'ALL' ||
            queue.status === params.status)
        );
      });
      const sortBy = params.sortBy ?? 'updatedAt';
      const direction = params.sortOrder === 'asc' ? 1 : -1;
      filtered.sort((left, right) => {
        const values = {
          name: [left.name, right.name],
          project: [left.project?.name ?? '', right.project?.name ?? ''],
          status: [left.status, right.status],
          priority: [left.priority, right.priority],
          waitingJobs: [left.waitingJobs ?? 0, right.waitingJobs ?? 0],
          updatedAt: [left.updatedAt, right.updatedAt],
        }[sortBy] as [string | number, string | number];
        const result =
          typeof values[0] === 'string'
            ? String(values[0]).localeCompare(String(values[1]))
            : Number(values[0]) - Number(values[1]);
        return result * direction;
      });
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

export function useQueue(queueId: string) {
  return useQuery<Queue>({
    queryKey: queueKeys.detail(queueId),
    queryFn: async () => (await apiClient.get(`/queues/${queueId}`)).data,
    enabled: Boolean(queueId),
  });
}

export function useQueueStatus(queueId: string) {
  return useQuery<{ status: Queue['status'] } & QueueOperationalMetrics>({
    queryKey: queueKeys.status(queueId),
    queryFn: async () =>
      (await apiClient.get(`/queues/${queueId}/status`)).data,
    enabled: Boolean(queueId),
  });
}

export function useQueueJobs(queueId: string) {
  return useQuery<QueueJob[]>({
    queryKey: queueKeys.jobs(queueId),
    queryFn: async () => (await apiClient.get(`/queues/${queueId}/jobs`)).data,
    enabled: Boolean(queueId),
  });
}

function useInvalidateQueue() {
  const client = useQueryClient();
  return async (queue?: Queue) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queueKeys.lists() }),
      client.invalidateQueries({ queryKey: ['projects'] }),
      client.invalidateQueries({ queryKey: ['metrics'] }),
      queue
        ? client.invalidateQueries({ queryKey: queueKeys.detail(queue.id) })
        : Promise.resolve(),
      queue
        ? client.invalidateQueries({ queryKey: queueKeys.status(queue.id) })
        : Promise.resolve(),
    ]);
  };
}

export function useCreateQueue() {
  const invalidate = useInvalidateQueue();
  return useMutation({
    mutationFn: async ({ projectId, ...body }: CreateQueueInput) =>
      (await apiClient.post(`/projects/${projectId}/queues`, body))
        .data as Queue,
    onSuccess: (queue) => invalidate(queue),
  });
}

export function useUpdateQueue() {
  const invalidate = useInvalidateQueue();
  return useMutation({
    mutationFn: async ({
      queueId,
      updates,
    }: {
      queueId: string;
      updates: Partial<
        Pick<
          Queue,
          | 'name'
          | 'description'
          | 'priority'
          | 'maxConcurrency'
          | 'rateLimit'
          | 'metadata'
        >
      >;
    }) => (await apiClient.patch(`/queues/${queueId}`, updates)).data as Queue,
    onSuccess: (queue) => invalidate(queue),
  });
}

export function useQueueOperation() {
  const client = useQueryClient();
  const invalidate = useInvalidateQueue();
  return useMutation({
    mutationFn: async ({
      queue,
      operation,
    }: {
      queue: Queue;
      operation: QueueOperation;
    }) => {
      if (operation === 'archive') {
        await apiClient.delete(`/queues/${queue.id}`);
        return { ...queue, status: 'ARCHIVED', isArchived: true } as Queue;
      }
      return (await apiClient.post(`/queues/${queue.id}/${operation}`))
        .data as Queue;
    },
    onSuccess: async (updated) => {
      // Server-confirmed response is safe to publish immediately.
      client.setQueryData(queueKeys.detail(updated.id), updated);
      await invalidate(updated);
    },
  });
}
