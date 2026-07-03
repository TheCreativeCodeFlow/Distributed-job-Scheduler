import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ScheduledJobsListPage from './page';
import CreateScheduledJobPage from './create/page';
import ScheduledJobDetailsPage from './[scheduledJobId]/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useScheduledHook from '../../../hooks/use-scheduled-jobs';
import * as authProviderHook from '../../../providers/auth-provider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/scheduled',
  useParams: () => ({ scheduledJobId: 'sj-999' }),
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

describe('Scheduled Jobs Management Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders directory list successfully', async () => {
    vi.spyOn(useScheduledHook, 'useScheduledJobs').mockReturnValue({
      data: {
        items: [
          {
            id: 'sj-12345678',
            jobId: 'job-1',
            queueId: 'q-1',
            cronExpression: null,
            nextRunAt: new Date(Date.now() + 600000).toISOString(), // 10 minutes in future
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            queue: { name: 'Delayed Task Queue' },
            job: { status: 'SCHEDULED', priority: 2 },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ScheduledJobsListPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('sj-12345...')).toBeInTheDocument();
      expect(screen.getByText('Delayed Task Queue')).toBeInTheDocument();
      expect(screen.getAllByText('SCHEDULED')[0]).toBeInTheDocument();
      expect(screen.getByText(/9m \d+s/)).toBeInTheDocument(); // Countdown rendering tick
    });
  });

  it('verifies scheduling parameters on creation form', async () => {
    vi.spyOn(useScheduledHook, 'useCreateScheduledJob').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreateScheduledJobPage />
      </QueryClientProvider>,
    );

    // Assert priority defaults to 1
    const prioritySelect = screen.getByLabelText(
      'Priority',
    ) as HTMLSelectElement;
    expect(prioritySelect.value).toBe('1');
  });

  it('renders details page stats and countdown tickers', async () => {
    vi.spyOn(useScheduledHook, 'useScheduledJob').mockReturnValue({
      data: {
        id: 'sj-999',
        jobId: 'job-999',
        queueId: 'q-1',
        cronExpression: '0 12 * * *',
        nextRunAt: new Date(Date.now() + 600000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        queue: { name: 'Billing Queue' },
        job: {
          status: 'SCHEDULED',
          payload: { action: 'invoice' },
          priority: 3,
        },
      },
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ScheduledJobDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Scheduled ID')).toBeInTheDocument();
      expect(screen.getByText('Billing Queue')).toBeInTheDocument();
      expect(screen.getByText('0 12 * * *')).toBeInTheDocument();
      expect(screen.getAllByText('SCHEDULED')[0]).toBeInTheDocument();
      expect(screen.getByText(/9m \d+s/)).toBeInTheDocument();
    });
  });

  it('hides cancellation buttons for read-only developer role', async () => {
    vi.spyOn(authProviderHook, 'useAuth').mockReturnValue({
      user: { id: 'usr-2', email: 'dev@domain.com', role: 'DEVELOPER' },
    } as any);

    vi.spyOn(useScheduledHook, 'useScheduledJob').mockReturnValue({
      data: {
        id: 'sj-999',
        jobId: 'job-999',
        queueId: 'q-1',
        nextRunAt: new Date(Date.now() + 600000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        job: { status: 'SCHEDULED' },
      },
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ScheduledJobDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Cancel schedule')).not.toBeInTheDocument();
    });
  });
});
