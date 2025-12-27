// Services barrel export
// Provides both singleton instances and factory functions for testability

import { appCache } from './cache';
import { createPoliticalApiService } from './politicalApiService';
import { createSupabaseService } from './supabaseService';
import type { Services } from '../contexts/ServicesContext';

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

/**
 * Creates default production service instances for dependency injection
 * Used by App.tsx to initialize the ServicesProvider
 * Tests can create their own instances with mocks using the factory functions
 */
export function createDefaultServices(): Services {
  // Use the shared app cache instance for all services
  const cache = appCache;

  // Create services using factory functions with shared cache
  const apiService = createPoliticalApiService(cache);
  const dbService = createSupabaseService();

  return {
    politicalApiService: apiService,
    supabaseService: dbService,
    cache,
  };
}
