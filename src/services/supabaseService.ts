// Supabase Service for stonk-data project
// Provides enriched donor, PAC, and media funding data

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { feedCache } from './feedCache';
import type { ICache, ISupabaseService } from './interfaces';
import type {
  SupabaseDonor,
  MediaFunding,
  PacContribution,
  PacContributionDetail,
  PoliticalRecipient,
  Organization,
  DonorMediaNetwork,
  NetworkNode,
  NetworkLink,
} from '../types/supabase';

// Cache TTL in minutes
const CACHE_TTL = {
  donors: 60,
  mediaFunding: 60,
  pacContributions: 30,
  recipients: 60,
  network: 30,
};

export class SupabaseService implements ISupabaseService {
  private static instance: SupabaseService;
  private cache: ICache;
  private cacheTTL: typeof CACHE_TTL;

  constructor(cache: ICache = feedCache, cacheTTL: Partial<typeof CACHE_TTL> = {}) {
    this.cache = cache;
    this.cacheTTL = { ...CACHE_TTL, ...cacheTTL };
  }

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  // ============================================================================
  // Donor Queries
  // ============================================================================

  async getDonors(): Promise<SupabaseDonor[]> {
    if (!this.isConfigured() || !supabase) return [];

    const cacheKey = 'supabase_donors_all';
    const cached = this.cache.get<SupabaseDonor[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .order('net_worth_billions', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Failed to fetch donors:', error);
      return [];
    }

    this.cache.set(cacheKey, data || [], this.cacheTTL.donors);
    return data || [];
  }

  async getDonorById(id: string): Promise<SupabaseDonor | null> {
    if (!this.isConfigured() || !supabase) return null;

    const cacheKey = `supabase_donor_${id}`;
    const cached = this.cache.get<SupabaseDonor>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch donor:', error);
      return null;
    }

    this.cache.set(cacheKey, data, this.cacheTTL.donors);
    return data;
  }

  async searchDonorsByName(name: string): Promise<SupabaseDonor[]> {
    if (!this.isConfigured() || !supabase) return [];

    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .ilike('name', `%${name}%`)
      .order('net_worth_billions', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Failed to search donors:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // Media Funding Queries
  // ============================================================================

  async getMediaFunding(): Promise<MediaFunding[]> {
    if (!this.isConfigured() || !supabase) return [];

    const cacheKey = 'supabase_media_funding_all';
    const cached = this.cache.get<MediaFunding[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('media_funding')
      .select('*')
      .order('outlet_name');

    if (error) {
      console.error('Failed to fetch media funding:', error);
      return [];
    }

    this.cache.set(cacheKey, data || [], this.cacheTTL.mediaFunding);
    return data || [];
  }

  async getMediaFundingByDonor(donorId: string): Promise<MediaFunding[]> {
    if (!this.isConfigured() || !supabase) return [];

    const { data, error } = await supabase
      .from('media_funding')
      .select('*')
      .eq('donor_id', donorId);

    if (error) {
      console.error('Failed to fetch media funding by donor:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // PAC Contribution Queries
  // ============================================================================

  async getPacContributions(): Promise<PacContribution[]> {
    if (!this.isConfigured() || !supabase) return [];

    const cacheKey = 'supabase_pac_contributions_all';
    const cached = this.cache.get<PacContribution[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('pac_contributions')
      .select('*')
      .order('total_spent', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Failed to fetch PAC contributions:', error);
      return [];
    }

    this.cache.set(cacheKey, data || [], this.cacheTTL.pacContributions);
    return data || [];
  }

  async getPacContributionDetails(): Promise<PacContributionDetail[]> {
    if (!this.isConfigured() || !supabase) return [];

    const cacheKey = 'supabase_pac_details_all';
    const cached = this.cache.get<PacContributionDetail[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('pac_contributions_detail')
      .select('*')
      .order('amount', { ascending: false });

    if (error) {
      console.error('Failed to fetch PAC contribution details:', error);
      return [];
    }

    this.cache.set(cacheKey, data || [], this.cacheTTL.pacContributions);
    return data || [];
  }

  async getPacContributionsByRecipient(recipientName: string): Promise<PacContributionDetail[]> {
    if (!this.isConfigured() || !supabase) return [];

    const { data, error } = await supabase
      .from('pac_contributions_detail')
      .select('*')
      .ilike('recipient_name', `%${recipientName}%`)
      .order('amount', { ascending: false });

    if (error) {
      console.error('Failed to fetch PAC contributions by recipient:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // Political Recipient Queries
  // ============================================================================

  async getPoliticalRecipients(): Promise<PoliticalRecipient[]> {
    if (!this.isConfigured() || !supabase) return [];

    const cacheKey = 'supabase_recipients_all';
    const cached = this.cache.get<PoliticalRecipient[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('political_recipients')
      .select('*')
      .order('total_received', { ascending: false });

    if (error) {
      console.error('Failed to fetch political recipients:', error);
      return [];
    }

    this.cache.set(cacheKey, data || [], this.cacheTTL.recipients);
    return data || [];
  }

  // ============================================================================
  // Organization Queries
  // ============================================================================

  async getOrganizations(): Promise<Organization[]> {
    if (!this.isConfigured() || !supabase) return [];

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name');

    if (error) {
      console.error('Failed to fetch organizations:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // Network Graph Data (for D3.js)
  // ============================================================================

  async getDonorMediaNetwork(): Promise<DonorMediaNetwork> {
    if (!this.isConfigured()) {
      return { nodes: [], links: [] };
    }

    const cacheKey = 'supabase_donor_media_network';
    const cached = this.cache.get<DonorMediaNetwork>(cacheKey);
    if (cached) return cached;

    // Fetch donors and media funding in parallel
    const [donors, mediaFunding] = await Promise.all([
      this.getDonors(),
      this.getMediaFunding(),
    ]);

    // Build nodes
    const donorNodes: NetworkNode[] = donors.map(d => ({
      id: d.id,
      name: d.name,
      type: 'donor' as const,
      netWorth: d.net_worth_billions || undefined,
      donorType: d.donor_type,
    }));

    // Get unique media outlets
    const mediaOutlets = new Map<string, NetworkNode>();
    mediaFunding.forEach(mf => {
      if (!mediaOutlets.has(mf.outlet_name)) {
        mediaOutlets.set(mf.outlet_name, {
          id: `media_${mf.outlet_name.toLowerCase().replace(/\s+/g, '_')}`,
          name: mf.outlet_name,
          type: 'media' as const,
          outletType: mf.outlet_type,
          domain: mf.outlet_domain || undefined,
        });
      }
    });

    const mediaNodes = Array.from(mediaOutlets.values());

    // Build links
    const links: NetworkLink[] = mediaFunding.map(mf => ({
      source: mf.donor_id,
      target: `media_${mf.outlet_name.toLowerCase().replace(/\s+/g, '_')}`,
      relationship: mf.relationship_type,
      startYear: mf.start_year || undefined,
      amount: mf.estimated_amount || undefined,
    }));

    const network: DonorMediaNetwork = {
      nodes: [...donorNodes, ...mediaNodes],
      links,
    };

    this.cache.set(cacheKey, network, this.cacheTTL.network);
    return network;
  }

  // ============================================================================
  // Aggregation Queries
  // ============================================================================

  async getContributionsByParty(): Promise<{ party: string; total: number; count: number }[]> {
    if (!this.isConfigured()) return [];

    const details = await this.getPacContributionDetails();

    const partyTotals = new Map<string, { total: number; count: number }>();

    details.forEach(d => {
      const party = d.recipient_party || 'Unknown';
      const existing = partyTotals.get(party) || { total: 0, count: 0 };
      existing.total += d.amount;
      existing.count += 1;
      partyTotals.set(party, existing);
    });

    return Array.from(partyTotals.entries()).map(([party, data]) => ({
      party,
      ...data,
    }));
  }

  async getContributionsByState(): Promise<{ state: string; total: number; count: number }[]> {
    if (!this.isConfigured()) return [];

    const details = await this.getPacContributionDetails();

    const stateTotals = new Map<string, { total: number; count: number }>();

    details.forEach(d => {
      const state = d.recipient_state || 'Unknown';
      const existing = stateTotals.get(state) || { total: 0, count: 0 };
      existing.total += d.amount;
      existing.count += 1;
      stateTotals.set(state, existing);
    });

    return Array.from(stateTotals.entries())
      .map(([state, data]) => ({ state, ...data }))
      .sort((a, b) => b.total - a.total);
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  clearCache(): void {
    // Clear all supabase-related cache entries
    this.cache.delete('supabase_donors_all');
    this.cache.delete('supabase_media_funding_all');
    this.cache.delete('supabase_pac_contributions_all');
    this.cache.delete('supabase_pac_details_all');
    this.cache.delete('supabase_recipients_all');
    this.cache.delete('supabase_donor_media_network');
  }
}

/**
 * Factory function for creating SupabaseService instances
 * Use this for dependency injection in tests
 *
 * @param cache - Cache implementation (defaults to feedCache singleton)
 * @param cacheTTL - Cache TTL overrides
 * @returns New SupabaseService instance
 *
 * @example
 * // In tests:
 * const mockCache = { get: vi.fn(), set: vi.fn(), delete: vi.fn(), ... };
 * const service = createSupabaseService(mockCache);
 */
export function createSupabaseService(
  cache: ICache = feedCache,
  cacheTTL: Partial<typeof CACHE_TTL> = {}
): ISupabaseService {
  return new SupabaseService(cache, cacheTTL);
}

// Export singleton instance for app use
export const supabaseService = SupabaseService.getInstance();
