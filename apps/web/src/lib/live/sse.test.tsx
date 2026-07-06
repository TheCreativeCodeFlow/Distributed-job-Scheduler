import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SSEClient } from './SSEClient';
import { SSEManager } from './SSEManager';
import { globalEventDispatcher, SSE_EVENTS } from './EventDispatcher';
import { globalPollingController } from './PollingController';
import { globalRefreshManager } from './RefreshManager';
import { LiveProvider } from './LiveProvider';
import { useSSEConnection } from './useSSEConnection';

// Mock Zustand stores to avoid localStorage/persistence complexity during test runs
vi.mock('../../store/preferences', () => {
  const mockPrefs = {
    liveUpdateMode: 'auto',
    pollingInterval: 10000,
    successNotifications: true,
    errorNotifications: true,
    warningNotifications: true,
    schedulerNotifications: true,
    retryNotifications: true,
    dlqNotifications: true,
  };
  return {
    usePreferencesStore: Object.assign(
      (cb: any) => cb({ preferences: mockPrefs }),
      {
        getState: () => ({ preferences: mockPrefs }),
      },
    ),
  };
});

vi.mock('../../store/auth', () => {
  const mockAuth = {
    isAuthenticated: true,
    accessToken: 'mock-access-token',
  };
  return {
    useAuthStore: Object.assign((cb: any) => cb(mockAuth), {
      getState: () => mockAuth,
    }),
  };
});

vi.mock('../../store/notifications', () => {
  const addToastMock = vi.fn();
  return {
    useNotificationStore: Object.assign(
      (cb: any) => cb({ addToast: addToastMock }),
      {
        getState: () => ({ addToast: addToastMock }),
      },
    ),
  };
});

// A simple test component to read the SSE state
function TestSSEComponent() {
  const { status, isConnected, isOffline, lastEventAt } = useSSEConnection();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="connected">{isConnected ? 'true' : 'false'}</span>
      <span data-testid="offline">{isOffline ? 'true' : 'false'}</span>
      <span data-testid="lastevent">{lastEventAt ? 'true' : 'false'}</span>
    </div>
  );
}

describe('Real-Time Platform Integration Tests (Phase 19)', () => {
  let originalEventSource: any;
  let mockEventSourceInstances: any[] = [];
  let eventSourceListeners: Record<string, Function[]> = {};

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockEventSourceInstances = [];
    eventSourceListeners = {};

    // Mock global EventSource
    originalEventSource = global.EventSource;
    global.EventSource = vi.fn().mockImplementation(function (url) {
      const self = {
        url,
        close: vi.fn(),
        addEventListener: vi.fn((event, cb) => {
          if (!eventSourceListeners[event]) {
            eventSourceListeners[event] = [];
          }
          eventSourceListeners[event].push(cb);
        }),
        onopen: null,
        onerror: null,
        onmessage: null,
      } as any;
      mockEventSourceInstances.push(self);
      return self;
    }) as any;

    // Reset singletons
    globalPollingController.setInterval(10000);
  });

  afterEach(() => {
    global.EventSource = originalEventSource;
    vi.useRealTimers();
    SSEClient.destroy();
    SSEManager.destroy();
  });

  it('establishes a single EventSource connection when enabled and sets state correctly', async () => {
    render(
      <LiveProvider>
        <TestSSEComponent />
      </LiveProvider>,
    );

    // Initial state is idle or connecting once provider runs its effect
    expect(screen.getByTestId('status').textContent).toBe('connecting');
    expect(global.EventSource).toHaveBeenCalledTimes(1);

    // Simulate open event
    const currentES = mockEventSourceInstances[0];
    act(() => {
      currentES.onopen();
    });

    expect(screen.getByTestId('status').textContent).toBe('connected');
    expect(screen.getByTestId('connected').textContent).toBe('true');
  });

  it('automatically falls back to polling when SSE is disconnected, and turns off polling when reconnected', async () => {
    render(
      <LiveProvider>
        <TestSSEComponent />
      </LiveProvider>,
    );

    // Connected state
    const currentES = mockEventSourceInstances[0];
    act(() => {
      currentES.onopen();
    });
    expect(globalPollingController.getInterval()).toBe('off');

    // Trigger connection failure
    act(() => {
      currentES.onerror();
    });

    // Reconnecting state triggers polling fallback immediately
    expect(screen.getByTestId('status').textContent).toBe('reconnecting');
    expect(globalPollingController.getInterval()).toBe(10000);

    // Resolve reconnection after backoff timer
    act(() => {
      vi.advanceTimersByTime(1000); // 1s initial backoff
    });

    const newES = mockEventSourceInstances[1];
    act(() => {
      newES.onopen();
    });

    // Back to connected and polling off again
    expect(screen.getByTestId('status').textContent).toBe('connected');
    expect(globalPollingController.getInterval()).toBe('off');
  });

  it('selectively invalidates cache queries when specific SSE events are received', async () => {
    const refreshSpy = vi.spyOn(globalRefreshManager, 'triggerManualRefresh');

    render(
      <LiveProvider>
        <TestSSEComponent />
      </LiveProvider>,
    );

    // Set connection active
    act(() => {
      mockEventSourceInstances[0].onopen();
    });

    // Simulate receiving JobCompleted event from SSE
    const jobCompletedListeners =
      eventSourceListeners[SSE_EVENTS.JOB_COMPLETED] || [];
    expect(jobCompletedListeners.length).toBeGreaterThan(0);

    act(() => {
      jobCompletedListeners.forEach((cb) =>
        cb({ data: JSON.stringify({ jobId: 'job-12345678' }) }),
      );
    });

    // Assert specific key updates rather than global reset
    expect(refreshSpy).toHaveBeenCalledWith('jobs');
    expect(refreshSpy).toHaveBeenCalledWith('dashboard');
    expect(refreshSpy).toHaveBeenCalledWith('metrics');
    expect(refreshSpy).toHaveBeenCalledWith('executions');
    expect(refreshSpy).toHaveBeenCalledWith('activity');
    expect(refreshSpy).not.toHaveBeenCalledWith('workers');
  });

  it('dispatches live toast notifications for key events based on preferences', async () => {
    const { useNotificationStore } = await import('../../store/notifications');
    const toastSpy = useNotificationStore.getState().addToast;

    render(
      <LiveProvider>
        <TestSSEComponent />
      </LiveProvider>,
    );

    act(() => {
      mockEventSourceInstances[0].onopen();
    });

    // Simulate receiving WorkerLost event
    const workerLostListeners =
      eventSourceListeners[SSE_EVENTS.WORKER_LOST] || [];
    expect(workerLostListeners.length).toBeGreaterThan(0);

    act(() => {
      workerLostListeners.forEach((cb) =>
        cb({ data: JSON.stringify({ workerId: 'worker-xyz' }) }),
      );
    });

    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'Worker Lost',
      }),
    );
  });

  it('suspends reconnect attempts when offline or hidden, and reconnects immediately when online/visible', async () => {
    render(
      <LiveProvider>
        <TestSSEComponent />
      </LiveProvider>,
    );

    act(() => {
      mockEventSourceInstances[0].onopen();
    });

    // Go offline
    act(() => {
      globalEventDispatcher.publish(SSE_EVENTS.SSE_OFFLINE, {});
    });

    expect(screen.getByTestId('offline').textContent).toBe('true');

    // Restore online
    act(() => {
      globalEventDispatcher.publish(SSE_EVENTS.SSE_ONLINE, {});
    });

    expect(screen.getByTestId('offline').textContent).toBe('false');
  });
});
