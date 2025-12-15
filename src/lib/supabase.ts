// Supabase Client Initialization
// Connects to stonk-data project for enriched political donor data

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment validation
interface EnvironmentValidation {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvironmentValidation {
  const required: string[] = [];
  const optional = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const key of required) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }

  // Check optional vars and warn if missing
  for (const key of optional) {
    if (!import.meta.env[key]) {
      warnings.push(`${key} not set - Supabase features will be disabled`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

// Validate and log warnings in development
const validation = validateEnvironment();
if (import.meta.env.DEV) {
  validation.warnings.forEach(warning => console.warn(`[Supabase] ${warning}`));
  if (!validation.valid) {
    console.error('[Supabase] Missing required environment variables:', validation.missing);
  }
}

// Default URL for the stonk-data project (public, safe to include)
const DEFAULT_SUPABASE_URL = 'https://zgjcdrpcdnommxtahdpr.supabase.co';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create client (will be non-functional without anon key)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if Supabase is properly configured with required credentials
 */
export function isSupabaseConfigured(): boolean {
  return !!supabaseAnonKey;
}

/**
 * Get environment status for debugging/display
 */
export function getSupabaseStatus(): {
  configured: boolean;
  url: string;
  hasKey: boolean;
} {
  return {
    configured: isSupabaseConfigured(),
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
  };
}
