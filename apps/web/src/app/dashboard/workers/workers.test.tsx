import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WorkerDirectoryPage from './page';
import RegisterWorkerPage from './register/page';
import WorkerDetailsPage from './[workerId]/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useWorkersHook from '../../../hooks/use-workers';
import * as authProviderHook from '../../../providers/auth-provider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/workers',
  useParams: () => ({ workerId: 'w-100' }),
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

describe('Worker Management & Monitoring Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders directory list successfully', async () => {
    vi.spyOn(useWorkersHook, 'useWorkers').mockReturnValue({
      data: {
        items: [
          {
            id: 'w-1',
            hostname: 'worker-node-alpha',
            instanceId: 'i-999abc',
            version: '2.1.0',
            status: 'IDLE',
            maxConcurrency: 8,
            activeClaimsCount: 2,
            runningJobsCount: 1,
            lastHeartbeat: new Date().toISOString(),
            supportedQueues: ['default', 'billing'],
            supportedTags: ['cpu'],
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
        <WorkerDirectoryPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('worker-node-alpha')).toBeInTheDocument();
      expect(screen.getByText('i-999abc')).toBeInTheDocument();
      expect(screen.getAllByText('IDLE')[0]).toBeInTheDocument();
      expect(screen.getByText('2/8')).toBeInTheDocument(); // Capacity Slots text
    });
  });

  it('populates registration forms with defaults', async () => {
    vi.spyOn(useWorkersHook, 'useRegisterWorker').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterWorkerPage />
      </QueryClientProvider>,
    );

    // Verify concurrency default value
    const concurrencyInput = screen.getByLabelText(
      /Max Concurrency/i,
    ) as HTMLInputElement;
    expect(concurrencyInput.value).toBe('10');
  });

  it('renders details operations capacity and claims details', async () => {
    vi.spyOn(useWorkersHook, 'useWorker').mockReturnValue({
      data: {
        id: 'w-100',
        hostname: 'worker-heavy-01',
        instanceId: 'i-xyz789',
        version: '1.4.0',
        status: 'RUNNING',
        maxConcurrency: 16,
        activeClaimsCount: 12,
        runningJobsCount: 10,
        lastHeartbeat: new Date().toISOString(),
        supportedQueues: ['billing', 'encode'],
        supportedTags: ['gpu'],
        metadata: { region: 'us-west-2' },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(useWorkersHook, 'useWorkerClaims').mockReturnValue({
      data: {
        claims: [
          {
            jobId: 'job-xyz-12345',
            queueId: 'q-billing',
            claimedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60000).toISOString(),
          },
        ],
      },
      isLoading: false,
    } as any);

    vi.spyOn(useWorkersHook, 'useWorkerLease').mockReturnValue({
      data: {
        leaseId: 'lease-999',
        expiresAt: new Date().toISOString(),
        acquiredAt: new Date().toISOString(),
      },
      isLoading: false,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <WorkerDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('worker-heavy-01')).toBeInTheDocument();
      expect(screen.getByText('12 / 16 slots used (75%)')).toBeInTheDocument();
      expect(screen.getByText('job-xyz-...')).toBeInTheDocument(); // Sliced ID check in subtable
      expect(
        screen.getByText('Worker Metadata Configuration'),
      ).toBeInTheDocument();
    });
  });

  it('hides operational triggers for developer role', async () => {
    vi.spyOn(authProviderHook, 'useAuth').mockReturnValue({
      user: { id: 'usr-2', email: 'dev@domain.com', role: 'DEVELOPER' },
    } as any);

    vi.spyOn(useWorkersHook, 'useWorker').mockReturnValue({
      data: {
        id: 'w-100',
        hostname: 'worker-heavy-01',
        status: 'RUNNING',
        supportedQueues: [],
        supportedTags: [],
      },
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <WorkerDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Ping Heartbeat')).not.toBeInTheDocument();
      expect(screen.queryByText('Trigger Poll')).not.toBeInTheDocument();
      expect(screen.queryByText('Deregister Node')).not.toBeInTheDocument();
    });
  });
});
