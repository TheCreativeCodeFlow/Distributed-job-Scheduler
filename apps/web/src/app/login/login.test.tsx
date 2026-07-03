import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';

// Mock next/navigation router
const mockReplace = vi.fn();
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

describe('Login Page View', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login card and fields successfully', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Remember me')).toBeInTheDocument();
  });

  it('toggles password visibility field parameters', () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('Show password');

    expect(passwordInput.type).toBe('password');
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
  });

  it('validates email pattern constraint', async () => {
    const { container } = render(<LoginPage />);
    const emailInput = screen.getByLabelText('Email Address');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address'),
      ).toBeInTheDocument();
    });
  });
});
