import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  SchedulerStatus,
  SchedulerMetrics,
  SchedulerDashboardData,
  SchedulerHealth,
} from '../types/scheduler';

export const schedulerKeys = {
  all: ['scheduler'] as const,
  status: () => [...schedulerKeys.all, 'status'] as const,
  metrics: () => [...schedulerKeys.all, 'metrics'] as const,
  dashboard: () => [...schedulerKeys.all, 'dashboard'] as const,
  health: () => [...schedulerKeys.all, 'health'] as const,
};

export function useSchedulerStatus() {
  return useQuery<SchedulerStatus>({
    queryKey: schedulerKeys.status(),
    queryFn: async () => {
      const res = await apiClient.get('/scheduler/status');
      return res.data as SchedulerStatus;
    },
  });
}

export function useSchedulerMetrics() {
  return useQuery<SchedulerMetrics>({
    queryKey: schedulerKeys.metrics(),
    queryFn: async () => {
      const res = await apiClient.get('/scheduler/metrics');
      return res.data as SchedulerMetrics;
    },
  });
}

export function useSchedulerDashboard() {
  return useQuery<SchedulerDashboardData>({
    queryKey: schedulerKeys.dashboard(),
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/scheduler');
      return res.data as SchedulerDashboardData;
    },
  });
}

export function useSchedulerHealth() {
  return useQuery<SchedulerHealth>({
    queryKey: schedulerKeys.health(),
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/health');
      return res.data as SchedulerHealth;
    },
  });
}

export function usePromoteJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (batchSize?: number) => {
      const res = await apiClient.post('/scheduler/promote', { batchSize });
      return res.data as { status: string; promotedCount: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulerKeys.status() });
      queryClient.invalidateQueries({ queryKey: schedulerKeys.metrics() });
      queryClient.invalidateQueries({ queryKey: schedulerKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}
