/* eslint-disable @typescript-eslint/no-explicit-any */
export type DebouncedFunction<T extends (...args: any[]) => any> = ((
  ...args: Parameters<T>
) => void) & { cancel: () => void; flush: () => void };

export type ThrottledFunction<T extends (...args: any[]) => any> = ((
  ...args: Parameters<T>
) => void) & { cancel: () => void };

const willChangeCache = new WeakMap<HTMLElement, string | null>();

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  wait = 100
): DebouncedFunction<T> => {
  let timeoutId: number | undefined;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      timeoutId = undefined;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
    }, wait);
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    if (lastArgs) {
      fn(...lastArgs);
      lastArgs = null;
    }
  };

  return debounced;
};

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit = 100
): ThrottledFunction<T> => {
  let lastInvocation = 0;
  let trailingTimeout: number | undefined;
  let trailingArgs: Parameters<T> | null = null;

  const invoke = (...args: Parameters<T>) => {
    lastInvocation = Date.now();
    fn(...args);
  };

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = limit - (now - lastInvocation);

    if (remaining <= 0) {
      if (trailingTimeout !== undefined) {
        window.clearTimeout(trailingTimeout);
        trailingTimeout = undefined;
      }
      invoke(...args);
    } else {
      trailingArgs = args;

      if (trailingTimeout === undefined) {
        trailingTimeout = window.setTimeout(() => {
          if (trailingArgs) {
            invoke(...trailingArgs);
            trailingArgs = null;
          }
          trailingTimeout = undefined;
        }, remaining);
      }
    }
  }) as ThrottledFunction<T>;

  throttled.cancel = () => {
    if (trailingTimeout !== undefined) {
      window.clearTimeout(trailingTimeout);
      trailingTimeout = undefined;
    }
    trailingArgs = null;
  };

  return throttled;
};

export const rafThrottle = <T extends (...args: any[]) => any>(fn: T): ThrottledFunction<T> => {
  let frameId: number | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const throttled = ((...args: Parameters<T>) => {
    pendingArgs = args;

    if (frameId !== null) {
      return;
    }

    frameId = requestAnimationFrame(() => {
      if (pendingArgs) {
        fn(...pendingArgs);
        pendingArgs = null;
      }

      frameId = null;
    });
  }) as ThrottledFunction<T>;

  throttled.cancel = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    pendingArgs = null;
  };

  return throttled;
};

export const addWillChange = (element: HTMLElement, properties: string[]): void => {
  if (!element) {
    return;
  }

  if (!willChangeCache.has(element)) {
    willChangeCache.set(element, element.style.willChange || null);
  }

  element.style.willChange = properties.join(', ');
};

export const removeWillChange = (element: HTMLElement): void => {
  if (!element) {
    return;
  }

  const original = willChangeCache.get(element);

  if (original !== undefined) {
    element.style.willChange = original ?? 'auto';
    willChangeCache.delete(element);
    return;
  }

  element.style.willChange = 'auto';
};

export const observeIntersection = (
  elements: Element[],
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): (() => void) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return () => undefined;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    callback(entries, obs);
  }, options);

  elements.forEach((element) => observer.observe(element));

  return () => {
    observer.disconnect();
  };
};

let prefersReducedMotionCached: boolean | null = null;

const evaluateReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const prefersReducedMotion = (): boolean => {
  if (prefersReducedMotionCached === null) {
    prefersReducedMotionCached = evaluateReducedMotion();

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const listener = (event: MediaQueryListEvent) => {
        prefersReducedMotionCached = event.matches;
      };

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', listener);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(listener);
      }
    }
  }

  return prefersReducedMotionCached;
};

export const measurePerformance = <T>(label: string, callback: () => T): T => {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    return callback();
  }

  const startMark = `${label}-start`;
  const endMark = `${label}-end`;

  performance.mark(startMark);
  const result = callback();
  performance.mark(endMark);
  performance.measure(label, startMark, endMark);

  const entries = performance.getEntriesByName(label);
  const duration = entries[entries.length - 1]?.duration;

  const isDev = (() => {
    if (typeof process !== 'undefined' && process.env && process.env['NODE_ENV']) {
      return process.env['NODE_ENV'] !== 'production';
    }

    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.MODE) {
      return (import.meta as any).env.MODE !== 'production';
    }

    return true;
  })();

  if (isDev && typeof duration === 'number') {
    // eslint-disable-next-line no-console
    console.info(`[perf] ${label}: ${duration.toFixed(2)}ms`);
  }

  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(label);

  return result;
};

// Performance monitoring and analytics
export interface PerformanceMetrics {
  label: string;
  duration: number;
  timestamp: number;
  memoryUsage?: number | undefined;
  customData?: Record<string, unknown> | undefined;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private observers: Array<(metrics: PerformanceMetrics) => void> = [];
  private maxMetricsSize = 1000;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetric(label: string, duration: number, customData?: Record<string, unknown>): void {
    const metric: PerformanceMetrics = {
      label,
      duration,
      timestamp: Date.now(),
      memoryUsage: this.getMemoryUsage(),
      customData,
    };

    this.metrics.push(metric);

    // Keep only the latest metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }

    // Notify observers
    this.observers.forEach(observer => observer(metric));
  }

  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageTime(label: string): number | null {
    const labelMetrics = this.metrics.filter(m => m.label === label);
    if (labelMetrics.length === 0) return null;

    const sum = labelMetrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / labelMetrics.length;
  }

  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Enhanced performance measurement with monitoring
export const measurePerformanceWithMonitoring = <T>(
  label: string,
  callback: () => T,
  customData?: Record<string, unknown>
): T => {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    return callback();
  }

  const startMark = `${label}-start`;
  const endMark = `${label}-end`;

  performance.mark(startMark);
  const result = callback();
  performance.mark(endMark);
  performance.measure(label, startMark, endMark);

  const entries = performance.getEntriesByName(label);
  const duration = entries[entries.length - 1]?.duration;

  if (typeof duration === 'number') {
    performanceMonitor.recordMetric(label, duration, customData);
  }

  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(label);

  return result;
};

type DocumentWithViewTransitions = Document & {
  startViewTransition?: (callback: () => void) => unknown;
};

export const supportsViewTransitions = (): boolean => {
  if (typeof document === 'undefined') {
    return false;
  }

  const doc = document as DocumentWithViewTransitions;
  return typeof doc.startViewTransition === 'function';
};

export const withViewTransition = (callback: () => void): void => {
  if (typeof callback !== 'function') {
    return;
  }

  if (!supportsViewTransitions()) {
    callback();
    return;
  }

  try {
    const doc = document as DocumentWithViewTransitions;
    doc.startViewTransition?.(() => {
      callback();
    });
  } catch {
    callback();
  }
};
