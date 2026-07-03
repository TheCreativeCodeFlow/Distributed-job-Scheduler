import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  Worker,
  WorkerListParams,
  WorkerListResult,
  RegisterWorkerInput,
  WorkerClaims,
  WorkerLease,
} from '../types/worker';

export const workerKeys = {
  all: ['workers'] as const,
  lists: () => [...workerKeys.all, 'list'] as const,
  list: (params: WorkerListParams) => [...workerKeys.lists(), params] as const,
  detail: (id: string) => [...workerKeys.all, 'detail', id] as const,
  claims: (id: string) => [...workerKeys.detail(id), 'claims'] as const,
  lease: (id: string) => [...workerKeys.detail(id), 'lease'] as const,
};

export function useWorkers(params: WorkerListParams = {}) {
  return useQuery<WorkerListResult>({
    queryKey: workerKeys.list(params),
    queryFn: async () => {
      // 1. Fetch all workers from backend
      const res = await apiClient.get('/workers');
      const allWorkers = res.data as Worker[];

      // 2. Perform client-side filter mapping
      let filtered = [...allWorkers];

      if (params.search) {
        const query = params.search.trim().toLowerCase();
        filtered = filtered.filter(
          (w) =>
            w.id.toLowerCase().includes(query) ||
            w.hostname.toLowerCase().includes(query) ||
            w.instanceId.toLowerCase().includes(query),
        );
      }

      if (params.status) {
        filtered = filtered.filter((w) => w.status === params.status);
      }

      if (params.queueId) {
        filtered = filtered.filter((w) =>
          w.supportedQueues.includes(params.queueId!),
        );
      }

      if (params.tag) {
        filtered = filtered.filter((w) =>
          w.supportedTags.includes(params.tag!),
        );
      }

      // 3. Sorting
      const sortBy = params.sortBy ?? 'hostname';
      const order = params.sortOrder === 'desc' ? -1 : 1;
      filtered.sort((a, b) => {
        let valA = a[sortBy] ?? '';
        let valB = b[sortBy] ?? '';
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * order;
        }
        return (valA > valB ? 1 : -1) * order;
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

export function useWorker(workerId: string) {
  return useQuery<Worker>({
    queryKey: workerKeys.detail(workerId),
    queryFn: async () => {
      const res = await apiClient.get(`/workers/${workerId}`);
      return res.data as Worker;
    },
    enabled: Boolean(workerId),
  });
}

export function useWorkerClaims(workerId: string) {
  return useQuery<WorkerClaims>({
    queryKey: workerKeys.claims(workerId),
    queryFn: async () => {
      const res = await apiClient.get(`/workers/${workerId}/claims`);
      return res.data as WorkerClaims;
    },
    enabled: Boolean(workerId),
  });
}

export function useWorkerLease(workerId: string) {
  return useQuery<WorkerLease>({
    queryKey: workerKeys.lease(workerId),
    queryFn: async () => {
      const res = await apiClient.get(`/workers/${workerId}/lease`);
      return res.data as WorkerLease;
    },
    enabled: Boolean(workerId),
  });
}

export function useRegisterWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterWorkerInput) => {
      const res = await apiClient.post('/workers/register', input);
      return res.data as Worker;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useDeregisterWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workerId: string) => {
      const res = await apiClient.delete(`/workers/${workerId}`);
      return res.data as Worker;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workerKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useRecoverWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workerId: string) => {
      const res = await apiClient.post(`/workers/${workerId}/recover`);
      return res.data as Worker;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workerKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useWorkerHeartbeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workerId: string) => {
      const res = await apiClient.post(`/workers/${workerId}/heartbeat`);
      return res.data as Worker;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.detail(data.id) });
    },
  });
}

export function useWorkerPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workerId: string) => {
      const res = await apiClient.post(`/workers/${workerId}/poll`);
      return res.data as { claimedJobsCount: number };
    },
    onSuccess: (_, workerId) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.detail(workerId) });
      queryClient.invalidateQueries({ queryKey: workerKeys.claims(workerId) });
    },
  });
}
