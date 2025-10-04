/**
 * Advanced development utilities and tooling for A+ code quality
 */

import { logger } from './logger';
import { performanceMonitor, measurePerformanceWithMonitoring } from './performance';

export interface DevToolsConfig {
  enableConsoleLogging?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableMemoryTracking?: boolean;
  enableNetworkMonitoring?: boolean;
  enableErrorReporting?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  performanceThreshold?: number; // in milliseconds
}

export class DevTools {
  private static instance: DevTools;
  private config: Required<DevToolsConfig>;
  private observers: Array<(data: unknown) => void> = [];
  private performanceMarks: Map<string, number> = new Map();
  private memoryHistory: Array<{ timestamp: number; usage: number }> = [];

  static getInstance(config?: DevToolsConfig): DevTools {
    if (!DevTools.instance) {
      DevTools.instance = new DevTools(config);
    }
    return DevTools.instance;
  }

  constructor(config?: DevToolsConfig) {
    this.config = {
      enableConsoleLogging: true,
      enablePerformanceMonitoring: true,
      enableMemoryTracking: true,
      enableNetworkMonitoring: false,
      enableErrorReporting: true,
      logLevel: 'info',
      performanceThreshold: 100,
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.config.enableConsoleLogging) {
      this.setupConsoleLogging();
    }

    if (this.config.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }

    if (this.config.enableMemoryTracking) {
      this.setupMemoryTracking();
    }

    if (this.config.enableErrorReporting) {
      this.setupErrorReporting();
    }

    logger.info('DevTools initialized', {
      component: 'dev-tools',
      action: 'initialize',
      metadata: this.config
    });
  }

  private setupConsoleLogging(): void {
    // Enhanced console methods
    const originalConsole = { ...console };

    const createEnhancedLogMethod = (level: string, originalMethod: (...args: any[]) => void) =>
      (...args: any[]) => {
        if (this.config.enableConsoleLogging) {
          originalMethod(...args);

          // Also log to our logger system
          logger.debug(`Console ${level}:`, {
            component: 'console',
            metadata: { args, level }
          });
        }
      };

    console.log = createEnhancedLogMethod('log', originalConsole.log);
    console.info = createEnhancedLogMethod('info', originalConsole.info);
    console.warn = createEnhancedLogMethod('warn', originalConsole.warn);
    console.error = createEnhancedLogMethod('error', originalConsole.error);
    console.debug = createEnhancedLogMethod('debug', originalConsole.debug);
  }

  private setupPerformanceMonitoring(): void {
    // Monitor performance API usage
    const originalMark = performance.mark;
    const originalMeasure = performance.measure;

    performance.mark = (name: string) => {
      this.performanceMarks.set(name, Date.now());
      return originalMark.call(performance, name);
    };

    performance.measure = (name: string, start?: string, end?: string) => {
      const result = originalMeasure.call(performance, name, start, end);
      const duration = result.duration;

      if (duration > this.config.performanceThreshold) {
        logger.warn(`Performance threshold exceeded: ${name}`, {
          component: 'performance',
          action: 'measure',
          metadata: { duration, threshold: this.config.performanceThreshold }
        });
      }

      return result;
    };
  }

  private setupMemoryTracking(): void {
    const trackMemory = () => {
      if ('memory' in performance) {
        const usage = (performance as any).memory.usedJSHeapSize;
        this.memoryHistory.push({
          timestamp: Date.now(),
          usage
        });

        // Keep only last 100 measurements
        if (this.memoryHistory.length > 100) {
          this.memoryHistory.shift();
        }

        // Check for memory leaks
        if (this.memoryHistory.length >= 10) {
          const recent = this.memoryHistory.slice(-10);
          const trend = recent.reduce((acc, curr, index) => {
            if (index === 0) return acc;
            return acc + (curr.usage - recent[index - 1].usage);
          }, 0);

          if (trend > 1024 * 1024) { // 1MB increase over 10 measurements
            logger.warn('Potential memory leak detected', {
              component: 'memory',
              action: 'track',
              metadata: { trend, usage }
            });
          }
        }
      }
    };

    setInterval(trackMemory, 5000); // Track every 5 seconds
  }

  private setupErrorReporting(): void {
    const originalErrorHandler = window.onerror;

    window.onerror = (message, source, lineno, colno, error) => {
      logger.error('Global error caught', error || new Error(String(message)), {
        component: 'global',
        action: 'error',
        metadata: { source, lineno, colno, message }
      });

      if (originalErrorHandler) {
        return originalErrorHandler.call(window, message, source, lineno, colno, error);
      }
      return false;
    };
  }

  // Performance profiling utilities
  startProfiling(label: string): void {
    if (!this.config.enablePerformanceMonitoring) return;

    this.performanceMarks.set(`${label}-start`, Date.now());
    logger.debug(`Performance profiling started: ${label}`);
  }

  endProfiling(label: string): number | null {
    if (!this.config.enablePerformanceMonitoring) return null;

    const startMark = this.performanceMarks.get(`${label}-start`);
    if (!startMark) {
      logger.warn(`No start mark found for profiling: ${label}`);
      return null;
    }

    const duration = Date.now() - startMark;
    this.performanceMarks.delete(`${label}-start`);

    logger.info(`Performance profiling completed: ${label}`, {
      component: 'profiler',
      action: 'end',
      metadata: { duration, label }
    });

    return duration;
  }

  // Memory analysis
  getMemoryStats(): {
    current: number;
    average: number;
    peak: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } | null {
    if (this.memoryHistory.length === 0) return null;

    const current = this.memoryHistory[this.memoryHistory.length - 1].usage;
    const average = this.memoryHistory.reduce((sum, entry) => sum + entry.usage, 0) / this.memoryHistory.length;
    const peak = Math.max(...this.memoryHistory.map(entry => entry.usage));

    // Calculate trend over last 10 measurements
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.memoryHistory.length >= 10) {
      const recent = this.memoryHistory.slice(-10);
      const oldAvg = recent.slice(0, 5).reduce((sum, entry) => sum + entry.usage, 0) / 5;
      const newAvg = recent.slice(-5).reduce((sum, entry) => sum + entry.usage, 0) / 5;

      if (newAvg > oldAvg * 1.1) trend = 'increasing';
      else if (newAvg < oldAvg * 0.9) trend = 'decreasing';
    }

    return { current, average, peak, trend };
  }

  // Network monitoring (if enabled)
  monitorNetwork(): void {
    if (!this.config.enableNetworkMonitoring) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        logger.info('Network request completed', {
          component: 'network',
          action: 'fetch',
          metadata: {
            url: args[0],
            duration,
            status: response.status
          }
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Network request failed', error as Error, {
          component: 'network',
          action: 'fetch-error',
          metadata: { url: args[0], duration }
        });
        throw error;
      }
    };
  }

  // Development helpers
  inspect(object: unknown, label?: string): void {
    logger.info('Object inspection', {
      component: 'dev-tools',
      action: 'inspect',
      metadata: { label, object: this.summarizeObject(object) }
    });
  }

  private summarizeObject(obj: unknown, maxDepth = 2, currentDepth = 0): unknown {
    if (currentDepth >= maxDepth) return '[Max Depth]';

    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'function') return '[Function]';

    if (typeof obj === 'string') return obj.length > 50 ? `${obj.slice(0, 50)}...` : obj;

    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return obj.length > 5 ? `[Array(${obj.length})]` : obj.map(item => this.summarizeObject(item, maxDepth, currentDepth + 1));
      }

      if (obj instanceof Map) return `[Map(${obj.size})]`;

      if (obj instanceof Set) return `[Set(${obj.size})]`;

      const keys = Object.keys(obj as object);
      if (keys.length > 5) {
        return `[Object(${keys.length} keys)]`;
      }

      const result: Record<string, unknown> = {};
      for (const key of keys.slice(0, 5)) {
        result[key] = this.summarizeObject((obj as any)[key], maxDepth, currentDepth + 1);
      }
      return result;
    }

    return obj;
  }

  // Component debugging
  traceComponentLifecycle(componentName: string): void {
    logger.info(`Component lifecycle trace: ${componentName}`, {
      component: 'lifecycle',
      action: 'trace',
      metadata: { componentName }
    });
  }

  // Hot reloading helpers
  enableHotReloading(): void {
    if ((import.meta as any).hot) {
      (import.meta as any).hot.accept();

      logger.info('Hot reloading enabled', {
        component: 'dev-tools',
        action: 'hot-reload'
      });
    }
  }

  // Development server utilities
  getDevServerInfo(): {
    url: string;
    hotReload: boolean;
    environment: string;
  } {
    return {
      url: window.location.origin,
      hotReload: !!(import.meta as any).hot,
      environment: (import.meta as any).env?.MODE || 'development'
    };
  }

  // Testing utilities
  createTestHelpers() {
    return {
      waitFor: (condition: () => boolean, timeout = 5000): Promise<void> => {
        return new Promise((resolve, reject) => {
          const startTime = Date.now();

          const check = () => {
            if (condition()) {
              resolve();
            } else if (Date.now() - startTime > timeout) {
              reject(new Error('Timeout waiting for condition'));
            } else {
              requestAnimationFrame(check);
            }
          };

          check();
        });
      },

      triggerEvent: (element: Element, eventName: string, detail?: unknown): void => {
        const event = new CustomEvent(eventName, { detail });
        element.dispatchEvent(event);
      },

      mockFunction: <T extends (...args: any[]) => any>(fn: T): T & { callCount: number; callHistory: Parameters<T>[] } => {
        const mock = ((...args: Parameters<T>) => {
          mock.callCount++;
          mock.callHistory.push(args);
          return fn(...args);
        }) as T & { callCount: number; callHistory: Parameters<T>[] };

        mock.callCount = 0;
        mock.callHistory = [];

        return mock;
      }
    };
  }
}

export const devTools = DevTools.getInstance();

// Global development helpers
declare global {
  interface Window {
    __DEV_TOOLS__: DevTools;
    inspect: (obj: unknown, label?: string) => void;
    profile: (label: string, fn: () => void) => void;
    trace: (componentName: string) => void;
  }
}

// Initialize global helpers
if (typeof window !== 'undefined') {
  window.__DEV_TOOLS__ = devTools;
  window.inspect = (obj, label) => devTools.inspect(obj, label);
  window.profile = (label, fn) => {
    devTools.startProfiling(label);
    fn();
    devTools.endProfiling(label);
  };
  window.trace = (componentName) => devTools.traceComponentLifecycle(componentName);
}