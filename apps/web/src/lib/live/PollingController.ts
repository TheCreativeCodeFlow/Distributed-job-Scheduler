export type PollingInterval = 'manual' | 5000 | 10000 | 30000 | 60000 | 'off';

export class PollingController {
  private currentInterval: PollingInterval = 10000; // default 10s
  private changeListeners = new Set<(interval: PollingInterval) => void>();

  public getInterval(): PollingInterval {
    return this.currentInterval;
  }

  public setInterval(interval: PollingInterval): void {
    if (this.currentInterval !== interval) {
      this.currentInterval = interval;
      this.changeListeners.forEach((listener) => listener(interval));
    }
  }

  public getMs(): number | false {
    if (this.currentInterval === 'manual' || this.currentInterval === 'off') {
      return false;
    }
    return this.currentInterval;
  }

  public subscribe(listener: (interval: PollingInterval) => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }
}

export const globalPollingController = new PollingController();
