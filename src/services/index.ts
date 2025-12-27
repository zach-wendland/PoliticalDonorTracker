// Services barrel export
// Provides both singleton instances and factory functions for testability

// Cache
export {
  SimpleCache,
  createCache,
  appCache,
  type CacheStats,
} from './cache';

// Political API Service
export {
  PoliticalApiService,
  createPoliticalApiService,
  politicalApiService,
  type IPoliticalApiService,
  type PoliticalApiConfig,
  type ProfileFetchResult,
} from './politicalApiService';

// Supabase Service
export {
  SupabaseService,
  createSupabaseService,
  supabaseService,
  type ISupabaseService,
  type PartyContribution,
  type StateContribution,
} from './supabaseService';
