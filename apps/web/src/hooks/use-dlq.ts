import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  DlqMetrics,
  DeadLetterEntry,
  DlqListParams,
  DlqListResult,
} from '../types/dlq';

export const dlqKeys = {
  all: ['dlq'] as const,
  metrics: () => [...dlqKeys.all, 'metrics'] as const,
  lists: () => [...dlqKeys.all, 'list'] as const,
  list: (params: DlqListParams) => [...dlqKeys.lists(), params] as const,
  detail: (entryId: string) => [...dlqKeys.all, 'detail', entryId] as const,
};

export function useDlqMetrics() {
  return useQuery<DlqMetrics>({
    queryKey: dlqKeys.metrics(),
    queryFn: async () => {
      try {
        const res = await apiClient.get('/dlq/metrics');
        return res.data as DlqMetrics;
      } catch {
        return {
          totalActive: 0,
          totalReplayed: 0,
        };
      }
    },
  });
}

export function useDlqEntry(entryId: string) {
  return useQuery<DeadLetterEntry>({
    queryKey: dlqKeys.detail(entryId),
    queryFn: async () => {
      const res = await apiClient.get(`/dlq/${entryId}`);
      return res.data as DeadLetterEntry;
    },
    enabled: Boolean(entryId),
  });
}

export function useReplayEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const res = await apiClient.post(`/dlq/${entryId}/replay`);
      return res.data;
    },
    onSuccess: (data, entryId) => {
      queryClient.invalidateQueries({ queryKey: dlqKeys.metrics() });
      queryClient.invalidateQueries({ queryKey: dlqKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dlqKeys.detail(entryId) });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function usePurgeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const res = await apiClient.delete(`/dlq/${entryId}`);
      return res.data;
    },
    onSuccess: (data, entryId) => {
      queryClient.invalidateQueries({ queryKey: dlqKeys.metrics() });
      queryClient.invalidateQueries({ queryKey: dlqKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dlqKeys.detail(entryId) });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useDlqEntries(params: DlqListParams = {}) {
  return useQuery<DlqListResult>({
    queryKey: dlqKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.get('/dlq');
      let entries = res.data as DeadLetterEntry[];

      // Client side filtering
      if (params.search) {
        const query = params.search.trim().toLowerCase();
        entries = entries.filter(
          (e) =>
            e.id.toLowerCase().includes(query) ||
            e.jobId.toLowerCase().includes(query) ||
            e.failureReason.toLowerCase().includes(query) ||
            e.job?.queueId.toLowerCase().includes(query),
        );
      }

      if (params.queueId && params.queueId !== 'ALL') {
        entries = entries.filter((e) => e.job?.queueId === params.queueId);
      }

      if (params.status && params.status !== 'ALL') {
        entries = entries.filter((e) => e.status === params.status);
      }

      // Client side sorting
      const sortBy = params.sortBy ?? 'quarantinedAt';
      const order = params.sortOrder === 'desc' ? -1 : 1;
      entries.sort((a, b) => {
        const valA = (a as any)[sortBy] ?? '';
        const valB = (b as any)[sortBy] ?? '';
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * order;
        }
        return (Number(valA) - Number(valB)) * order;
      });

      // Pagination
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      const start = (page - 1) * limit;
      const items = entries.slice(start, start + limit);

      return {
        items,
        total: entries.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(entries.length / limit)),
      };
    },
    placeholderData: (prev) => prev,
  });
}
