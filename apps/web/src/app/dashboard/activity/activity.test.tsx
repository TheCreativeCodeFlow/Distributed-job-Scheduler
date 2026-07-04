import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ActivityTimelinePage from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useActivityHook from '../../../hooks/use-activity';

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

describe('Activity Timeline & Event Center Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chronological event items, status badges, and relative times', async () => {
    const fixedNow = new Date('2026-07-04T12:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    vi.spyOn(useActivityHook, 'useCombinedActivityEvents').mockReturnValue({
      data: [
        {
          id: 'job-101',
          event: 'job.submitted',
          message: "Job job-101 submitted to queue 'Compute Queue'",
          timestamp: new Date('2026-07-04T11:59:30.000Z').toISOString(), // exactly 30s ago
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ActivityTimelinePage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Job job-101 submitted/)).toBeInTheDocument();
      const spans = container.querySelectorAll('span');
      const hasRelativeTime = Array.from(spans).some((s) =>
        s.textContent?.includes('seconds ago'),
      );
      expect(hasRelativeTime).toBe(true);
      expect(
        screen.getByText('job.submitted', { selector: 'span' }),
      ).toBeInTheDocument(); // Filter out select options
      expect(screen.getByText('Inspect Job')).toBeInTheDocument();
    });
  });
});
