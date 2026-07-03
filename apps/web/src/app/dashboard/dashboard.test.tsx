import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '../../services/api-client';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock apiClient
vi.mock('../../services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
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

describe('Operations Overview Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state indicator initially', async () => {
    // Hang request to keep loading state visible
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText('Connecting to telemetry cluster...'),
    ).toBeInTheDocument();
  });

  it('renders KPI metrics and system statuses on successful API responses', async () => {
    // Setup API mocks
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url.includes('/dashboard/overview')) {
        return {
          data: {
            organizationsCount: 3,
            projectsCount: 8,
            queuesCount: 15,
            activeWorkersCount: 12,
            runningJobsCount: 5,
            scheduledJobsCount: 20,
            retryPendingJobsCount: 2,
            dlqEntriesCount: 1,
            systemUptimeSec: 1000,
            throughput: { completed24h: 150, failed24h: 3 },
          },
        };
      }
      if (url.includes('/dashboard/health')) {
        return {
          data: {
            databaseStatus: 'HEALTHY',
            redisStatus: 'HEALTHY',
            schedulerStatus: 'HEALTHY',
            workerAvailability: 'AVAILABLE',
            latencyMs: 12,
          },
        };
      }
      if (url.includes('/dashboard/activity')) {
        return {
          data: [
            {
              id: 'job-101',
              queueName: 'default-queue',
              workerHostname: 'node-1',
              status: 'COMPLETED',
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      if (url.includes('/metrics/queues')) {
        return { data: { active: 10, paused: 2, disabled: 1, draining: 2 } };
      }
      if (url.includes('/metrics/workers')) {
        return {
          data: { registered: 12, idle: 6, running: 5, lost: 0, recovering: 1 },
        };
      }
      return { data: {} };
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      // Check KPI renders
      expect(screen.getByText('Organizations')).toBeInTheDocument();
      expect(screen.getByText('Running Jobs')).toBeInTheDocument();
      expect(screen.getByText('DLQ Entries')).toBeInTheDocument();

      // Check System health elements
      expect(screen.getByText('System Cluster Health')).toBeInTheDocument();
      expect(screen.getByText('ALL SYSTEMS OPERATIONAL')).toBeInTheDocument();

      // Check Activity Feed elements
      expect(screen.getByText('Live Activity Feed')).toBeInTheDocument();
      expect(screen.getByText('Job ID: job-101')).toBeInTheDocument();
    });
  });

  it('renders error boundary card on failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(
      new Error('Connection timed out'),
    );

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Dashboard')).toBeInTheDocument();
      expect(
        screen.getByText(
          'An error occurred while connecting to the cluster telemetry API.',
        ),
      ).toBeInTheDocument();
    });
  });
});
