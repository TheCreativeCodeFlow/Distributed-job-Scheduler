import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { EventDispatcher } from './EventDispatcher';
import { PollingController } from './PollingController';
import { RefreshManager } from './RefreshManager';
import { LiveProvider } from './LiveProvider';
import { useNow } from './useNow';
import { useRelativeTime } from './useRelativeTime';
import { useLiveUpdates } from './useLiveUpdates';

describe('Live Update Infrastructure (Phase 17)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EventDispatcher Class', () => {
    it('supports subscription, publication, and unsubscription', () => {
      const dispatcher = new EventDispatcher();
      const callback = vi.fn();

      const unsub = dispatcher.subscribe('test-event', callback);
      dispatcher.publish('test-event', { payload: 'hello' });

      expect(callback).toHaveBeenCalledWith({ payload: 'hello' });

      unsub();
      dispatcher.publish('test-event', { payload: 'ignored' });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('PollingController Class', () => {
    it('manages polling states and fires change notifications', () => {
      const controller = new PollingController();
      const listener = vi.fn();

      controller.subscribe(listener);
      controller.setInterval(30000);

      expect(controller.getInterval()).toBe(30000);
      expect(controller.getMs()).toBe(30000);
      expect(listener).toHaveBeenCalledWith(30000);

      controller.setInterval('manual');
      expect(controller.getMs()).toBe(false);
    });
  });

  describe('RefreshManager Class', () => {
    it('routes manual trigger broadcasts and module updates', () => {
      const manager = new RefreshManager();
      const allCallback = vi.fn();
      const moduleCallback = vi.fn();

      const unsubAll = manager.subscribeToRefresh(undefined, allCallback);
      const unsubModule = manager.subscribeToRefresh('metrics', moduleCallback);

      manager.triggerManualRefresh(); // broadast all
      expect(allCallback).toHaveBeenCalled();
      expect(moduleCallback).toHaveBeenCalled();

      vi.clearAllMocks();
      manager.triggerManualRefresh('metrics'); // module only
      expect(allCallback).not.toHaveBeenCalled();
      expect(moduleCallback).toHaveBeenCalled();

      unsubAll();
      unsubModule();
    });
  });

  describe('Live Provider & Hooks', () => {
    it('provides a ticking clock timestamp and relative text calculations', async () => {
      vi.useFakeTimers();
      const startTime = new Date('2026-07-04T12:00:00.000Z');
      vi.setSystemTime(startTime);

      const TestComponent = () => {
        const now = useNow();
        const rel = useRelativeTime(
          new Date('2026-07-04T11:59:01.000Z').toISOString(),
        );
        return (
          <div>
            <span data-testid="now">{now.toISOString()}</span>
            <span data-testid="rel">{rel}</span>
          </div>
        );
      };

      render(
        <LiveProvider>
          <TestComponent />
        </LiveProvider>,
      );

      expect(screen.getByTestId('now').textContent).toBe(
        startTime.toISOString(),
      );
      expect(screen.getByTestId('rel').textContent).toBe('59 seconds ago');

      // Fast forward time by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByTestId('now').textContent).toBe(
        new Date('2026-07-04T12:00:05.000Z').toISOString(),
      );
      vi.useRealTimers();
    });
  });
});
