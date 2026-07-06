import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LiveProvider } from '../../../lib/live/LiveProvider';

// ─── Store Mocks ─────────────────────────────────────────────────────────────

const mockUpdatePreferences = vi.fn();
const mockResetSection = vi.fn();
const mockResetAll = vi.fn();

const defaultMockPreferences = {
  defaultLandingPage: '/dashboard',
  timezone: 'UTC',
  dateFormat: 'relative',
  numberFormat: 'compact',
  compactMode: false,
  cardDensity: 'comfortable',
  sidebarDefaultOpen: true,
  autoRefresh: true,
  pollingInterval: 10000,
  pauseWhenHidden: true,
  relativeTimeUpdateFrequency: 1000,
  liveUpdateMode: 'polling',
  successNotifications: true,
  errorNotifications: true,
  warningNotifications: true,
  schedulerNotifications: true,
  retryNotifications: true,
  dlqNotifications: false,
  defaultPageSize: 25,
  defaultSorting: 'createdAt',
  persistWorkspace: true,
  reducedMotion: false,
  highContrast: false,
  fontScale: 'md',
  keyboardNavEnhancements: false,
  developerMode: false,
  compactTableMode: false,
  refreshIntervalMs: 10000,
};

vi.mock('../../../store/preferences', () => ({
  usePreferencesStore: vi.fn(() => ({
    preferences: defaultMockPreferences,
    updatePreferences: mockUpdatePreferences,
    resetSection: mockResetSection,
    resetAll: mockResetAll,
  })),
}));

const mockSetTheme = vi.fn();
vi.mock('../../../store/theme', () => ({
  useThemeStore: vi.fn(() => ({
    theme: 'dark',
    setTheme: mockSetTheme,
  })),
}));

vi.mock('../../../services/api-client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// ─── Test Helpers ─────────────────────────────────────────────────────────────

const createTestClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

async function renderSettings() {
  const SettingsPage = (await import('./page')).default;
  render(
    <QueryClientProvider client={createTestClient()}>
      <LiveProvider>
        <SettingsPage />
      </LiveProvider>
    </QueryClientProvider>,
  );
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe('Settings & User Preferences Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Page renders with tabs ─────────────────────────────────────────────

  it('renders all six settings tabs', async () => {
    await renderSettings();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /General/i })).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /Appearance/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /Live Updates/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /Notifications/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /Dashboard/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /Accessibility/i }),
      ).toBeInTheDocument();
    });
  });

  // ── 2. Theme switching ────────────────────────────────────────────────────

  it('switches theme when Light / Dark / System radio pills are clicked', async () => {
    await renderSettings();

    // Navigate to Appearance tab
    await waitFor(() => {
      fireEvent.click(screen.getByRole('tab', { name: /Appearance/i }));
    });

    await waitFor(() => {
      // Light theme radio pill
      const lightBtn = screen.getByRole('radio', { name: /Light/i });
      expect(lightBtn).toBeInTheDocument();
      fireEvent.click(lightBtn);
    });

    expect(mockSetTheme).toHaveBeenCalledWith('light');

    await waitFor(() => {
      const systemBtn = screen.getByRole('radio', { name: /System/i });
      fireEvent.click(systemBtn);
    });

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  // ── 3. Live Update settings ───────────────────────────────────────────────

  it('toggles auto refresh and updates preferences store', async () => {
    await renderSettings();

    fireEvent.click(screen.getByRole('tab', { name: /Live Updates/i }));

    await waitFor(() => {
      const autoRefreshToggle = screen.getByRole('switch', {
        name: /auto refresh/i,
      });
      expect(autoRefreshToggle).toBeInTheDocument();
      fireEvent.click(autoRefreshToggle);
    });

    expect(mockUpdatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ autoRefresh: false }),
    );
  });

  it('changes polling interval and updates preferences store', async () => {
    await renderSettings();

    fireEvent.click(screen.getByRole('tab', { name: /Live Updates/i }));

    await waitFor(() => {
      // The polling interval select is identified by its id
      const intervalSelect = document.getElementById(
        'polling-interval',
      ) as HTMLSelectElement;
      expect(intervalSelect).not.toBeNull();
      fireEvent.change(intervalSelect, { target: { value: '30000' } });
    });

    expect(mockUpdatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ pollingInterval: 30000 }),
    );
  });

  // ── 4. Notification settings ──────────────────────────────────────────────

  it('renders notification toggles and updates preferences store', async () => {
    await renderSettings();

    fireEvent.click(screen.getByRole('tab', { name: /Notifications/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: /success notifications/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: /error notifications/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: /warning notifications/i }),
      ).toBeInTheDocument();
    });

    // DLQ notifications is OFF in mock — toggle it ON
    const dlqToggle = screen.getByRole('switch', {
      name: /dlq notifications/i,
    });
    fireEvent.click(dlqToggle);

    expect(mockUpdatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ dlqNotifications: true }),
    );
  });

  it('shows scheduler, retry, and DLQ subsystem notification toggles', async () => {
    await renderSettings();

    fireEvent.click(screen.getByRole('tab', { name: /Notifications/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: /scheduler notifications/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: /retry notifications/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: /dlq notifications/i }),
      ).toBeInTheDocument();
    });
  });

  // ── 5. Accessibility settings ─────────────────────────────────────────────

  it('toggles reduced motion and calls updatePreferences', async () => {
    await renderSettings();

    fireEvent.click(screen.getByRole('tab', { name: /Accessibility/i }));

    await waitFor(() => {
      const reducedMotionToggle = screen.getByRole('switch', {
        name: /reduced motion/i,
      });
      expect(reducedMotionToggle).toBeInTheDocument();
      fireEvent.click(reducedMotionToggle);
    });

    expect(mockUpdatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ reducedMotion: true }),
    );
  });

  it('toggles high contrast and calls updatePreferences', async () => {
    await renderSettings();

    fireEvent.click(screen.getByRole('tab', { name: /Accessibility/i }));

    await waitFor(() => {
      const highContrastToggle = screen.getByRole('switch', {
        name: /high contrast/i,
      });
      fireEvent.click(highContrastToggle);
    });

    expect(mockUpdatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ highContrast: true }),
    );
  });

  it('changes font scale via radio pills and calls updatePreferences', async () => {
    await renderSettings();

    fireEvent.click(screen.getByRole('tab', { name: /Accessibility/i }));

    await waitFor(() => {
      const largeBtn = screen.getByRole('radio', { name: /Large/i });
      fireEvent.click(largeBtn);
    });

    expect(mockUpdatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ fontScale: 'lg' }),
    );
  });

  // ── 6. Reset All ──────────────────────────────────────────────────────────

  it('calls resetAll when Reset All button is clicked', async () => {
    await renderSettings();

    await waitFor(() => {
      const resetBtn = screen.getByRole('button', { name: /Reset All/i });
      fireEvent.click(resetBtn);
    });

    expect(mockResetAll).toHaveBeenCalled();
  });

  // ── 7. Configuration summary ──────────────────────────────────────────────

  it('renders the active configuration summary with current values', async () => {
    await renderSettings();

    await waitFor(() => {
      expect(
        screen.getByText('Active Configuration Summary'),
      ).toBeInTheDocument();
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByText('dark')).toBeInTheDocument();
    });
  });
});
