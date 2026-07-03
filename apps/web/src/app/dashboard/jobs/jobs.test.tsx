import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JobsListPage from './page';
import CreateJobPage from './create/page';
import JobDetailsPage from './[jobId]/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useJobsHook from '../../../hooks/use-jobs';
import * as authProviderHook from '../../../providers/auth-provider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/jobs',
  useParams: () => ({ jobId: 'job-999' }),
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

describe('Job Management Module Views', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders directory list successfully', async () => {
    vi.spyOn(useJobsHook, 'useJobs').mockReturnValue({
      data: {
        items: [
          {
            id: 'job-12345678',
            queueId: 'q-1',
            status: 'QUEUED',
            priority: 3,
            attempts: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
      refetch: vi.fn(),
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <JobsListPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('job-1234...')).toBeInTheDocument();
      expect(screen.getByText('Billing Queue')).toBeInTheDocument();
      expect(screen.getAllByText('QUEUED')[0]).toBeInTheDocument();
    });
  });

  it('populates default parameters on submission form', async () => {
    vi.spyOn(useJobsHook, 'useSubmitJob').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreateJobPage />
      </QueryClientProvider>,
    );

    // Assert priority defaults to 1
    const prioritySelect = screen.getByLabelText(
      'Priority',
    ) as HTMLSelectElement;
    expect(prioritySelect.value).toBe('1');
  });

  it('renders details page telemetry and visual lifecycle', async () => {
    vi.spyOn(useJobsHook, 'useJob').mockReturnValue({
      data: {
        id: 'job-999',
        queueId: 'q-1',
        status: 'RUNNING',
        payload: { task: 'upload' },
        priority: 5,
        attempts: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        queue: { name: 'Upload Queue' },
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useJobsHook, 'useJobExecutions').mockReturnValue({
      data: [
        {
          id: 'exe-1',
          jobId: 'job-999',
          workerId: 'worker-1',
          status: 'RUNNING',
          startedAt: new Date().toISOString(),
          finishedAt: null,
          durationMs: null,
          exitCode: null,
          result: null,
          error: null,
          metadata: {},
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <JobDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Job ID')).toBeInTheDocument();
      expect(screen.getByText('Upload Queue')).toBeInTheDocument();
      expect(screen.getAllByText('RUNNING')[0]).toBeInTheDocument();
      expect(screen.getByText('Execution exe-1')).toBeInTheDocument();
    });
  });

  it('hides cancellation trigger button for read-only developer role', async () => {
    // Override auth mock to return DEVELOPER role
    vi.spyOn(authProviderHook, 'useAuth').mockReturnValue({
      user: { id: 'usr-2', email: 'dev@domain.com', role: 'DEVELOPER' },
    } as any);

    vi.spyOn(useJobsHook, 'useJob').mockReturnValue({
      data: {
        id: 'job-999',
        queueId: 'q-1',
        status: 'RUNNING',
        payload: {},
        priority: 1,
        attempts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useJobsHook, 'useJobExecutions').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <JobDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      // Developers can view details but cannot cancel
      expect(screen.queryByText('Cancel job')).not.toBeInTheDocument();
    });
  });
});
