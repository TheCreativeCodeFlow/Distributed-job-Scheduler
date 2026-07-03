import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from './sidebar';
import { WorkspaceSelector, mockOrgs } from './workspace-selector';
import { useAuthStore } from '../../store/auth';
import { useFiltersStore } from '../../store/filters';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/queues',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock AuthProvider auth hook
vi.mock('../../providers/auth-provider', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'dev@example.com',
      role: 'DEVELOPER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    isAuthenticated: true,
    hasRole: (roles: string[]) => roles.includes('DEVELOPER'),
  }),
}));

describe('Dashboard Layout Shell Elements', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'token-123',
      user: {
        id: 'user-1',
        email: 'dev@example.com',
        role: 'DEVELOPER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isAuthenticated: true,
    });
    useFiltersStore.setState({
      filters: {
        orgId: 'org-default',
        projectId: 'proj-api',
        queueId: null,
        timeRange: '24h',
      },
    });
  });

  it('renders sidebar grouped sections and visible items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Core Console')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Queues')).toBeInTheDocument();
    expect(screen.getByText('Workers')).toBeInTheDocument();
  });

  it('filters out admin settings list for Developer role users', () => {
    render(<Sidebar />);
    // Settings has allowedRoles: ['SYSTEM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN']
    // User is DEVELOPER, so Settings should not be visible
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('renders workspace selector and handles active updates', async () => {
    render(<WorkspaceSelector />);
    const orgSelector = screen.getByLabelText(
      'Select Organization',
    ) as HTMLSelectElement;
    expect(orgSelector.value).toBe('org-default');

    fireEvent.change(orgSelector, { target: { value: 'org-acme' } });

    await waitFor(() => {
      const activeFilters = useFiltersStore.getState().filters;
      expect(activeFilters.orgId).toBe('org-acme');
      expect(activeFilters.projectId).toBe('proj-acme-billing'); // Should choose default project of Acme org
    });
  });
});
