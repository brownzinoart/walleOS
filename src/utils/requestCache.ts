interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL;
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    // Return cached data if valid
    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Fetch new data
    try {
      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // Return stale cache if available on error
      if (cached) {
        console.warn('Request failed, returning stale cache:', error);
        return cached.data;
      }
      throw error;
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
export const requestCache = new RequestCache();

// Auto-cleanup every 5 minutes
setInterval(
  () => {
    requestCache.cleanup();
  },
  5 * 60 * 1000,
);

// Export factory for creating separate cache instances
export function createRequestCache(defaultTTL = 5 * 60 * 1000): RequestCache {
  return new RequestCache(defaultTTL);
}

export type { CacheEntry };
