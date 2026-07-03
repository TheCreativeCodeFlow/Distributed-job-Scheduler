import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectsListPage from './page';
import CreateProjectPage from './create/page';
import ProjectDetailsPage from './[projectId]/page';
import ProjectSettingsPage from './[projectId]/settings/page';
import { apiClient } from '../../../services/api-client';

const push = vi.fn();
let role = 'ORG_ADMIN';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: '11111111-1111-4111-8111-111111111111' }),
  useRouter: () => ({ push, back: vi.fn() }),
}));

vi.mock('../../../providers/auth-provider', () => ({
  useAuth: () => ({
    user: { id: 'user-1', role },
    isAuthenticated: true,
  }),
}));

vi.mock('../../../services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const project = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  name: 'Billing Engine',
  slug: 'billing-engine',
  description: 'Processes invoices',
  metadata: { environment: 'production' },
  settings: { region: 'ap-south-1' },
  isActive: true,
  isArchived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
  _count: { queues: 2 },
};
const organization = {
  id: project.organizationId,
  name: 'Acme',
  slug: 'acme',
};

function renderPage(element: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  role = 'ORG_ADMIN';
  vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
    if (url === '/organizations') return { data: [organization] };
    if (url.endsWith('/projects')) return { data: [project] };
    if (url.endsWith('/queues')) {
      return {
        data: [
          {
            id: 'queue-1',
            name: 'Invoices',
            slug: 'invoices',
            status: 'ACTIVE',
            isActive: true,
            isArchived: false,
          },
          {
            id: 'queue-2',
            name: 'Receipts',
            slug: 'receipts',
            status: 'PAUSED',
            isActive: true,
            isArchived: false,
          },
        ],
      };
    }
    if (url.startsWith('/organizations/')) return { data: organization };
    return { data: project };
  });
});
afterEach(cleanup);

describe('Project management', () => {
  it('lists, searches, sorts, and paginates real API projects', async () => {
    renderPage(<ProjectsListPage />);
    expect(await screen.findByText('Billing Engine')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Search projects'), {
      target: { value: 'missing' },
    });
    expect(
      await screen.findByText('No projects match the current filters.'),
    ).toBeInTheDocument();
  });

  it('renders details with queue statistics and backend-derived activity', async () => {
    renderPage(<ProjectDetailsPage />);
    expect(await screen.findByText('Processes invoices')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByText('Paused queues')).toBeInTheDocument();
    expect(screen.getByText('Project updated')).toBeInTheDocument();
  });

  it('validates creation fields and metadata JSON before submitting', async () => {
    renderPage(<CreateProjectPage />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Create project' }),
    );
    expect(
      await screen.findByText('Select an organization.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Project name is required.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Metadata'), {
      target: { value: '[]' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));
    expect(await screen.findByText(/Enter a JSON object/)).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('generates a slug, permits manual override, and creates through the API', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: project });
    renderPage(<CreateProjectPage />);
    await screen.findByRole('option', { name: 'Acme (acme)' });
    fireEvent.change(screen.getByLabelText('Organization'), {
      target: { value: organization.id },
    });
    fireEvent.change(screen.getByLabelText('Project name'), {
      target: { value: 'Payment Gateway' },
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Slug')).toHaveValue('payment-gateway'),
    );
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'payments' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));
    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        `/organizations/${organization.id}/projects`,
        expect.objectContaining({
          name: 'Payment Gateway',
          slug: 'payments',
          metadata: {},
        }),
      ),
    );
  });

  it('archives a project only after confirmation', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });
    renderPage(<ProjectsListPage />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Archive Billing Engine' }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await waitFor(() =>
      expect(apiClient.delete).toHaveBeenCalledWith(`/projects/${project.id}`),
    );
  });

  it('limits Developers to metadata while hiding archive controls', async () => {
    role = 'DEVELOPER';
    renderPage(<ProjectSettingsPage />);
    expect(
      await screen.findByText('Your Developer role can edit metadata only.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Project name')).toBeDisabled();
    expect(screen.getByLabelText('Runtime settings')).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Archive project' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Metadata')).not.toBeDisabled();
  });
});
