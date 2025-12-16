// Simple TTL-based in-memory cache
// Used by services for API response caching

import type { ICache, ICacheWithStats, CacheStats } from './interfaces';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class SimpleCache implements ICacheWithStats {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTLMinutes: number;

  constructor(defaultTTLMinutes: number = 5) {
    this.defaultTTLMinutes = defaultTTLMinutes;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ?? this.defaultTTLMinutes;
    const expiresAt = Date.now() + ttl * 60 * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

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
      expired,
    };
  }
}

// Factory function for creating cache instances
export function createCache(defaultTTLMinutes: number = 5): ICache {
  return new SimpleCache(defaultTTLMinutes);
}

// Singleton instance for app use
export const appCache = new SimpleCache(5);
