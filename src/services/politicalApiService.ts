// Political Finance API Service
// Handles OpenFEC, Senate LDA, and ProPublica Nonprofit APIs

import { feedCache } from './feedCache';
import type {
  FECCandidate,
  FECCommittee,
  FECContribution,
  FECDisbursement,
  FECIndependentExpenditure,
  FECApiResponse,
  LDAFiling,
  LDAApiResponse,
  NonprofitOrganization,
  NonprofitSearchResponse,
  DonorProfile,
  LobbyistProfile,
  RecipientProfile,
  PoliticalApiStatus,
  CandidateSearchParams,
  CommitteeSearchParams,
  ContributionSearchParams,
  LobbyistSearchParams,
  NonprofitSearchParams,
} from '../types/political';

import {
  SAMPLE_DONORS,
  SAMPLE_LOBBYISTS,
  SAMPLE_RECIPIENTS,
} from '../config/politicalFinanceSources';

// API Configuration
const API_CONFIG = {
  openfec: {
    baseUrl: 'https://api.open.fec.gov/v1',
    perPage: 20,
    rateLimit: { maxCalls: 1000, windowMs: 60 * 60 * 1000 }, // 1000/hour
  },
  senateLDA: {
    baseUrl: 'https://lda.senate.gov/api/v1',
    perPage: 25,
  },
  propublica: {
    baseUrl: 'https://projects.propublica.org/nonprofits/api/v2',
    perPage: 25,
  },
};

// Cache TTL in minutes
const CACHE_TTL = {
  candidates: 60,
  committees: 60,
  contributions: 15,
  disbursements: 15,
  lobbyists: 30,
  nonprofits: 60,
  profiles: 15,
};

export class PoliticalApiService {
  private static instance: PoliticalApiService;
  private requestCache: Map<string, Promise<unknown>> = new Map();
  private rateLimitCalls: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PoliticalApiService {
    if (!PoliticalApiService.instance) {
      PoliticalApiService.instance = new PoliticalApiService();
    }
    return PoliticalApiService.instance;
  }

  // ============================================================================
  // API Status & Rate Limiting
  // ============================================================================

  private getApiKey(): string {
    return import.meta.env.VITE_OPENFEC_API_KEY || 'DEMO_KEY';
  }

  private hasApiKey(): boolean {
    return !!import.meta.env.VITE_OPENFEC_API_KEY;
  }

  private trackApiCall(provider: string): void {
    const now = Date.now();
    const calls = this.rateLimitCalls.get(provider) || [];

    // Filter out calls outside the window
    const config = API_CONFIG.openfec.rateLimit;
    const recentCalls = calls.filter(t => now - t < config.windowMs);
    recentCalls.push(now);

    this.rateLimitCalls.set(provider, recentCalls);
  }

  private getRemainingCalls(provider: string): number {
    const now = Date.now();
    const calls = this.rateLimitCalls.get(provider) || [];
    const config = API_CONFIG.openfec.rateLimit;
    const recentCalls = calls.filter(t => now - t < config.windowMs);
    return config.maxCalls - recentCalls.length;
  }

  private isRateLimited(provider: string): boolean {
    return this.getRemainingCalls(provider) <= 0;
  }

  getApiStatus(): PoliticalApiStatus {
    const openfecRemaining = this.getRemainingCalls('openfec');

    return {
      openfec: {
        available: this.hasApiKey() && !this.isRateLimited('openfec'),
        remainingCalls: openfecRemaining,
        error: !this.hasApiKey() ? 'API key not configured' :
               this.isRateLimited('openfec') ? 'Rate limit exceeded' : undefined,
      },
      senateLDA: {
        available: true, // No key required
      },
      propublica: {
        available: true, // No key required
      },
    };
  }

  // ============================================================================
  // Generic Fetch Helper
  // ============================================================================

  private async fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 10000
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchWithCache<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttlMinutes: number
  ): Promise<T> {
    // Check cache
    const cached = feedCache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check for pending request (deduplication)
    const pending = this.requestCache.get(cacheKey) as Promise<T> | undefined;
    if (pending) {
      return pending;
    }

    // Create new request
    const request = fetcher();
    this.requestCache.set(cacheKey, request);

    try {
      const result = await request;
      feedCache.set(cacheKey, result, ttlMinutes);
      return result;
    } finally {
      this.requestCache.delete(cacheKey);
    }
  }

  // ============================================================================
  // OpenFEC API Methods
  // ============================================================================

  private buildOpenFECUrl(endpoint: string, params: object): string {
    const url = new URL(`${API_CONFIG.openfec.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.getApiKey());
    url.searchParams.set('per_page', String(API_CONFIG.openfec.perPage));

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  async searchCandidates(params: CandidateSearchParams): Promise<FECApiResponse<FECCandidate>> {
    if (this.isRateLimited('openfec')) {
      throw new Error('OpenFEC rate limit exceeded');
    }

    const cacheKey = `fec_candidates_${JSON.stringify(params)}`;

    return this.fetchWithCache(cacheKey, async () => {
      this.trackApiCall('openfec');
      const url = this.buildOpenFECUrl('/candidates/search/', params);
      return this.fetchWithTimeout<FECApiResponse<FECCandidate>>(url);
    }, CACHE_TTL.candidates);
  }

  async searchCommittees(params: CommitteeSearchParams): Promise<FECApiResponse<FECCommittee>> {
    if (this.isRateLimited('openfec')) {
      throw new Error('OpenFEC rate limit exceeded');
    }

    const cacheKey = `fec_committees_${JSON.stringify(params)}`;

    return this.fetchWithCache(cacheKey, async () => {
      this.trackApiCall('openfec');
      const url = this.buildOpenFECUrl('/committees/', params);
      return this.fetchWithTimeout<FECApiResponse<FECCommittee>>(url);
    }, CACHE_TTL.committees);
  }

  async searchContributions(params: ContributionSearchParams): Promise<FECApiResponse<FECContribution>> {
    if (this.isRateLimited('openfec')) {
      throw new Error('OpenFEC rate limit exceeded');
    }

    const cacheKey = `fec_contributions_${JSON.stringify(params)}`;

    return this.fetchWithCache(cacheKey, async () => {
      this.trackApiCall('openfec');
      const url = this.buildOpenFECUrl('/schedules/schedule_a/', {
        ...params,
        sort: params.sort || '-contribution_receipt_date',
        sort_hide_null: true,
      });
      return this.fetchWithTimeout<FECApiResponse<FECContribution>>(url);
    }, CACHE_TTL.contributions);
  }

  async searchDisbursements(committeeId: string): Promise<FECApiResponse<FECDisbursement>> {
    if (this.isRateLimited('openfec')) {
      throw new Error('OpenFEC rate limit exceeded');
    }

    const cacheKey = `fec_disbursements_${committeeId}`;

    return this.fetchWithCache(cacheKey, async () => {
      this.trackApiCall('openfec');
      const url = this.buildOpenFECUrl('/schedules/schedule_b/', {
        committee_id: committeeId,
        sort: '-disbursement_date',
        sort_hide_null: true,
      });
      return this.fetchWithTimeout<FECApiResponse<FECDisbursement>>(url);
    }, CACHE_TTL.disbursements);
  }

  async searchIndependentExpenditures(candidateId?: string): Promise<FECApiResponse<FECIndependentExpenditure>> {
    if (this.isRateLimited('openfec')) {
      throw new Error('OpenFEC rate limit exceeded');
    }

    const cacheKey = `fec_ie_${candidateId || 'all'}`;

    return this.fetchWithCache(cacheKey, async () => {
      this.trackApiCall('openfec');
      const params: Record<string, string | undefined> = {
        sort: '-expenditure_date',
        sort_hide_null: 'true',
      };
      if (candidateId) {
        params.candidate_id = candidateId;
      }
      const url = this.buildOpenFECUrl('/schedules/schedule_e/', params);
      return this.fetchWithTimeout<FECApiResponse<FECIndependentExpenditure>>(url);
    }, CACHE_TTL.contributions);
  }

  // ============================================================================
  // Senate LDA API Methods
  // ============================================================================

  async searchLobbyists(params: LobbyistSearchParams): Promise<LDAApiResponse> {
    const cacheKey = `lda_filings_${JSON.stringify(params)}`;

    return this.fetchWithCache(cacheKey, async () => {
      const url = new URL(`${API_CONFIG.senateLDA.baseUrl}/filings/`);

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });

      return this.fetchWithTimeout<LDAApiResponse>(url.toString());
    }, CACHE_TTL.lobbyists);
  }

  // ============================================================================
  // ProPublica Nonprofit API Methods
  // ============================================================================

  async searchNonprofits(params: NonprofitSearchParams): Promise<NonprofitSearchResponse> {
    const cacheKey = `pp_nonprofit_search_${JSON.stringify(params)}`;

    return this.fetchWithCache(cacheKey, async () => {
      const url = new URL(`${API_CONFIG.propublica.baseUrl}/search.json`);
      url.searchParams.set('q', params.q);
      if (params.state) url.searchParams.set('state[id]', params.state);
      if (params.ntee) url.searchParams.set('ntee[id]', String(params.ntee));
      if (params.page) url.searchParams.set('page', String(params.page));

      return this.fetchWithTimeout<NonprofitSearchResponse>(url.toString());
    }, CACHE_TTL.nonprofits);
  }

  async getNonprofitByEIN(ein: string): Promise<NonprofitOrganization> {
    const cacheKey = `pp_nonprofit_${ein}`;

    return this.fetchWithCache(cacheKey, async () => {
      const url = `${API_CONFIG.propublica.baseUrl}/organizations/${ein}.json`;
      return this.fetchWithTimeout<NonprofitOrganization>(url);
    }, CACHE_TTL.nonprofits);
  }

  // ============================================================================
  // Aggregated Profile Methods (UI-Ready Data)
  // ============================================================================

  async fetchDonorProfile(name: string): Promise<{ data: DonorProfile | null; source: 'api' | 'mock'; error?: string }> {
    try {
      const contributions = await this.searchContributions({ contributor_name: name });

      if (contributions.results.length === 0) {
        return {
          data: SAMPLE_DONORS[0] || null,
          source: 'mock',
          error: 'No contributions found for this donor. Showing sample data.',
        };
      }

      // Transform FEC contributions to DonorProfile
      const profile = this.transformContributionsToDonor(contributions.results);
      return { data: profile, source: 'api' };
    } catch (error) {
      console.error('Failed to fetch donor profile:', error);
      return {
        data: SAMPLE_DONORS[0] || null,
        source: 'mock',
        error: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async fetchRecipientProfile(query: string): Promise<{ data: RecipientProfile | null; source: 'api' | 'mock'; error?: string }> {
    try {
      // Try searching committees first
      const committees = await this.searchCommittees({ q: query });

      if (committees.results.length > 0) {
        const committee = committees.results[0];
        const profile = await this.transformCommitteeToRecipient(committee);
        return { data: profile, source: 'api' };
      }

      // Try candidates
      const candidates = await this.searchCandidates({ q: query });

      if (candidates.results.length > 0) {
        const candidate = candidates.results[0];
        const profile = this.transformCandidateToRecipient(candidate);
        return { data: profile, source: 'api' };
      }

      return {
        data: SAMPLE_RECIPIENTS[0] || null,
        source: 'mock',
        error: 'No matching recipients found. Showing sample data.',
      };
    } catch (error) {
      console.error('Failed to fetch recipient profile:', error);
      return {
        data: SAMPLE_RECIPIENTS[0] || null,
        source: 'mock',
        error: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async fetchLobbyistProfile(name: string): Promise<{ data: LobbyistProfile | null; source: 'api' | 'mock'; error?: string }> {
    try {
      const filings = await this.searchLobbyists({ registrant_name: name });

      if (filings.results.length === 0) {
        return {
          data: SAMPLE_LOBBYISTS[0] || null,
          source: 'mock',
          error: 'No lobbying filings found. Showing sample data.',
        };
      }

      const profile = this.transformFilingsToLobbyist(filings.results);
      return { data: profile, source: 'api' };
    } catch (error) {
      console.error('Failed to fetch lobbyist profile:', error);
      return {
        data: SAMPLE_LOBBYISTS[0] || null,
        source: 'mock',
        error: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ============================================================================
  // Data Transformation Methods
  // ============================================================================

  private transformContributionsToDonor(contributions: FECContribution[]): DonorProfile {
    const first = contributions[0];

    // Aggregate by recipient
    const recipientTotals = new Map<string, { name: string; amount: number; type: string }>();
    contributions.forEach(c => {
      const key = c.committee.committee_id;
      const existing = recipientTotals.get(key);
      if (existing) {
        existing.amount += c.contribution_receipt_amount;
      } else {
        recipientTotals.set(key, {
          name: c.committee.name,
          amount: c.contribution_receipt_amount,
          type: c.committee.committee_type || 'committee',
        });
      }
    });

    const topRecipients = Array.from(recipientTotals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const recentContributions = contributions
      .slice(0, 5)
      .map(c => ({
        date: c.contribution_receipt_date,
        recipient: c.committee.name,
        amount: c.contribution_receipt_amount,
      }));

    return {
      id: `donor_${first.contributor_name.replace(/\s+/g, '_').toLowerCase()}`,
      name: first.contributor_name,
      occupation: first.contributor_occupation || 'Unknown',
      employer: first.contributor_employer || 'Unknown',
      city: first.contributor_city || '',
      state: first.contributor_state || '',
      totalContributions: contributions.reduce((sum, c) => sum + c.contribution_receipt_amount, 0),
      contributionCount: contributions.length,
      topRecipients,
      recentContributions,
      affiliations: [], // Would require additional API calls to infer
    };
  }

  private async transformCommitteeToRecipient(committee: FECCommittee): Promise<RecipientProfile> {
    // Try to get contribution totals
    let totalRaised = 0;
    try {
      const contributions = await this.searchContributions({ committee_id: committee.committee_id });
      totalRaised = contributions.results.reduce((sum, c) => sum + c.contribution_receipt_amount, 0);
    } catch {
      // Ignore - just use 0
    }

    const type = this.mapCommitteeType(committee.committee_type);

    return {
      id: committee.committee_id,
      name: committee.name,
      type,
      party: committee.party || undefined,
      state: committee.state || undefined,
      totalRaised,
      topDonors: [], // Would require aggregating contributions
      topIndustries: [], // Would require industry classification
    };
  }

  private transformCandidateToRecipient(candidate: FECCandidate): RecipientProfile {
    return {
      id: candidate.candidate_id,
      name: candidate.name,
      type: 'candidate',
      party: candidate.party || undefined,
      office: candidate.office_full || undefined,
      state: candidate.state || undefined,
      totalRaised: 0, // Would require additional API call
      topDonors: [],
      topIndustries: [],
    };
  }

  private transformFilingsToLobbyist(filings: LDAFiling[]): LobbyistProfile {
    const first = filings[0];

    // Aggregate clients
    const clientMap = new Map<string, { name: string; industry: string; amount: number }>();
    filings.forEach(f => {
      const key = f.client.id.toString();
      const existing = clientMap.get(key);
      const amount = f.income || f.expenses || 0;
      if (existing) {
        existing.amount += amount;
      } else {
        clientMap.set(key, {
          name: f.client.name,
          industry: f.client.general_description || 'Unknown',
          amount,
        });
      }
    });

    // Collect all lobbying targets and issues
    const targets = new Set<string>();
    const issues = new Set<string>();
    filings.forEach(f => {
      f.lobbying_activities.forEach(a => {
        a.government_entities.forEach(e => targets.add(e));
        issues.add(a.general_issue_code_display);
      });
    });

    const clients = Array.from(clientMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      id: `lobbyist_${first.registrant.id}`,
      name: first.registrant.name,
      firm: first.registrant.name,
      registrationDate: first.filing_date,
      clients,
      lobbyingTargets: Array.from(targets).slice(0, 10),
      issues: Array.from(issues).slice(0, 10),
      totalCompensation: filings.reduce((sum, f) => sum + (f.income || f.expenses || 0), 0),
    };
  }

  private mapCommitteeType(type: string): 'candidate' | 'pac' | 'super_pac' | 'party' | 'nonprofit' {
    switch (type) {
      case 'P': // Presidential
      case 'H': // House
      case 'S': // Senate
        return 'candidate';
      case 'N': // PAC (nonqualified)
      case 'Q': // PAC (qualified)
        return 'pac';
      case 'O': // Super PAC (Independent Expenditure Only)
      case 'U': // Single-candidate Super PAC
      case 'V': // PAC with Non-Contribution Account
      case 'W': // PAC with Non-Contribution Account (Qualified)
        return 'super_pac';
      case 'X': // Party (nonqualified)
      case 'Y': // Party (qualified)
        return 'party';
      default:
        return 'pac';
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  clearCache(): void {
    feedCache.clear();
    this.requestCache.clear();
  }

  resetRateLimits(): void {
    this.rateLimitCalls.clear();
  }
}

// Export singleton instance
export const politicalApiService = PoliticalApiService.getInstance();
