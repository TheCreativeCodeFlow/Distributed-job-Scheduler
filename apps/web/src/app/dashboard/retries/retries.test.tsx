import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RetryDashboardPage from './page';
import RetryJobDetailsPage from './[jobId]/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useRetriesHook from '../../../hooks/use-retries';
import * as useJobsHook from '../../../hooks/use-jobs';
import * as authProviderHook from '../../../providers/auth-provider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/retries',
  useParams: () => ({ jobId: 'job-500' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock auth provider by default
vi.mock('../../../providers/auth-provider', () => ({
  useAuth: () => ({
    user: { id: 'usr-1', email: 'admin@domain.com', role: 'ORG_OWNER' },
  }),
}));

// Mock apiClient
vi.mock('../../../services/api-client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
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

describe('Retry Management Dashboard Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard metrics and retry items lists', async () => {
    vi.spyOn(useRetriesHook, 'useRetryMetrics').mockReturnValue({
      data: {
        totalRetries: 42,
        pendingRetries: 5,
        exhaustedRetries: 2,
        averageAttempts: 1.8,
        successRate: 85.5,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useRetriesHook, 'useRetryJobs').mockReturnValue({
      data: {
        items: [
          {
            id: 'job-retry-12345',
            queueId: 'q-billing',
            status: 'RETRY_PENDING',
            attempts: 2,
            maxAttempts: 5,
            createdAt: new Date().toISOString(),
            queue: { name: 'Billing Queue' },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RetryDashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Total Retries')).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
      expect(screen.getByText('job-retr...')).toBeInTheDocument();
      expect(screen.getByText('Billing Queue')).toBeInTheDocument();
      expect(screen.getAllByText('RETRY_PENDING')[0]).toBeInTheDocument();
    });
  });

  it('renders details configurations and historical attempt logs', async () => {
    vi.spyOn(useJobsHook, 'useJob').mockReturnValue({
      data: {
        id: 'job-500',
        queueId: 'q-billing',
        status: 'RETRY_PENDING',
        attempts: 2,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useRetriesHook, 'useJobRetries').mockReturnValue({
      data: {
        id: 'r-1',
        jobId: 'job-500',
        retryCount: 2,
        maxRetries: 3,
        nextRetryAt: new Date(Date.now() + 600000).toISOString(),
        strategy: 'EXPONENTIAL',
        backoffFactor: 15,
        jitter: true,
        lastFailureReason: 'Database lock acquisition timeout error',
        attemptsHistory: [
          {
            attemptNumber: 1,
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            error: 'DB connection failure',
            exitCode: 1,
          },
        ],
      },
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RetryJobDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Retry Attempts count')).toBeInTheDocument();
      expect(screen.getByText('EXPONENTIAL')).toBeInTheDocument();
      expect(
        screen.getByText('Database lock acquisition timeout error'),
      ).toBeInTheDocument();
      expect(screen.getByText('DB connection failure')).toBeInTheDocument();
      expect(screen.getByText(/9m \d+s/)).toBeInTheDocument(); // Countdown check
    });
  });

  it('locks manual retries buttons trigger from developer role', async () => {
    vi.spyOn(authProviderHook, 'useAuth').mockReturnValue({
      user: { id: 'usr-2', email: 'dev@domain.com', role: 'DEVELOPER' },
    } as any);

    vi.spyOn(useJobsHook, 'useJob').mockReturnValue({
      data: {
        id: 'job-500',
        status: 'RETRY_PENDING',
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useRetriesHook, 'useJobRetries').mockReturnValue({
      data: {
        id: 'r-1',
        jobId: 'job-500',
        retryCount: 2,
        maxRetries: 3,
        attemptsHistory: [],
      },
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RetryJobDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Manual Force Retry')).not.toBeInTheDocument();
    });
  });
});
