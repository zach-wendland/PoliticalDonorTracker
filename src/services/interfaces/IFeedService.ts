// Feed Service interface for dependency injection
// Enables mocking of RSS feed fetching in tests

import type { FeedItem, SourceItem, FeedStatus } from '../../types';

export interface FeedResult {
  items: FeedItem[];
  status: Record<string | number, FeedStatus>;
  errors: Record<string | number, string>;
}

export interface IFeedService {
  // Fetch feeds from multiple sources
  fetchFeeds(sources: SourceItem[]): Promise<FeedResult>;

  // Cache management
  clearCache(): void;
  clearSourceCache(sourceId: string | number): void;

  // Health management
  resetProxyHealth(): void;
}

// Proxy configuration for feed fetching
export interface ProxyConfig {
  name: string;
  buildUrl: (feedUrl: string) => string;
  parseResponse: (response: Response) => Promise<RSSResponse>;
}

export interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  content?: string;
}

export interface RSSResponse {
  status: string;
  items: RSSItem[];
  message?: string;
}
