// Service interfaces barrel export
// Use these interfaces for dependency injection and testing

export type { ICache, ICacheWithStats, CacheStats } from './ICache';
export type {
  IPoliticalApiService,
  PoliticalApiConfig,
  ProfileFetchResult,
} from './IPoliticalApiService';
export type {
  ISupabaseService,
  PartyContribution,
  StateContribution,
} from './ISupabaseService';
export type {
  IFeedService,
  FeedResult,
  ProxyConfig,
  RSSItem,
  RSSResponse,
} from './IFeedService';
