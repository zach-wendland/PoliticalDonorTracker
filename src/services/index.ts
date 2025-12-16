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
} from './interfaces';

// Cache
export { SimpleCache, createCache, appCache } from './cache';

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
