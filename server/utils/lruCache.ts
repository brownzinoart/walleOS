/**
 * Simple LRU (Least Recently Used) cache implementation
 * Used for caching embeddings, RAG results, and other frequently accessed data
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export interface LRUCacheOptions {
  max: number; // Maximum number of items
  ttl?: number; // Time to live in milliseconds (optional)
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly max: number;
  private readonly ttl: number | undefined;

  constructor(options: LRUCacheOptions) {
    this.cache = new Map();
    this.max = options.max;
    this.ttl = options.ttl ?? undefined;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (this.ttl && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Remove oldest if at capacity
    if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value as K;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (this.ttl && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  prune(): void {
    if (!this.ttl) return;

    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
