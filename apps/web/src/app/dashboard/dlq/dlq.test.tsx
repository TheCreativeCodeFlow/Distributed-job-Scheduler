import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DlqDashboardPage from './page';
import DlqEntryDetailsPage from './[entryId]/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useDlqHook from '../../../hooks/use-dlq';
import * as authProviderHook from '../../../providers/auth-provider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/dlq',
  useParams: () => ({ entryId: 'dlq-entry-999' }),
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

describe('Dead Letter Queue Management Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders DLQ dashboard metrics and entries lists', async () => {
    vi.spyOn(useDlqHook, 'useDlqMetrics').mockReturnValue({
      data: {
        totalActive: 15,
        totalReplayed: 8,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useDlqHook, 'useDlqEntries').mockReturnValue({
      data: {
        items: [
          {
            id: 'dlq-111111',
            jobId: 'job-aaa',
            status: 'ACTIVE',
            failureReason: 'Out of memory allocating thread blocks',
            quarantinedAt: new Date().toISOString(),
            job: { queueId: 'q-data-pipeline' },
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
        <DlqDashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Active DLQ Failures')).toBeInTheDocument();
      expect(screen.getByText('dlq-1111...')).toBeInTheDocument();
      expect(
        screen.getByText('Out of memory allocating thread blocks'),
      ).toBeInTheDocument();
      expect(screen.getAllByText('ACTIVE')[0]).toBeInTheDocument();
    });
  });

  it('renders detailed execution quarantine specs and stack traces', async () => {
    vi.spyOn(useDlqHook, 'useDlqEntry').mockReturnValue({
      data: {
        id: 'dlq-entry-999',
        jobId: 'job-999',
        status: 'ACTIVE',
        failureReason: 'Division by zero inside worker calculation kernel',
        errorStack:
          'at computeKernel (worker.ts:25)\n at execute (worker.ts:40)',
        quarantinedAt: new Date().toISOString(),
        job: {
          queueId: 'q-kernel',
          payload: { run: true },
          metadata: { env: 'prod' },
          createdAt: new Date().toISOString(),
        },
      },
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DlqEntryDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('DLQ Entry Details: dlq-entr'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Division by zero inside worker calculation kernel'),
      ).toBeInTheDocument();
      expect(screen.getByText(/at computeKernel/)).toBeInTheDocument();
      expect(screen.getByText('Quarantined Payload JSON')).toBeInTheDocument();
      expect(screen.getByText('Replay Failure')).toBeInTheDocument();
    });
  });

  it('locks replay and purge buttons from developer role', async () => {
    vi.spyOn(authProviderHook, 'useAuth').mockReturnValue({
      user: { id: 'usr-2', email: 'dev@domain.com', role: 'DEVELOPER' },
    } as any);

    vi.spyOn(useDlqHook, 'useDlqEntry').mockReturnValue({
      data: {
        id: 'dlq-entry-999',
        jobId: 'job-999',
        status: 'ACTIVE',
        failureReason: 'Permissions mismatch',
        attempts: 1,
      },
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DlqEntryDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Replay Failure')).not.toBeInTheDocument();
      expect(screen.queryByText('Purge Record')).not.toBeInTheDocument();
    });
  });
});
