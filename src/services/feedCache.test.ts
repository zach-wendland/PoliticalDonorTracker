// FeedCache tests demonstrating service testability
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FeedCache, createCache } from './feedCache';

describe('FeedCache', () => {
  let cache: FeedCache;

  beforeEach(() => {
    cache = new FeedCache(15);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', { data: 'test' });
      expect(cache.get('key1')).toEqual({ data: 'test' });
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete specific keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.delete('key1');
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', () => {
      cache.set('key1', 'value', 1); // 1 minute TTL
      expect(cache.get('key1')).toBe('value');

      // Advance time by 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);

      expect(cache.get('key1')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      cache.set('key1', 'value');
      expect(cache.get('key1')).toBe('value');

      // Advance time by 10 minutes (less than 15 default)
      vi.advanceTimersByTime(10 * 60 * 1000);
      expect(cache.get('key1')).toBe('value');

      // Advance past 15 minutes
      vi.advanceTimersByTime(6 * 60 * 1000);
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear expired entries', () => {
      cache.set('key1', 'value1', 1); // expires in 1 min
      cache.set('key2', 'value2', 10); // expires in 10 min

      vi.advanceTimersByTime(2 * 60 * 1000);

      cache.clearExpired();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });
  });

  describe('statistics', () => {
    it('should report correct stats', () => {
      cache.set('key1', 'value1', 1);
      cache.set('key2', 'value2', 10);

      let stats = cache.getStats();
      expect(stats.total).toBe(2);
      expect(stats.valid).toBe(2);
      expect(stats.expired).toBe(0);

      vi.advanceTimersByTime(2 * 60 * 1000);

      stats = cache.getStats();
      expect(stats.total).toBe(2);
      expect(stats.valid).toBe(1);
      expect(stats.expired).toBe(1);
    });
  });

  describe('factory function', () => {
    it('should create cache with custom TTL', () => {
      const customCache = createCache(5);
      customCache.set('key', 'value');

      vi.advanceTimersByTime(4 * 60 * 1000);
      expect(customCache.get('key')).toBe('value');

      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(customCache.get('key')).toBeNull();
    });
  });
});

describe('Mock Cache for Services', () => {
  it('demonstrates how to mock cache for service tests', () => {
    // Example of creating a mock cache for testing services
    const mockCache = {
      get: vi.fn().mockReturnValue(null),
      set: vi.fn(),
      has: vi.fn().mockReturnValue(false),
      delete: vi.fn(),
      clear: vi.fn(),
    };

    // Simulate cache behavior
    mockCache.get.mockReturnValueOnce({ cached: 'data' });

    expect(mockCache.get('key')).toEqual({ cached: 'data' });
    expect(mockCache.get).toHaveBeenCalledWith('key');

    // This pattern can be used with createPoliticalApiService(mockCache)
    // or createFeedService(mockCache) for isolated testing
  });
});
