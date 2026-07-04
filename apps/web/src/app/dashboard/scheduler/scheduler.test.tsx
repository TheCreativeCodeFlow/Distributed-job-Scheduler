import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SchedulerOperationsPage from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useSchedulerHook from '../../../hooks/use-scheduler';
import * as authProviderHook from '../../../providers/auth-provider';

// Mock auth provider by default
vi.mock('../../../providers/auth-provider', () => ({
  useAuth: () => ({
    user: { id: 'usr-1', email: 'admin@domain.com', role: 'ORG_OWNER' },
  }),
}));

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

describe('Scheduler Operations Center Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders health indicators and loop metrics successfully', async () => {
    vi.spyOn(useSchedulerHook, 'useSchedulerStatus').mockReturnValue({
      data: {
        status: 'ACTIVE',
        lastPromotionCycleAt: new Date().toISOString(),
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(useSchedulerHook, 'useSchedulerMetrics').mockReturnValue({
      data: {
        totalPromoted: 100,
        lastPromotedCount: 5,
        errorCount: 1,
        emptyScans: 20,
        lastPromotionLatencyMs: 12,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(useSchedulerHook, 'useSchedulerDashboard').mockReturnValue({
      data: {
        status: 'ACTIVE',
        loopIntervalMs: 5000,
        totalPromotedJobs: 100,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(useSchedulerHook, 'useSchedulerHealth').mockReturnValue({
      data: {
        databaseStatus: 'HEALTHY',
        redisStatus: 'HEALTHY',
        schedulerStatus: 'HEALTHY',
        workerAvailability: 'AVAILABLE',
        latencyMs: 15,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SchedulerOperationsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('PostgreSQL Engine')).toBeInTheDocument();
      expect(screen.getByText('Redis Cache Status')).toBeInTheDocument();
      expect(screen.getByText('5000ms')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // Promoted jobs check
      expect(screen.getByText('Force Scheduled Promotion')).toBeInTheDocument();
    });
  });

  it('triggers manual promotion cycle on confirmation modal click', async () => {
    const promoteMock = vi
      .fn()
      .mockResolvedValue({ status: 'ok', promotedCount: 10 });
    vi.spyOn(useSchedulerHook, 'usePromoteJobs').mockReturnValue({
      mutateAsync: promoteMock,
      isPending: false,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SchedulerOperationsPage />
      </QueryClientProvider>,
    );

    const btn = screen.getByText('Force Scheduled Promotion');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(
        screen.getByText('Confirm manual scheduler promotion'),
      ).toBeInTheDocument();
    });

    const confirmBtn = screen.getByText('Promote scheduled jobs');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(promoteMock).toHaveBeenCalledWith(50);
    });
  });

  it('locks manual promotion controls from developer role', async () => {
    vi.spyOn(authProviderHook, 'useAuth').mockReturnValue({
      user: { id: 'usr-2', email: 'dev@domain.com', role: 'DEVELOPER' },
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SchedulerOperationsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.queryByText('Force Scheduled Promotion'),
      ).not.toBeInTheDocument();
    });
  });
});
