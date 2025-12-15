// Political API Service interface for dependency injection
// Enables mocking of external API calls in tests

import type {
  FECCandidate,
  FECCommittee,
  FECContribution,
  FECDisbursement,
  FECIndependentExpenditure,
  FECApiResponse,
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
} from '../../types/political';

// Profile fetch result - always from API (no mock fallback)
export interface ProfileFetchResult<T> {
  data: T | null;
  source: 'api';
  error?: string;
}

export interface IPoliticalApiService {
  // Status & Rate Limiting
  getApiStatus(): PoliticalApiStatus;

  // OpenFEC API
  searchCandidates(params: CandidateSearchParams): Promise<FECApiResponse<FECCandidate>>;
  searchCommittees(params: CommitteeSearchParams): Promise<FECApiResponse<FECCommittee>>;
  searchContributions(params: ContributionSearchParams): Promise<FECApiResponse<FECContribution>>;
  searchDisbursements(committeeId: string): Promise<FECApiResponse<FECDisbursement>>;
  searchIndependentExpenditures(candidateId?: string): Promise<FECApiResponse<FECIndependentExpenditure>>;

  // Senate LDA API
  searchLobbyists(params: LobbyistSearchParams): Promise<LDAApiResponse>;

  // ProPublica Nonprofit API
  searchNonprofits(params: NonprofitSearchParams): Promise<NonprofitSearchResponse>;
  getNonprofitByEIN(ein: string): Promise<NonprofitOrganization>;

  // Aggregated Profiles (UI-Ready Data)
  fetchDonorProfile(name: string): Promise<ProfileFetchResult<DonorProfile>>;
  fetchRecipientProfile(query: string): Promise<ProfileFetchResult<RecipientProfile>>;
  fetchLobbyistProfile(name: string): Promise<ProfileFetchResult<LobbyistProfile>>;

  // Cache Management
  clearCache(): void;
  resetRateLimits(): void;
}

// Configuration for the Political API service
export interface PoliticalApiConfig {
  openfecApiKey?: string;
  openfecBaseUrl?: string;
  senateLDABaseUrl?: string;
  propublicaBaseUrl?: string;
  cacheTTL?: {
    candidates?: number;
    committees?: number;
    contributions?: number;
    disbursements?: number;
    lobbyists?: number;
    nonprofits?: number;
    profiles?: number;
  };
}
