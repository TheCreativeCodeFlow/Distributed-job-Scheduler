import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  QueueMetrics,
  WorkerMetrics,
  JobMetrics,
  RetryMetrics,
  DlqMetrics,
  SchedulerMetrics,
  SystemMetrics,
} from '../types/metrics';
import type { SchedulerHealth } from '../types/scheduler';

export const metricsKeys = {
  all: ['observability'] as const,
  queues: () => [...metricsKeys.all, 'queues'] as const,
  workers: () => [...metricsKeys.all, 'workers'] as const,
  jobs: () => [...metricsKeys.all, 'jobs'] as const,
  retries: () => [...metricsKeys.all, 'retries'] as const,
  dlq: () => [...metricsKeys.all, 'dlq'] as const,
  scheduler: () => [...metricsKeys.all, 'scheduler'] as const,
  system: () => [...metricsKeys.all, 'system'] as const,
  health: () => [...metricsKeys.all, 'health'] as const,
};

export function useQueuesMetrics(refetchInterval?: number | false) {
  return useQuery<QueueMetrics>({
    queryKey: metricsKeys.queues(),
    queryFn: async () => (await apiClient.get('/metrics/queues')).data,
    refetchInterval,
  });
}

export function useWorkersMetrics(refetchInterval?: number | false) {
  return useQuery<WorkerMetrics>({
    queryKey: metricsKeys.workers(),
    queryFn: async () => (await apiClient.get('/metrics/workers')).data,
    refetchInterval,
  });
}

export function useJobsMetrics(refetchInterval?: number | false) {
  return useQuery<JobMetrics>({
    queryKey: metricsKeys.jobs(),
    queryFn: async () => (await apiClient.get('/metrics/jobs')).data,
    refetchInterval,
  });
}

export function useRetriesMetrics(refetchInterval?: number | false) {
  return useQuery<RetryMetrics>({
    queryKey: metricsKeys.retries(),
    queryFn: async () => (await apiClient.get('/metrics/retries')).data,
    refetchInterval,
  });
}

export function useDlqMetrics(refetchInterval?: number | false) {
  return useQuery<DlqMetrics>({
    queryKey: metricsKeys.dlq(),
    queryFn: async () => (await apiClient.get('/metrics/dlq')).data,
    refetchInterval,
  });
}

export function useSchedulerMetrics(refetchInterval?: number | false) {
  return useQuery<SchedulerMetrics>({
    queryKey: metricsKeys.scheduler(),
    queryFn: async () => (await apiClient.get('/metrics/scheduler')).data,
    refetchInterval,
  });
}

export function useSystemMetrics(refetchInterval?: number | false) {
  return useQuery<SystemMetrics>({
    queryKey: metricsKeys.system(),
    queryFn: async () => (await apiClient.get('/metrics/system')).data,
    refetchInterval,
  });
}

export function useDashboardHealth(refetchInterval?: number | false) {
  return useQuery<SchedulerHealth>({
    queryKey: metricsKeys.health(),
    queryFn: async () => (await apiClient.get('/dashboard/health')).data,
    refetchInterval,
  });
}
