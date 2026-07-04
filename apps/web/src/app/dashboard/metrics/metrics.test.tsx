import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MetricsCenterPage from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useMetricsHook from '../../../hooks/use-metrics';

// Mock apiClient
vi.mock('../../../services/api-client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('Metrics & Observability Center Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders KPI cards, latency bar graphs, and retry metrics', async () => {
    vi.spyOn(useMetricsHook, 'useQueuesMetrics').mockReturnValue({
      data: { active: 5, paused: 1 },
      isLoading: false,
    } as any);
    vi.spyOn(useMetricsHook, 'useWorkersMetrics').mockReturnValue({
      data: { registered: 10, idle: 6, running: 4 },
      isLoading: false,
    } as any);
    vi.spyOn(useMetricsHook, 'useJobsMetrics').mockReturnValue({
      data: { queued: 5, running: 2, completed: 50, failed: 5, scheduled: 0 },
      isLoading: false,
    } as any);
    vi.spyOn(useMetricsHook, 'useRetriesMetrics').mockReturnValue({
      data: { pending: 3, exhausted: 1 },
      isLoading: false,
    } as any);
    vi.spyOn(useMetricsHook, 'useDlqMetrics').mockReturnValue({
      data: { active: 2, replayed: 1 },
      isLoading: false,
    } as any);
    vi.spyOn(useMetricsHook, 'useSchedulerMetrics').mockReturnValue({
      data: { promotionLatency: 15 },
      isLoading: false,
    } as any);
    vi.spyOn(useMetricsHook, 'useSystemMetrics').mockReturnValue({
      data: { databaseLatency: 22, redisLatency: 5 },
      isLoading: false,
    } as any);
    vi.spyOn(useMetricsHook, 'useDashboardHealth').mockReturnValue({
      data: { databaseStatus: 'HEALTHY' },
      isLoading: false,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MetricsCenterPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Total Workload Jobs')).toBeInTheDocument();
      expect(screen.getAllByText('22ms')[0]).toBeInTheDocument(); // Postgres Latency check
      expect(screen.getByText('RETRY PENDING')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE DLQ ENTRIES')).toBeInTheDocument();
    });
  });

  it('exports metrics dataset as JSON file download', async () => {
    vi.spyOn(useMetricsHook, 'useQueuesMetrics').mockReturnValue({
      data: { active: 5 },
    } as any);
    vi.spyOn(useMetricsHook, 'useWorkersMetrics').mockReturnValue({
      data: { registered: 10 },
    } as any);
    vi.spyOn(useMetricsHook, 'useJobsMetrics').mockReturnValue({
      data: { queued: 5 },
    } as any);
    vi.spyOn(useMetricsHook, 'useRetriesMetrics').mockReturnValue({
      data: { pending: 3 },
    } as any);
    vi.spyOn(useMetricsHook, 'useDlqMetrics').mockReturnValue({
      data: { active: 2 },
    } as any);
    vi.spyOn(useMetricsHook, 'useSchedulerMetrics').mockReturnValue({
      data: { promotionLatency: 15 },
    } as any);
    vi.spyOn(useMetricsHook, 'useSystemMetrics').mockReturnValue({
      data: { databaseLatency: 22 },
    } as any);
    vi.spyOn(useMetricsHook, 'useDashboardHealth').mockReturnValue({
      data: { databaseStatus: 'HEALTHY' },
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MetricsCenterPage />
      </QueryClientProvider>,
    );

    const exportBtn = screen.getByText('Export JSON');
    const spyClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(spyClick).toHaveBeenCalled();
    });
  });
});
