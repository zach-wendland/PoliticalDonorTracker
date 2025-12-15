// API configuration constants for Political Donor Tracker services

/**
 * OpenFEC API configuration
 */
export const OPENFEC_CONFIG = {
  baseUrl: 'https://api.open.fec.gov/v1',
  perPage: 20,
  rateLimit: {
    maxCalls: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  },
} as const;

/**
 * Senate Lobbying Disclosure Act (LDA) API configuration
 */
export const SENATE_LDA_CONFIG = {
  baseUrl: 'https://lda.senate.gov/api/v1',
  perPage: 25,
} as const;

/**
 * ProPublica Nonprofit Explorer API configuration
 */
export const PROPUBLICA_CONFIG = {
  baseUrl: 'https://projects.propublica.org/nonprofits/api/v2',
  perPage: 25,
} as const;

/**
 * Aggregated API configuration for all services
 * Used internally by politicalApiService
 */
export const API_CONFIG = {
  openfec: OPENFEC_CONFIG,
  senateLDA: SENATE_LDA_CONFIG,
  propublica: PROPUBLICA_CONFIG,
} as const;

/**
 * Default cache TTL values in minutes for different data types
 */
export const DEFAULT_CACHE_TTL = {
  candidates: 60,     // 1 hour
  committees: 60,     // 1 hour
  contributions: 15,  // 15 minutes
  disbursements: 15,  // 15 minutes
  lobbyists: 30,      // 30 minutes
  nonprofits: 60,     // 1 hour
  profiles: 15,       // 15 minutes
} as const;

/**
 * Type for cache TTL configuration
 */
export type CacheTTLConfig = typeof DEFAULT_CACHE_TTL;

/**
 * Default request timeout in milliseconds
 */
export const DEFAULT_REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * RSS feed configuration
 */
export const RSS_CONFIG = {
  defaultTTLMinutes: 15,
  cleanupIntervalMinutes: 5,
} as const;
