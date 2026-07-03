import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrganizationsListPage from './page';
import CreateOrganizationPage from './create/page';
import OrganizationDetailsPage from './[organizationId]/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '../../../services/api-client';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/organizations',
  useParams: () => ({ organizationId: 'org-123' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock apiClient
vi.mock('../../../services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
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

describe('Organizations Module Views', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders directory list successfully', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          id: 'org-101',
          name: 'First Corporate Org',
          slug: 'first-corp',
          isActive: true,
          isSuspended: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrganizationsListPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('First Corporate Org')).toBeInTheDocument();
      expect(screen.getByText('slug: first-corp')).toBeInTheDocument();
    });
  });

  it('generates slug automatically from name input changes', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreateOrganizationPage />
      </QueryClientProvider>,
    );

    const nameInput = screen.getByLabelText(
      'Organization Name',
    ) as HTMLInputElement;
    const slugInput = screen.getByLabelText('Unique Slug') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'My Awesome Tenant' } });

    await waitFor(() => {
      expect(slugInput.value).toBe('my-awesome-tenant');
    });
  });

  it('renders details page widgets with correct stats and project details', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url.includes('/statistics')) {
        return { data: { memberCount: 12, activeInvitations: 3 } };
      }
      if (url.includes('/projects')) {
        return {
          data: [
            {
              id: 'proj-1',
              name: 'Billing Microservice',
              slug: 'billing-service',
            },
          ],
        };
      }
      if (url.includes('/activity')) {
        return {
          data: [
            {
              id: 'act-1',
              action: 'organization.created',
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return {
        data: {
          id: 'org-123',
          name: 'Test Target Org',
          slug: 'target-org',
          isActive: true,
          isSuspended: false,
        },
      };
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrganizationDetailsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Test Target Org')).toBeInTheDocument();
      expect(screen.getByText('Billing Microservice')).toBeInTheDocument();
      expect(screen.getByText('organization.created')).toBeInTheDocument();
    });
  });
});
