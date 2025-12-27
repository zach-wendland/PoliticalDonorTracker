// Comprehensive tests for SimpleCache
// Covers TTL expiration, memory management, and edge cases

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SimpleCache, createCache } from './cache';

describe('SimpleCache', () => {
  let cache: SimpleCache;

  beforeEach(() => {
    cache = createCache(5); // 5 minute TTL
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic operations', () => {
    it('should store and retrieve data', () => {
      cache.set('key1', { data: 'value1' });
      const result = cache.get<{ data: string }>('key1');
      expect(result).toEqual({ data: 'value1' });
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete specific keys', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);

      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });
  });

  describe('TTL (Time-To-Live) expiration', () => {
    it('should return cached data within TTL', () => {
      cache.set('key1', 'value1', 5); // 5 minutes TTL

      // Advance time by 4 minutes
      vi.advanceTimersByTime(4 * 60 * 1000);

      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for expired data', () => {
      cache.set('key1', 'value1', 5); // 5 minutes TTL

      // Advance time by 6 minutes (past expiration)
      vi.advanceTimersByTime(6 * 60 * 1000);

      expect(cache.get('key1')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      const customCache = createCache(10); // 10 minute default TTL
      customCache.set('key1', 'value1'); // No TTL specified, should use default

      // Advance time by 9 minutes (should still be valid)
      vi.advanceTimersByTime(9 * 60 * 1000);
      expect(customCache.get('key1')).toBe('value1');

      // Advance time by 2 more minutes (11 total, past default TTL)
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(customCache.get('key1')).toBeNull();
    });

    it('should support custom TTL per entry', () => {
      cache.set('short', 'value1', 1); // 1 minute TTL
      cache.set('long', 'value2', 10); // 10 minute TTL

      // After 2 minutes, short should expire but long should remain
      vi.advanceTimersByTime(2 * 60 * 1000);

      expect(cache.get('short')).toBeNull();
      expect(cache.get('long')).toBe('value2');
    });

    it('should auto-delete expired entries on access', () => {
      cache.set('key1', 'value1', 5);

      // Get stats before expiration
      let stats = cache.getStats();
      expect(stats.total).toBe(1);
      expect(stats.valid).toBe(1);
      expect(stats.expired).toBe(0);

      // Advance time past expiration
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Access the key (triggers lazy deletion)
      cache.get('key1');

      // Stats should now show zero entries
      stats = cache.getStats();
      expect(stats.total).toBe(0);
      expect(stats.valid).toBe(0);
      expect(stats.expired).toBe(0);
    });
  });

  describe('clearExpired() - Memory leak prevention', () => {
    it('should remove all expired entries', () => {
      // Add multiple entries with different expirations
      cache.set('key1', 'value1', 1); // 1 minute
      cache.set('key2', 'value2', 5); // 5 minutes
      cache.set('key3', 'value3', 10); // 10 minutes

      // Advance time to 6 minutes (key1 and key2 expired)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Before clearExpired(), entries still in memory
      let stats = cache.getStats();
      expect(stats.total).toBe(3);
      expect(stats.valid).toBe(1); // only key3
      expect(stats.expired).toBe(2); // key1 and key2

      // Clear expired entries
      cache.clearExpired();

      // After clearExpired(), only valid entry remains
      stats = cache.getStats();
      expect(stats.total).toBe(1);
      expect(stats.valid).toBe(1);
      expect(stats.expired).toBe(0);
    });

    it('should not remove valid entries', () => {
      cache.set('key1', 'value1', 10);
      cache.set('key2', 'value2', 10);
      cache.set('key3', 'value3', 10);

      // Advance time by 5 minutes (all still valid)
      vi.advanceTimersByTime(5 * 60 * 1000);

      cache.clearExpired();

      // All entries should remain
      const stats = cache.getStats();
      expect(stats.total).toBe(3);
      expect(stats.valid).toBe(3);
      expect(stats.expired).toBe(0);
    });

    it('should handle empty cache gracefully', () => {
      cache.clearExpired();

      const stats = cache.getStats();
      expect(stats.total).toBe(0);
      expect(stats.valid).toBe(0);
      expect(stats.expired).toBe(0);
    });

    it('should free memory when called periodically', () => {
      // Simulate periodic calls (like in main.tsx)
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`, 1); // 1 minute TTL
      }

      expect(cache.getStats().total).toBe(100);

      // Advance time by 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);

      // All entries expired but still in memory
      expect(cache.getStats().expired).toBe(100);

      // Call clearExpired() to free memory
      cache.clearExpired();

      // Memory should be freed
      expect(cache.getStats().total).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('should return accurate statistics', () => {
      cache.set('valid1', 'value1', 10); // Will remain valid
      cache.set('valid2', 'value2', 10); // Will remain valid
      cache.set('expired1', 'value3', 1); // Will expire
      cache.set('expired2', 'value4', 1); // Will expire

      // Advance time to expire some entries
      vi.advanceTimersByTime(2 * 60 * 1000);

      const stats = cache.getStats();
      expect(stats.total).toBe(4);
      expect(stats.valid).toBe(2);
      expect(stats.expired).toBe(2);
    });

    it('should handle all valid entries', () => {
      cache.set('key1', 'value1', 10);
      cache.set('key2', 'value2', 10);

      const stats = cache.getStats();
      expect(stats.total).toBe(2);
      expect(stats.valid).toBe(2);
      expect(stats.expired).toBe(0);
    });

    it('should handle all expired entries', () => {
      cache.set('key1', 'value1', 1);
      cache.set('key2', 'value2', 1);

      vi.advanceTimersByTime(2 * 60 * 1000);

      const stats = cache.getStats();
      expect(stats.total).toBe(2);
      expect(stats.valid).toBe(0);
      expect(stats.expired).toBe(2);
    });
  });

  describe('Edge cases and type safety', () => {
    it('should handle null and undefined values', () => {
      cache.set('null', null);
      cache.set('undefined', undefined);

      expect(cache.get('null')).toBeNull();
      expect(cache.get('undefined')).toBeUndefined();
    });

    it('should handle complex objects', () => {
      const complexObj = {
        nested: { data: [1, 2, 3] },
        func: () => 'test',
        date: new Date(),
      };

      cache.set('complex', complexObj);
      const result = cache.get<typeof complexObj>('complex');

      expect(result).toEqual(complexObj);
    });

    it('should handle overwriting existing keys', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      cache.set('key1', 'value2'); // Overwrite
      expect(cache.get('key1')).toBe('value2');
    });

    it('should handle empty string keys', () => {
      cache.set('', 'empty key value');
      expect(cache.get('')).toBe('empty key value');
    });

    it('should be case-sensitive for keys', () => {
      cache.set('Key', 'value1');
      cache.set('key', 'value2');

      expect(cache.get('Key')).toBe('value1');
      expect(cache.get('key')).toBe('value2');
    });
  });

  describe('Factory function', () => {
    it('should create cache with custom default TTL', () => {
      const customCache = createCache(15);
      customCache.set('key1', 'value1'); // Uses 15 minute default

      vi.advanceTimersByTime(14 * 60 * 1000); // 14 minutes
      expect(customCache.get('key1')).toBe('value1');

      vi.advanceTimersByTime(2 * 60 * 1000); // 16 minutes total
      expect(customCache.get('key1')).toBeNull();
    });

    it('should create isolated cache instances', () => {
      const cache1 = createCache();
      const cache2 = createCache();

      cache1.set('key', 'value1');
      cache2.set('key', 'value2');

      expect(cache1.get('key')).toBe('value1');
      expect(cache2.get('key')).toBe('value2');
    });
  });
});
