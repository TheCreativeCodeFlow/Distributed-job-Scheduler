import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QueuesPage from './page';
import CreateQueuePage from './create/page';
import QueueDetailsPage from './[queueId]/page';
import QueueSettingsPage from './[queueId]/settings/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useQueuesHook from '../../../hooks/use-queues';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/queues',
  useParams: () => ({ queueId: 'queue-123' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock auth provider
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

describe('Queue Management Module Views', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders directory list successfully', async () => {
    vi.spyOn(useQueuesHook, 'useQueues').mockReturnValue({
      data: {
        items: [
          {
            id: 'queue-1',
            projectId: 'proj-1',
            name: 'Payment Processing Queue',
            slug: 'payment-queue',
            status: 'ACTIVE',
            priority: 5,
            waitingJobs: 12,
            runningJobs: 2,
            rateLimit: 50,
            activeWorkers: 3,
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
        <QueuesPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Payment Processing Queue')).toBeInTheDocument();
      expect(screen.getByText('payment-queue')).toBeInTheDocument();
      expect(screen.getAllByText('ACTIVE')[0]).toBeInTheDocument();
    });
  });

  it('populates default retryPolicyId on creation form', async () => {
    vi.spyOn(useQueuesHook, 'useCreateQueue').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreateQueuePage />
      </QueryClientProvider>,
    );

    const retryInput = screen.getByLabelText(
      'Retry policy ID',
    ) as HTMLInputElement;
    expect(retryInput.value).toBe('00000000-0000-0000-0000-000000000001');
  });

  it('renders details page stats and job feeds', async () => {
    vi.spyOn(useQueuesHook, 'useQueue').mockReturnValue({
      data: {
        id: 'queue-123',
        projectId: 'proj-1',
        name: 'Details Target Queue',
        slug: 'details-queue',
        status: 'ACTIVE',
        priority: 2,
        retryPolicyId: 'policy-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useQueuesHook, 'useQueueStatus').mockReturnValue({
      data: {
        status: 'ACTIVE',
        waitingJobs: 25,
        runningJobs: 3,
        activeWorkers: 4,
        completedJobs: 150,
        failedJobs: 5,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useQueuesHook, 'useQueueJobs').mockReturnValue({
      data: [
        {
          id: 'job-1',
          status: 'COMPLETED',
          updatedAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <QueueDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Details Target Queue')).toBeInTheDocument();
      expect(screen.getAllByText('25')[0]).toBeInTheDocument(); // Waiting jobs count
      expect(screen.getByText('COMPLETED')).toBeInTheDocument(); // Job status in feed
    });
  });

  it('disables invalid transition control buttons', async () => {
    vi.spyOn(useQueuesHook, 'useQueue').mockReturnValue({
      data: {
        id: 'queue-123',
        projectId: 'proj-1',
        name: 'Settings Target Queue',
        slug: 'settings-queue',
        status: 'DISABLED', // In DISABLED state, transitions allowed: enable, archive
        priority: 1,
        maxConcurrency: 10,
        metadata: {},
      },
      isLoading: false,
      error: null,
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <QueueSettingsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      // "Enable" is active; "Pause" or others not allowed in DISABLED state are not rendered
      expect(
        screen.getByLabelText('Enable Settings Target Queue'),
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText('Pause Settings Target Queue'),
      ).not.toBeInTheDocument();
    });
  });
});
