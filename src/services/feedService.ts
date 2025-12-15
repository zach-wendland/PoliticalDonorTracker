// Centralized feed fetching service with multi-proxy distribution and fallback

import { feedCache } from './feedCache';
import { isValidUrl, parseDate } from '../utils/validators';
import { calculateFreshnessScore } from '../utils/analytics';
import type { ICache, IFeedService, FeedResult } from './interfaces';
import type { FeedItem, SourceItem, RSSItem, RSSResponse, FeedStatus } from '../types';

// Re-export types for consumers
export type { FeedItem, SourceItem, FeedStatus, FeedResult };

// Proxy configuration for load distribution
interface ProxyConfig {
  name: string;
  buildUrl: (feedUrl: string) => string;
  parseResponse: (response: Response) => Promise<RSSResponse>;
}

// XML parser for RSS feeds using browser-native DOMParser
// More robust and secure than regex parsing
function parseRSSXml(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.warn('RSS XML parse error:', parseError.textContent);
      return [];
    }

    // Find all <item> elements (RSS 2.0) or <entry> elements (Atom)
    const itemElements = doc.querySelectorAll('item, entry');

    itemElements.forEach((itemEl) => {
      // Helper to get text content from a child element
      const getElementText = (tagNames: string[]): string | undefined => {
        for (const tagName of tagNames) {
          // Try with namespace prefix first, then without
          let el = itemEl.querySelector(tagName);
          if (!el) {
            // Try getElementsByTagNameNS for namespaced elements
            const parts = tagName.split(':');
            if (parts.length === 2) {
              const localName = parts[1];
              const children = Array.from(itemEl.children);
              el = children.find(child =>
                child.localName === localName || child.tagName === tagName
              ) || null;
            }
          }
          if (el && el.textContent) {
            return el.textContent.trim();
          }
        }
        return undefined;
      };

      const title = getElementText(['title']);
      const link = getElementText(['link', 'guid']) ||
        itemEl.querySelector('link')?.getAttribute('href'); // Atom format
      const pubDate = getElementText(['pubDate', 'dc:date', 'published', 'updated']);
      const description = getElementText(['description', 'summary']);
      const content = getElementText(['content:encoded', 'content', 'content:content']);

      items.push({
        title,
        link: link || undefined,
        pubDate,
        description,
        content,
      });
    });
  } catch (error) {
    console.warn('RSS XML parsing failed:', error);
    return [];
  }

  return items;
}

// Available proxy configurations
const RSS_PROXIES: ProxyConfig[] = [
  {
    name: 'rss2json',
    buildUrl: (feedUrl) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`,
    parseResponse: async (response) => {
      const data = await response.json();
      return data as RSSResponse;
    }
  },
  {
    name: 'allorigins',
    buildUrl: (feedUrl) => `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
    parseResponse: async (response) => {
      const text = await response.text();
      const items = parseRSSXml(text);
      return {
        status: items.length > 0 ? 'ok' : 'error',
        items,
        message: items.length === 0 ? 'No items parsed from XML' : undefined
      };
    }
  },
  {
    name: 'corsproxy',
    buildUrl: (feedUrl) => `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`,
    parseResponse: async (response) => {
      const text = await response.text();
      const items = parseRSSXml(text);
      return {
        status: items.length > 0 ? 'ok' : 'error',
        items,
        message: items.length === 0 ? 'No items parsed from XML' : undefined
      };
    }
  }
];

export class FeedService implements IFeedService {
  private static instance: FeedService;
  private cache: ICache;
  private requestCache: Map<string, Promise<FeedItem[]>> = new Map();
  private proxyIndex: number = 0;
  private proxyFailures: Map<string, number> = new Map();
  private cacheTTLMinutes: number;

  constructor(cache: ICache = feedCache, cacheTTLMinutes: number = 15) {
    this.cache = cache;
    this.cacheTTLMinutes = cacheTTLMinutes;
  }

  static getInstance(): FeedService {
    if (!FeedService.instance) {
      FeedService.instance = new FeedService();
    }
    return FeedService.instance;
  }

  /**
   * Get next proxy using round-robin with failure awareness
   */
  private getNextProxy(): ProxyConfig {
    // Find a proxy that hasn't failed too many times recently
    const maxAttempts = RSS_PROXIES.length;

    for (let i = 0; i < maxAttempts; i++) {
      const proxy = RSS_PROXIES[this.proxyIndex];
      this.proxyIndex = (this.proxyIndex + 1) % RSS_PROXIES.length;

      const failures = this.proxyFailures.get(proxy.name) || 0;
      // Skip proxies with 3+ recent failures, but always try if all are failing
      if (failures < 3 || i === maxAttempts - 1) {
        return proxy;
      }
    }

    return RSS_PROXIES[0]; // Fallback to first proxy
  }

  /**
   * Record proxy success - reset failure count
   */
  private recordProxySuccess(proxyName: string): void {
    this.proxyFailures.set(proxyName, 0);
  }

  /**
   * Record proxy failure - increment failure count
   */
  private recordProxyFailure(proxyName: string): void {
    const current = this.proxyFailures.get(proxyName) || 0;
    this.proxyFailures.set(proxyName, current + 1);
  }

  /**
   * Fetch feeds from multiple sources with caching and load distribution
   */
  async fetchFeeds(sources: SourceItem[]): Promise<FeedResult> {
    const cacheKey = `feeds_${sources.map(s => s.id).join('_')}`;

    // Check cache first
    const cached = this.cache.get<FeedResult>(cacheKey);
    if (cached) {
      console.log('Serving from cache:', cacheKey);
      return cached;
    }

    const newStatus: Record<string | number, FeedStatus> = {};
    const errors: Record<string | number, string> = {};

    // Fetch all feeds in parallel with distributed proxies
    const promises = sources.map(source => this.fetchSingleFeed(source, newStatus, errors));
    const results = await Promise.all(promises);

    // Flatten and sort
    const allItems = results.flat();
    allItems.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    const result: FeedResult = {
      items: allItems,
      status: newStatus,
      errors
    };

    // Cache the result
    this.cache.set(cacheKey, result, this.cacheTTLMinutes);

    return result;
  }

  /**
   * Fetch a single feed source with automatic fallback
   */
  private async fetchSingleFeed(
    source: SourceItem,
    statusMap: Record<string | number, FeedStatus>,
    errorMap: Record<string | number, string>
  ): Promise<FeedItem[]> {
    const cacheKey = `feed_${source.id}`;

    // Check cache for individual feed
    const cached = this.cache.get<FeedItem[]>(cacheKey);
    if (cached) {
      statusMap[source.id] = 'ok';
      return cached;
    }

    // Check if there's already a pending request for this feed
    const pendingRequest = this.requestCache.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request with fallback support
    const request = this._fetchFeedWithFallback(source, statusMap, errorMap, cacheKey);
    this.requestCache.set(cacheKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      // Clean up pending request
      this.requestCache.delete(cacheKey);
    }
  }

  /**
   * Fetch feed with automatic fallback to alternate proxies
   */
  private async _fetchFeedWithFallback(
    source: SourceItem,
    statusMap: Record<string | number, FeedStatus>,
    errorMap: Record<string | number, string>,
    cacheKey: string
  ): Promise<FeedItem[]> {
    statusMap[source.id] = 'loading';

    // Try each proxy until one succeeds
    const triedProxies = new Set<string>();
    let lastError = '';

    for (let attempt = 0; attempt < RSS_PROXIES.length; attempt++) {
      const proxy = this.getNextProxy();

      // Skip if we already tried this proxy
      if (triedProxies.has(proxy.name)) {
        continue;
      }
      triedProxies.add(proxy.name);

      try {
        const result = await this._fetchWithProxy(source, proxy, cacheKey);
        if (result.length > 0) {
          statusMap[source.id] = 'ok';
          this.recordProxySuccess(proxy.name);
          return result;
        }
        lastError = `${proxy.name}: No items`;
      } catch (error) {
        this.recordProxyFailure(proxy.name);
        lastError = `${proxy.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.warn(`Proxy ${proxy.name} failed for ${source.name}:`, lastError);
        // Continue to next proxy
      }
    }

    // All proxies failed
    statusMap[source.id] = 'error';
    errorMap[source.id] = lastError.substring(0, 50);
    return [];
  }

  /**
   * Fetch feed using a specific proxy
   */
  private async _fetchWithProxy(
    source: SourceItem,
    proxy: ProxyConfig,
    cacheKey: string
  ): Promise<FeedItem[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const apiUrl = proxy.buildUrl(source.url);
      const response = await fetch(apiUrl, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await proxy.parseResponse(response);

      if (data.status === 'ok' && data.items && data.items.length > 0) {
        const validItems = data.items
          .filter(item => item.title && item.link && item.pubDate)
          .map((item: RSSItem, index: number) => {
            const pubDate = parseDate(item.pubDate);

            if (!pubDate || !isValidUrl(item.link || '')) {
              return null;
            }

            return {
              id: `${source.id}-${index}`,
              title: item.title || 'Untitled',
              source: source.name,
              topic: source.topic_map || 'General',
              time: pubDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }),
              rawDate: pubDate,
              url: item.link,
              velocity: calculateFreshnessScore(pubDate),
              category: source.category
            };
          })
          .filter((item): item is FeedItem => item !== null);

        // Cache individual feed result
        if (validItems.length > 0) {
          this.cache.set(cacheKey, validItems, this.cacheTTLMinutes);
        }

        return validItems;
      } else {
        throw new Error(data.message || 'No items returned');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Force refresh by clearing cache
   */
  clearCache(): void {
    this.cache.clear();
    this.requestCache.clear();
  }

  /**
   * Clear cache for specific source
   */
  clearSourceCache(sourceId: string | number): void {
    this.cache.delete(`feed_${sourceId}`);
  }

  /**
   * Reset proxy failure counts (useful after network recovery)
   */
  resetProxyHealth(): void {
    this.proxyFailures.clear();
  }
}

/**
 * Factory function for creating FeedService instances
 * Use this for dependency injection in tests
 *
 * @param cache - Cache implementation (defaults to feedCache singleton)
 * @param cacheTTLMinutes - Cache TTL in minutes (defaults to 15)
 * @returns New FeedService instance
 *
 * @example
 * // In tests:
 * const mockCache = { get: vi.fn(), set: vi.fn(), clear: vi.fn(), ... };
 * const service = createFeedService(mockCache, 5);
 */
export function createFeedService(
  cache: ICache = feedCache,
  cacheTTLMinutes: number = 15
): IFeedService {
  return new FeedService(cache, cacheTTLMinutes);
}

// Export singleton instance for app use
export const feedService = FeedService.getInstance();
