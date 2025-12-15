// Services barrel export
// Provides both singleton instances and factory functions for testability

// Interfaces
export type {
  ICache,
  ICacheWithStats,
  CacheStats,
  IPoliticalApiService,
  PoliticalApiConfig,
  ProfileFetchResult,
  ISupabaseService,
  PartyContribution,
  StateContribution,
  IFeedService,
  FeedResult,
  ProxyConfig,
  RSSItem,
  RSSResponse,
} from './interfaces';

// Cache
export { FeedCache, createCache, feedCache } from './feedCache';

// Political API Service
export {
  PoliticalApiService,
  createPoliticalApiService,
  politicalApiService,
} from './politicalApiService';

// Supabase Service
export {
  SupabaseService,
  createSupabaseService,
  supabaseService,
} from './supabaseService';

// Feed Service
export {
  FeedService,
  createFeedService,
  feedService,
} from './feedService';
export type { FeedItem, SourceItem, FeedStatus } from './feedService';
