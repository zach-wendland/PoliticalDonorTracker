// Feed caching service for performance optimization

import type { ICacheWithStats, CacheStats } from './interfaces';
import { RSS_CONFIG } from '../config/api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class FeedCache implements ICacheWithStats {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTLMinutes: number = 15) {
    this.defaultTTL = defaultTTLMinutes * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with optional custom TTL
   */
  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const now = Date.now();
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  /**
   * Check if cache has valid entry for key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired
    };
  }
}

/**
 * Factory function for creating cache instances
 * Use this for dependency injection in tests
 */
export function createCache(defaultTTLMinutes: number = RSS_CONFIG.defaultTTLMinutes): ICacheWithStats {
  return new FeedCache(defaultTTLMinutes);
}

// Singleton instance
export const feedCache = new FeedCache(RSS_CONFIG.defaultTTLMinutes);

// Cleanup expired entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    feedCache.clearExpired();
  }, RSS_CONFIG.cleanupIntervalMinutes * 60 * 1000);
}
