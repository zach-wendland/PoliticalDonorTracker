// Comprehensive tests for PoliticalApiService
// Covers API calls, caching, rate limiting, and error handling

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createPoliticalApiService, type IPoliticalApiService } from './politicalApiService';
import { createCache, type SimpleCache } from './cache';

describe('PoliticalApiService', () => {
  let service: IPoliticalApiService;
  let cache: SimpleCache;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create fresh cache for each test
    cache = createCache(5);

    // Mock fetch globally
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Create service with mocked cache
    service = createPoliticalApiService(cache, {
      openfecApiKey: 'TEST_API_KEY',
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Rate limiting', () => {
    it('should track API calls', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const initialStatus = service.getApiStatus();
      expect(initialStatus.openfec.remainingCalls).toBe(1000);
      expect(initialStatus.openfec.available).toBe(true);

      await service.searchCandidates({ q: 'test' });

      const afterStatus = service.getApiStatus();
      expect(afterStatus.openfec.remainingCalls).toBe(999);
      expect(afterStatus.openfec.available).toBe(true);
    });

    it('should respect rate limits', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      // Make 1000 calls to hit the limit
      for (let i = 0; i < 1000; i++) {
        await service.searchCandidates({ q: `test${i}` });
      }

      // Should be rate limited now
      const finalStatus = service.getApiStatus();
      expect(finalStatus.openfec.remainingCalls).toBe(0);
      expect(finalStatus.openfec.available).toBe(false);
      expect(finalStatus.openfec.error).toBe('Rate limit exceeded');
    });

    it('should reset rate limit after window expires', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      // Make a call
      await service.searchCandidates({ q: 'test' });
      expect(service.getApiStatus().openfec.remainingCalls).toBe(999);

      // Advance time past rate limit window (1 hour)
      vi.advanceTimersByTime(61 * 60 * 1000);

      // Status should reset
      const status = service.getApiStatus();
      expect(status.openfec.remainingCalls).toBe(1000);
      expect(status.openfec.available).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache API responses', async () => {
      const mockData = { results: [{ id: '1', name: 'Test Candidate' }] };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // First call - hits API
      const result1 = await service.searchCandidates({ q: 'test' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result1.results).toEqual(mockData.results);

      // Second call - should hit cache
      const result2 = await service.searchCandidates({ q: 'test' });
      expect(fetchMock).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2.results).toEqual(mockData.results);
    });

    it('should generate unique cache keys for different queries', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await service.searchCandidates({ q: 'test1' });
      await service.searchCandidates({ q: 'test2' });

      // Both should make API calls (different cache keys)
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should respect cache TTL', async () => {
      // Create service with custom short TTL for testing
      const testCache = createCache();
      const testService = createPoliticalApiService(testCache, {
        openfecApiKey: 'TEST_API_KEY',
        cacheTTL: {
          candidates: 5, // 5 minute TTL for testing
        },
      });

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      // First call - hits API
      await testService.searchCandidates({ q: 'test' });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second call within TTL - uses cache
      await testService.searchCandidates({ q: 'test' });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Advance time past cache TTL (6 minutes > 5 minute TTL)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Third call - cache expired (lazy deletion on access), hits API again
      await testService.searchCandidates({ q: 'test' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should clear cache when requested', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await service.searchCandidates({ q: 'test' });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      service.clearCache();

      await service.searchCandidates({ q: 'test' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(service.searchCandidates({ q: 'test' })).rejects.toThrow('Network error');
    });

    it('should handle API errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.searchCandidates({ q: 'test' })).rejects.toThrow();
    });

    it('should handle invalid JSON responses', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(service.searchCandidates({ q: 'test' })).rejects.toThrow('Invalid JSON');
    });

    it('should handle 429 rate limit errors from API', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(service.searchCandidates({ q: 'test' })).rejects.toThrow();
    });
  });

  describe('searchCandidates()', () => {
    it('should search candidates with query', async () => {
      const mockData = {
        results: [
          { candidate_id: 'C001', name: 'John Doe', party: 'DEM' },
          { candidate_id: 'C002', name: 'Jane Smith', party: 'REP' },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await service.searchCandidates({ q: 'John' });

      expect(result.results).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/candidates/search/'),
        expect.any(Object)
      );
    });

    it('should filter by state', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await service.searchCandidates({ q: 'test', state: 'CA' });

      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('state=CA');
    });

    it('should filter by party', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await service.searchCandidates({ q: 'test', party: 'DEM' });

      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('party=DEM');
    });
  });

  describe('searchCommittees()', () => {
    it('should search committees', async () => {
      const mockData = {
        results: [
          { committee_id: 'C001', name: 'Test PAC' },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await service.searchCommittees({ q: 'PAC' });

      expect(result.results).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/committees/'),
        expect.any(Object)
      );
    });
  });

  describe('searchContributions()', () => {
    it('should search contributions', async () => {
      const mockData = {
        results: [
          { contributor_name: 'John Doe', contribution_receipt_amount: 1000 },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await service.searchContributions({ contributor_name: 'John Doe' });

      expect(result.results).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/schedules/schedule_a/'),
        expect.any(Object)
      );
    });
  });

  describe('Profile fetching', () => {
    it('should fetch donor profile', async () => {
      // Mock both candidates and committees searches
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{ name: 'John Doe', party: 'DEM' }],
          }),
        });

      const result = await service.fetchDonorProfile('John Doe');

      expect(result.source).toBe('api');
      expect(result.data).toBeDefined();
    });

    it('should fetch recipient profile', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ name: 'Test Committee' }],
        }),
      });

      const result = await service.fetchRecipientProfile('Test Committee');

      expect(result.source).toBe('api');
      expect(result.data).toBeDefined();
    });

    it('should fetch lobbyist profile', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ registrant_name: 'Test Lobbyist' }],
        }),
      });

      const result = await service.fetchLobbyistProfile('Test Lobbyist');

      expect(result.source).toBe('api');
      expect(result.data).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should use provided API key', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await service.searchCandidates({ q: 'test' });

      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('api_key=TEST_API_KEY');
    });

    it('should fall back to DEMO_KEY when no key provided', async () => {
      const serviceNoKey = createPoliticalApiService(cache, {});

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await serviceNoKey.searchCandidates({ q: 'test' });

      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('api_key=DEMO_KEY');
    });
  });

  describe('Dependency injection', () => {
    it('should use provided cache instance', async () => {
      const customCache = createCache(10);
      const customService = createPoliticalApiService(customCache);

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await customService.searchCandidates({ q: 'test' });

      // Verify cache was used
      const stats = customCache.getStats();
      expect(stats.total).toBeGreaterThan(0);
    });

    it('should be testable with mock cache', async () => {
      const mockCache = {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
        has: vi.fn().mockReturnValue(false),
        delete: vi.fn(),
        clear: vi.fn(),
        clearExpired: vi.fn(),
        getStats: vi.fn().mockReturnValue({ total: 0, valid: 0, expired: 0 }),
      } as unknown as SimpleCache;

      const mockableService = createPoliticalApiService(mockCache);

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await mockableService.searchCandidates({ q: 'test' });

      expect(mockCache.get).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });
  });
});
