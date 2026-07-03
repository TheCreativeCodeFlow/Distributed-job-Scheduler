import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth-provider';
import { useAuthStore } from '../store/auth';
import axios from 'axios';

// Mock Next.js router & pathname
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard',
}));

// Mock axios
vi.mock('axios');

function TestChild() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="user">{user?.email}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
    </div>
  );
}

describe('AuthProvider Session Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it('redirects to /login if user is completely unauthenticated', async () => {
    render(
      <AuthProvider>
        <TestChild />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('restores silent session if refresh token is cached', async () => {
    // Setup state
    useAuthStore.setState({
      refreshToken: 'valid-refresh-token',
      isAuthenticated: false,
    });

    const mockResponse = {
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: 'user-1',
          email: 'restored@example.com',
          role: 'DEVELOPER',
        },
      },
    };
    vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

    render(
      <AuthProvider>
        <TestChild />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(
        'restored@example.com',
      );
      expect(screen.getByTestId('auth')).toHaveTextContent('true');
    });
  });
});
