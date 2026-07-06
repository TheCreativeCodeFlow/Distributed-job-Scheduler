import { globalEventDispatcher } from './EventDispatcher';

export class RefreshManager {
  public triggerManualRefresh(moduleKey?: string): void {
    const event = moduleKey ? `refresh:${moduleKey}` : 'refresh:all';
    globalEventDispatcher.publish(event, { timestamp: Date.now() });
  }

  public subscribeToRefresh(
    moduleKey: string | undefined,
    callback: () => void,
  ): () => void {
    const unsubAll = globalEventDispatcher.subscribe('refresh:all', callback);
    let unsubModule: (() => void) | undefined;

    if (moduleKey) {
      unsubModule = globalEventDispatcher.subscribe(
        `refresh:${moduleKey}`,
        callback,
      );
    }

    return () => {
      unsubAll();
      if (unsubModule) {
        unsubModule();
      }
    };
  }
}

export const globalRefreshManager = new RefreshManager();
