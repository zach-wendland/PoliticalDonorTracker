// Centralized feed fetching service with multi-proxy distribution and fallback

import { feedCache } from './feedCache';
import { isValidUrl, parseDate } from '../utils/validators';
import { calculateFreshnessScore } from '../utils/analytics';
import type { FeedItem, SourceItem, RSSItem, RSSResponse, FeedStatus } from '../types';

// Re-export types for consumers
export type { FeedItem, SourceItem, FeedStatus };

export interface FeedResult {
  items: FeedItem[];
  status: Record<string | number, FeedStatus>;
  errors: Record<string | number, string>;
}

// Proxy configuration for load distribution
interface ProxyConfig {
  name: string;
  buildUrl: (feedUrl: string) => string;
  parseResponse: (response: Response) => Promise<RSSResponse>;
}

// Simple XML parser for RSS feeds (used with CORS proxies)
function parseRSSXml(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Extract items using regex (lightweight, no external deps)
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];

    const getTagContent = (tag: string): string | undefined => {
      // Handle CDATA sections
      const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
      const cdataMatch = cdataRegex.exec(itemXml);
      if (cdataMatch) return cdataMatch[1].trim();

      // Handle regular content
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const tagMatch = regex.exec(itemXml);
      return tagMatch ? tagMatch[1].trim() : undefined;
    };

    items.push({
      title: getTagContent('title'),
      link: getTagContent('link'),
      pubDate: getTagContent('pubDate') || getTagContent('dc:date'),
      description: getTagContent('description'),
      content: getTagContent('content:encoded') || getTagContent('content'),
    });
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

export class FeedService {
  private static instance: FeedService;
  private requestCache: Map<string, Promise<FeedItem[]>> = new Map();
  private proxyIndex: number = 0;
  private proxyFailures: Map<string, number> = new Map();

  private constructor() {}

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
    const cached = feedCache.get<FeedResult>(cacheKey);
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
    feedCache.set(cacheKey, result, 15); // 15 minutes

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
    const cached = feedCache.get<FeedItem[]>(cacheKey);
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
          feedCache.set(cacheKey, validItems, 15);
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
    feedCache.clear();
    this.requestCache.clear();
  }

  /**
   * Clear cache for specific source
   */
  clearSourceCache(sourceId: string | number): void {
    feedCache.delete(`feed_${sourceId}`);
  }

  /**
   * Reset proxy failure counts (useful after network recovery)
   */
  resetProxyHealth(): void {
    this.proxyFailures.clear();
  }
}

// Export singleton instance
export const feedService = FeedService.getInstance();
