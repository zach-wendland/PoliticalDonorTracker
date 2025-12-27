// Supabase Client Initialization
// Connects to stonk-data project for enriched political donor data

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Warn in development if Supabase credentials are missing
if (import.meta.env.DEV) {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.warn('[Supabase] VITE_SUPABASE_URL not set - Supabase features will be disabled');
  }
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('[Supabase] VITE_SUPABASE_ANON_KEY not set - Supabase features disabled');
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create client only if both URL and anon key are available (prevents crash on missing config)
// Using null when not configured allows the app to still load with degraded functionality
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Check if Supabase is properly configured with required credentials
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
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
