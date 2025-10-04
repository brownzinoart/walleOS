/**
 * Advanced caching system for A+ performance optimization
 */

import { logger } from './logger';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  metadata?: Record<string, unknown>;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  maxMemory?: number; // Maximum memory usage in bytes
  compressionThreshold?: number; // Compress values above this size
  enableMetrics?: boolean;
  enableCompression?: boolean;
  storage?: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  keyPrefix?: string;
  enablePersistence?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  memoryUsage: number;
  compressionRatio: number;
}

export class AdvancedCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    hitRate: 0,
    memoryUsage: 0,
    compressionRatio: 1,
  };

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize ?? 1000,
      maxMemory: options.maxMemory ?? 50 * 1024 * 1024, // 50MB default
      compressionThreshold: options.compressionThreshold ?? 1024, // 1KB
      enableMetrics: options.enableMetrics ?? true,
      enableCompression: options.enableCompression ?? false,
      storage: options.storage ?? 'memory',
      keyPrefix: options.keyPrefix ?? 'cache:',
      enablePersistence: options.enablePersistence ?? false,
      ...options,
    };

    if (this.options.enablePersistence && this.options.storage !== 'memory') {
      this.loadFromStorage().catch(error => {
        logger.warn('Failed to load cache from storage', error);
      });
    }

    // Start cleanup interval
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, Math.min(this.options.ttl / 4, 60000)); // Cleanup at most every minute
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, entry] of this.cache) {
      totalSize += this.estimateSize(key) + this.estimateSize(entry.value);
      if (entry.metadata) {
        totalSize += this.estimateSize(entry.metadata);
      }
    }
    return totalSize;
  }

  private estimateSize(value: unknown): number {
    if (value === null || value === undefined) return 0;

    switch (typeof value) {
      case 'string':
        return value.length * 2; // UTF-16 characters
      case 'number':
        return 8;
      case 'boolean':
        return 1;
      case 'object':
        return this.estimateObjectSize(value);
      default:
        return 0;
    }
  }

  private estimateObjectSize(obj: object): number {
    let size = 0;

    if (obj instanceof Map || obj instanceof Set) {
      size += 32; // Map/Set overhead
      for (const [key, value] of obj instanceof Map ? obj : obj instanceof Set ? obj.entries() : []) {
        size += this.estimateSize(key) + this.estimateSize(value);
      }
    } else if (obj instanceof Array) {
      size += 8; // Array overhead
      for (const item of obj) {
        size += this.estimateSize(item);
      }
    } else {
      size += 8; // Object overhead
      for (const [key, value] of Object.entries(obj)) {
        size += this.estimateSize(key) + this.estimateSize(value);
      }
    }

    return size;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
    }
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));

    // Evict entries if we're over capacity
    while (this.cache.size > this.options.maxSize) {
      this.evictLRU();
    }

    const memoryUsage = this.calculateMemoryUsage();
    while (memoryUsage > this.options.maxMemory && this.cache.size > 0) {
      this.evictLRU();
    }

    if (this.options.enablePersistence && this.options.storage !== 'memory') {
      await this.saveToStorage();
    }

    logger.debug('Cache cleanup completed', {
      component: 'cache',
      action: 'cleanup',
      metadata: {
        entriesRemoved: toDelete.length,
        currentSize: this.cache.size,
        memoryUsage
      }
    });
  }

  private async saveToStorage(): Promise<void> {
    if (this.options.storage === 'memory') return;

    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        timestamp: Date.now(),
        version: '1.0'
      };

      const serialized = JSON.stringify(data);

      switch (this.options.storage) {
        case 'localStorage':
          localStorage.setItem(this.options.keyPrefix + 'data', serialized);
          break;
        case 'sessionStorage':
          sessionStorage.setItem(this.options.keyPrefix + 'data', serialized);
          break;
        case 'indexedDB':
          await this.saveToIndexedDB(serialized);
          break;
      }
    } catch (error) {
      logger.warn('Failed to save cache to storage', error as Error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    if (this.options.storage === 'memory') return;

    try {
      let data: string | null = null;

      switch (this.options.storage) {
        case 'localStorage':
          data = localStorage.getItem(this.options.keyPrefix + 'data');
          break;
        case 'sessionStorage':
          data = sessionStorage.getItem(this.options.keyPrefix + 'data');
          break;
        case 'indexedDB':
          data = await this.loadFromIndexedDB();
          break;
      }

      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.entries && Array.isArray(parsed.entries)) {
          this.cache = new Map(parsed.entries);
          logger.info('Cache loaded from storage', {
            component: 'cache',
            action: 'load',
            metadata: { entriesLoaded: this.cache.size }
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to load cache from storage', error as Error);
    }
  }

  private async saveToIndexedDB(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WalleOSCache', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');

        store.put({ id: 'main', data, timestamp: Date.now() });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('cache', { keyPath: 'id' });
      };
    });
  }

  private async loadFromIndexedDB(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WalleOSCache', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const getRequest = store.get('main');

        getRequest.onsuccess = () => resolve(getRequest.result?.data || null);
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.metrics.hits++;
    this.updateHitRate();

    logger.debug('Cache hit', {
      component: 'cache',
      action: 'get',
      metadata: { key, accessCount: entry.accessCount }
    });

    return entry.value;
  }

  async set(key: string, value: T, customTTL?: number, metadata?: Record<string, unknown>): Promise<void> {
    const ttl = customTTL ?? this.options.ttl;

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      metadata,
    };

    this.cache.set(key, entry);
    this.metrics.sets++;

    logger.debug('Cache set', {
      component: 'cache',
      action: 'set',
      metadata: { key, ttl, size: this.estimateSize(value) }
    });

    // Trigger cleanup if needed
    if (this.cache.size > this.options.maxSize) {
      await this.cleanup();
    }
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.metrics.deletes++;
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      memoryUsage: 0,
      compressionRatio: 1,
    };

    if (this.options.enablePersistence && this.options.storage !== 'memory') {
      try {
        switch (this.options.storage) {
          case 'localStorage':
            localStorage.removeItem(this.options.keyPrefix + 'data');
            break;
          case 'sessionStorage':
            sessionStorage.removeItem(this.options.keyPrefix + 'data');
            break;
          case 'indexedDB':
            await this.clearIndexedDB();
            break;
        }
      } catch (error) {
        logger.warn('Failed to clear cache from storage', error as Error);
      }
    }
  }

  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WalleOSCache', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
    this.metrics.memoryUsage = this.calculateMemoryUsage();
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getStats(): {
    size: number;
    memoryUsage: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldestEntry === null || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      if (newestEntry === null || entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      memoryUsage: this.calculateMemoryUsage(),
      oldestEntry,
      newestEntry,
    };
  }

  // Advanced cache operations
  async getOrSet<U extends T>(
    key: string,
    factory: () => Promise<U> | U,
    customTTL?: number,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const cached = await this.get(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, customTTL, metadata);
    return value;
  }

  async invalidatePattern(pattern: RegExp): Promise<number> {
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async getKeys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }
}

// Global cache instances
export const componentCache = new AdvancedCache<HTMLElement>({
  ttl: 10 * 60 * 1000, // 10 minutes for components
  maxSize: 100,
  enablePersistence: true,
  storage: 'memory',
});

export const contentCache = new AdvancedCache<string>({
  ttl: 30 * 60 * 1000, // 30 minutes for content
  maxSize: 500,
  enablePersistence: true,
  storage: 'memory',
});

export const apiCache = new AdvancedCache<unknown>({
  ttl: 5 * 60 * 1000, // 5 minutes for API responses
  maxSize: 200,
  enablePersistence: false,
});

// Cache decorator for functions
export function cached<T extends (...args: any[]) => any>(
  cache: AdvancedCache,
  options?: {
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
    metadata?: Record<string, unknown>;
  }
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const keyGenerator = options?.keyGenerator || ((...args: Parameters<T>) => `${propertyKey}:${JSON.stringify(args)}`);
      const cacheKey = keyGenerator(...args);

      return cache.getOrSet(cacheKey, () => originalMethod.apply(this, args), options?.ttl, options?.metadata);
    };

    return descriptor;
  };
}

// Cache utility functions for common patterns
export const createCachedFunction = <TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult> | TResult,
  options?: {
    ttl?: number;
    keyGenerator?: (...args: TArgs) => string;
    metadata?: Record<string, unknown>;
  }
): ((...args: TArgs) => Promise<TResult>) => {
  const cacheKeyGenerator = options?.keyGenerator || ((...args: TArgs) => JSON.stringify(args));

  return async (...args: TArgs): Promise<TResult> => {
    const cacheKey = cacheKeyGenerator(...args);
    const result = await apiCache.getOrSet(cacheKey, () => Promise.resolve(fn(...args)), options?.ttl, options?.metadata);
    return result as TResult;
  };
};

// Memory-efficient cache warming
export const warmCache = async <T>(
  cache: AdvancedCache<T>,
  keys: string[],
  fetcher: (key: string) => Promise<T>
): Promise<void> => {
  const promises = keys.map(async (key) => {
    try {
      const value = await fetcher(key);
      await cache.set(key, value);
    } catch (error) {
      logger.warn(`Failed to warm cache for key: ${key}`, error as Error);
    }
  });

  await Promise.allSettled(promises);
};