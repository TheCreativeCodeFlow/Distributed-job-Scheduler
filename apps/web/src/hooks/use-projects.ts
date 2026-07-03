import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  CreateProjectInput,
  Project,
  ProjectListParams,
  ProjectListResult,
  ProjectOrganization,
  ProjectQueue,
  UpdateProjectInput,
} from '../types/project';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectListParams) =>
    [...projectKeys.lists(), params] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  queues: (id: string) => [...projectKeys.detail(id), 'queues'] as const,
};

const compare = (left: string | number, right: string | number) =>
  typeof left === 'string' && typeof right === 'string'
    ? left.localeCompare(right)
    : Number(left) - Number(right);

export function useProjects(params: ProjectListParams = {}) {
  return useQuery<ProjectListResult>({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const organizationResponse = await apiClient.get('/organizations');
      const organizations = organizationResponse.data as ProjectOrganization[];
      const selected = params.organizationId
        ? organizations.filter(
            (organization) => organization.id === params.organizationId,
          )
        : organizations;

      // One request per organization is required by the backend's tenant-scoped API.
      // Requests are parallel and queue counts are not fetched here, avoiding project N+1.
      const responses = await Promise.all(
        selected.map(async (organization) => {
          const response = await apiClient.get(
            `/organizations/${organization.id}/projects`,
          );
          return (response.data as Project[]).map((project) => ({
            ...project,
            organization,
            queueCount:
              project.queueCount ??
              (project as Project & { _count?: { queues?: number } })._count
                ?.queues ??
              0,
          }));
        }),
      );

      const search = params.search?.trim().toLowerCase();
      const filtered = responses.flat().filter((project) => {
        const matchesSearch =
          !search ||
          project.name.toLowerCase().includes(search) ||
          project.slug.toLowerCase().includes(search) ||
          project.organization?.name.toLowerCase().includes(search);
        const matchesStatus =
          !params.status ||
          params.status === 'all' ||
          (params.status === 'archived' && project.isArchived) ||
          (params.status === 'active' &&
            project.isActive &&
            !project.isArchived) ||
          (params.status === 'inactive' && !project.isActive);
        return matchesSearch && matchesStatus;
      });

      const sortBy = params.sortBy ?? 'createdAt';
      const direction = params.sortOrder === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        const values: Record<string, [string | number, string | number]> = {
          name: [a.name, b.name],
          organization: [
            a.organization?.name ?? '',
            b.organization?.name ?? '',
          ],
          createdAt: [a.createdAt, b.createdAt],
          updatedAt: [a.updatedAt, b.updatedAt],
          queueCount: [a.queueCount ?? 0, b.queueCount ?? 0],
        };
        return compare(...values[sortBy]) * direction;
      });

      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      const total = filtered.length;
      return {
        items: filtered.slice((page - 1) * limit, page * limit),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    },
    placeholderData: (previous) => previous,
  });
}

export function useProject(projectId: string) {
  return useQuery<Project>({
    queryKey: projectKeys.detail(projectId),
    queryFn: async () => (await apiClient.get(`/projects/${projectId}`)).data,
    enabled: Boolean(projectId),
  });
}

export function useProjectQueues(projectId: string) {
  return useQuery<ProjectQueue[]>({
    queryKey: projectKeys.queues(projectId),
    queryFn: async () =>
      (await apiClient.get(`/projects/${projectId}/queues`)).data,
    enabled: Boolean(projectId),
  });
}

function useInvalidateProject() {
  const client = useQueryClient();
  return async (project?: Project) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: projectKeys.lists() }),
      project
        ? client.invalidateQueries({ queryKey: projectKeys.detail(project.id) })
        : Promise.resolve(),
    ]);
  };
}

export function useCreateProject() {
  const invalidate = useInvalidateProject();
  return useMutation({
    mutationFn: async ({ organizationId, ...body }: CreateProjectInput) =>
      (await apiClient.post(`/organizations/${organizationId}/projects`, body))
        .data as Project,
    onSuccess: (project) => invalidate(project),
  });
}

export function useUpdateProject() {
  const invalidate = useInvalidateProject();
  return useMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: UpdateProjectInput;
    }) =>
      (await apiClient.patch(`/projects/${projectId}`, updates))
        .data as Project,
    onSuccess: (project) => invalidate(project),
  });
}

export function useArchiveProject() {
  const invalidate = useInvalidateProject();
  return useMutation({
    mutationFn: async (project: Project) => {
      await apiClient.delete(`/projects/${project.id}`);
      return project;
    },
    onSuccess: (project) => invalidate(project),
  });
}

export function useRestoreProject() {
  const invalidate = useInvalidateProject();
  return useMutation({
    mutationFn: async (project: Project) =>
      (await apiClient.post(`/projects/${project.id}/restore`)).data as Project,
    onSuccess: (project) => invalidate(project),
  });
}

export function useUpdateProjectSettings() {
  const invalidate = useInvalidateProject();
  return useMutation({
    mutationFn: async ({
      projectId,
      settings,
    }: {
      projectId: string;
      settings: Record<string, unknown>;
    }) =>
      (
        await apiClient.patch(`/projects/${projectId}/settings`, {
          settings,
        })
      ).data as Project,
    onSuccess: (project) => invalidate(project),
  });
}
