interface EventListener {
  element: Element | Window | Document;
  event: string;
  fn: EventListenerOrEventListenerObject;
  options: boolean | AddEventListenerOptions | undefined;
}

interface CleanupManager {
  listeners: Set<EventListener>;
  timeouts: Set<number>;
  intervals: Set<number>;
  rafIds: Set<number>;

  addEventListener(
    element: Element | Window | Document,
    event: string,
    fn: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeEventListener(
    element: Element | Window | Document,
    event: string,
    fn: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  setTimeout(callback: () => void, delay?: number): number;

  clearTimeout(id: number): void;

  setInterval(callback: () => void, delay?: number): number;

  clearInterval(id: number): void;

  requestAnimationFrame(callback: FrameRequestCallback): number;

  cancelAnimationFrame(id: number): void;

  cleanup(): void;
}

class EventManagerImpl implements CleanupManager {
  public readonly listeners = new Set<EventListener>();
  public readonly timeouts = new Set<number>();
  public readonly intervals = new Set<number>();
  public readonly rafIds = new Set<number>();

  addEventListener(
    element: Element | Window | Document,
    event: string,
    fn: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    element.addEventListener(event, fn, options);
    this.listeners.add({ element, event, fn, options });
  }

  removeEventListener(
    element: Element | Window | Document,
    event: string,
    fn: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    element.removeEventListener(event, fn, options);
    this.listeners.delete({ element, event, fn, options } as EventListener);
  }

  setTimeout(callback: () => void, delay = 0): number {
    const id = window.setTimeout(callback, delay);
    this.timeouts.add(id);
    return id;
  }

  clearTimeout(id: number): void {
    window.clearTimeout(id);
    this.timeouts.delete(id);
  }

  setInterval(callback: () => void, delay = 0): number {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  clearInterval(id: number): void {
    window.clearInterval(id);
    this.intervals.delete(id);
  }

  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = window.requestAnimationFrame(callback);
    this.rafIds.add(id);
    return id;
  }

  cancelAnimationFrame(id: number): void {
    window.cancelAnimationFrame(id);
    this.rafIds.delete(id);
  }

  cleanup(): void {
    // Clean up event listeners
    this.listeners.forEach(({ element, event, fn, options }) => {
      element.removeEventListener(event, fn, options);
    });
    this.listeners.clear();

    // Clean up timeouts
    this.timeouts.forEach((id) => window.clearTimeout(id));
    this.timeouts.clear();

    // Clean up intervals
    this.intervals.forEach((id) => window.clearInterval(id));
    this.intervals.clear();

    // Clean up RAF IDs
    this.rafIds.forEach((id) => window.cancelAnimationFrame(id));
    this.rafIds.clear();
  }
}

// Create a singleton instance for global use
export const globalEventManager = new EventManagerImpl();

// Factory function to create scoped event managers
export function createEventManager(): CleanupManager {
  return new EventManagerImpl();
}

export type { CleanupManager, EventListener };
