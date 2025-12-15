// Supabase Service interface for dependency injection
// Enables mocking of Supabase queries in tests

import type {
  SupabaseDonor,
  MediaFunding,
  PacContribution,
  PacContributionDetail,
  PoliticalRecipient,
  Organization,
  DonorMediaNetwork,
} from '../../types/supabase';

export interface ISupabaseService {
  // Configuration
  isConfigured(): boolean;

  // Donor Queries
  getDonors(): Promise<SupabaseDonor[]>;
  getDonorById(id: string): Promise<SupabaseDonor | null>;
  searchDonorsByName(name: string): Promise<SupabaseDonor[]>;

  // Media Funding Queries
  getMediaFunding(): Promise<MediaFunding[]>;
  getMediaFundingByDonor(donorId: string): Promise<MediaFunding[]>;

  // PAC Contribution Queries
  getPacContributions(): Promise<PacContribution[]>;
  getPacContributionDetails(): Promise<PacContributionDetail[]>;
  getPacContributionsByRecipient(recipientName: string): Promise<PacContributionDetail[]>;

  // Political Recipient Queries
  getPoliticalRecipients(): Promise<PoliticalRecipient[]>;

  // Organization Queries
  getOrganizations(): Promise<Organization[]>;

  // Network Graph Data (for D3.js)
  getDonorMediaNetwork(): Promise<DonorMediaNetwork>;

  // Aggregation Queries
  getContributionsByParty(): Promise<PartyContribution[]>;
  getContributionsByState(): Promise<StateContribution[]>;

  // Cache Management
  clearCache(): void;
}

export interface PartyContribution {
  party: string;
  total: number;
  count: number;
}

export interface StateContribution {
  state: string;
  total: number;
  count: number;
}
