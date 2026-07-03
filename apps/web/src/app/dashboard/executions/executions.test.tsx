import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ExecutionListPage from './page';
import ExecutionDetailsPage from './[jobId]/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useExecutionsHook from '../../../hooks/use-executions';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/executions',
  useParams: () => ({ jobId: 'job-100' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
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

describe('Execution History & Runtime Inspection Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders directory list successfully', async () => {
    vi.spyOn(useExecutionsHook, 'useExecutions').mockReturnValue({
      data: {
        items: [
          {
            id: 'exec-12345678',
            jobId: 'job-100',
            workerId: 'w-alpha',
            status: 'COMPLETED',
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            duration: 1250,
            exitCode: 0,
            retryCount: 0,
            error: null,
            result: { success: true },
            metadata: {},
            job: { queueId: 'q-1', queue: { name: 'Compute Queue' } },
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
        <ExecutionListPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('exec-123...')).toBeInTheDocument();
      expect(screen.getByText('job-100...')).toBeInTheDocument();
      expect(screen.getByText('Compute Queue')).toBeInTheDocument();
      expect(screen.getAllByText('COMPLETED')[0]).toBeInTheDocument();
      expect(screen.getByText('1.25s')).toBeInTheDocument(); // Duration check
    });
  });

  it('renders details stats timeline and output results', async () => {
    vi.spyOn(useExecutionsHook, 'useJobExecution').mockReturnValue({
      data: {
        id: 'exec-999',
        jobId: 'job-999',
        workerId: 'w-heavy',
        status: 'FAILED',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        duration: 4500,
        exitCode: 1,
        retryCount: 2,
        error: 'Out of Memory exception occurred on daemon',
        result: { status: 'error' },
        metadata: { trigger: 'cron' },
        job: { createdAt: new Date().toISOString() },
        queue: { name: 'Database Queue' },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ExecutionDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Execution ID')).toBeInTheDocument();
      expect(
        screen.getByText('Out of Memory exception occurred on daemon'),
      ).toBeInTheDocument();
      expect(screen.getByText('4.50s')).toBeInTheDocument();
      expect(screen.getAllByText('FAILED')[0]).toBeInTheDocument();
      expect(screen.getByText('Execution Result Output')).toBeInTheDocument();
    });
  });
});
