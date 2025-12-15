// Political Finance API Types

// ============================================================================
// OpenFEC API Types
// ============================================================================

export interface FECCandidate {
  candidate_id: string;
  name: string;
  party: string;
  party_full: string;
  office: 'H' | 'S' | 'P';
  office_full: string;
  state: string;
  district: string;
  incumbent_challenge: 'I' | 'C' | 'O';
  incumbent_challenge_full: string;
  election_years: number[];
  cycles: number[];
  candidate_status: string;
  federal_funds_flag: boolean;
  has_raised_funds: boolean;
  first_file_date: string;
  last_file_date: string;
  load_date: string;
}

export interface FECCommittee {
  committee_id: string;
  name: string;
  committee_type: string;
  committee_type_full: string;
  designation: string;
  designation_full: string;
  treasurer_name: string;
  party: string;
  party_full: string;
  state: string;
  organization_type: string;
  organization_type_full: string;
  candidate_ids: string[];
  cycles: number[];
  first_file_date: string;
  last_file_date: string;
}

export interface FECContribution {
  contribution_receipt_amount: number;
  contribution_receipt_date: string;
  contributor_name: string;
  contributor_city: string;
  contributor_state: string;
  contributor_zip: string;
  contributor_employer: string;
  contributor_occupation: string;
  contributor_aggregate_ytd: number;
  committee: {
    name: string;
    committee_id: string;
    committee_type: string;
    party: string;
  };
  candidate: {
    name: string;
    candidate_id: string;
    party: string;
    office: string;
    state: string;
  } | null;
  receipt_type: string;
  receipt_type_full: string;
  memo_text: string;
  line_number: string;
  sub_id: string;
}

export interface FECDisbursement {
  disbursement_amount: number;
  disbursement_date: string;
  disbursement_description: string;
  recipient_name: string;
  recipient_city: string;
  recipient_state: string;
  recipient_zip: string;
  committee: {
    name: string;
    committee_id: string;
    committee_type: string;
  };
  disbursement_type: string;
  disbursement_type_description: string;
  category: string;
  category_code: string;
  memo_text: string;
  sub_id: string;
}

export interface FECIndependentExpenditure {
  amount: number;
  expenditure_date: string;
  expenditure_description: string;
  payee_name: string;
  payee_city: string;
  payee_state: string;
  committee: {
    name: string;
    committee_id: string;
  };
  candidate: {
    name: string;
    candidate_id: string;
    party: string;
    office: string;
    state: string;
    district: string;
  };
  support_oppose_indicator: 'S' | 'O';
  category_code: string;
  sub_id: string;
}

// OpenFEC API response wrapper
export interface FECApiResponse<T> {
  api_version: string;
  pagination: {
    count: number;
    page: number;
    pages: number;
    per_page: number;
    last_indexes?: {
      last_index: string;
      last_contribution_receipt_date?: string;
      last_disbursement_date?: string;
    };
  };
  results: T[];
}

// ============================================================================
// Senate LDA (Lobbying Disclosure Act) Types
// ============================================================================

export interface LDAFiling {
  filing_uuid: string;
  filing_type: string;
  filing_type_display: string;
  filing_year: number;
  filing_period: string;
  filing_period_display: string;
  filing_date: string;
  registrant: {
    id: number;
    name: string;
    address: string;
    description: string;
  };
  client: {
    id: number;
    name: string;
    general_description: string;
    state: string;
    country: string;
  };
  lobbying_activities: LDAActivity[];
  lobbyists: LDALobbyist[];
  income: number | null;
  expenses: number | null;
}

export interface LDAActivity {
  general_issue_code: string;
  general_issue_code_display: string;
  description: string;
  government_entities: string[];
}

export interface LDALobbyist {
  lobbyist_id: number;
  name: string;
  covered_position: string | null;
}

export interface LDAApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LDAFiling[];
}

// ============================================================================
// ProPublica Nonprofit Explorer Types
// ============================================================================

export interface NonprofitOrganization {
  organization: {
    ein: string;
    name: string;
    city: string;
    state: string;
    zipcode: string;
    ntee_code: string;
    raw_ntee_code: string;
    subsection_code: number;
    classification_codes: string;
    ruling_date: string;
    deductibility_code: number;
    foundation_code: number;
    activity_codes: string;
    organization_code: number;
    exempt_organization_status_code: number;
    tax_period: number;
    asset_code: number;
    income_code: number;
    filing_requirement_code: number;
    pf_filing_requirement_code: number;
    accounting_period: number;
    sort_name: string;
  };
  filings_with_data: NonprofitFiling[];
  data_source: string;
  api_version: number;
}

export interface NonprofitFiling {
  tax_prd: number;
  tax_prd_yr: number;
  formtype: number;
  formtype_str: string;
  pdf_url: string;
  updated: string;
  totrevenue: number;
  totfuncexpns: number;
  totassetsend: number;
  totliabend: number;
  pct_compnsatncurrofcr: number;
}

export interface NonprofitSearchResult {
  ein: string;
  name: string;
  city: string;
  state: string;
  ntee_code: string;
  score: number;
}

export interface NonprofitSearchResponse {
  total_results: number;
  organizations: NonprofitSearchResult[];
}

// ============================================================================
// Capitol Trades Types
// ============================================================================

export interface CongressionalTrade {
  transaction_date: string;
  disclosure_date: string;
  politician: string;
  politician_party: string;
  politician_state: string;
  politician_chamber: 'House' | 'Senate';
  asset_description: string;
  asset_type: string;
  transaction_type: 'buy' | 'sell' | 'exchange';
  amount_range: string;
  comment: string;
}

// ============================================================================
// Transformed Types for UI (matching existing interfaces)
// ============================================================================

export interface DonorProfile {
  id: string;
  name: string;
  occupation: string;
  employer: string;
  city: string;
  state: string;
  totalContributions: number;
  contributionCount: number;
  topRecipients: Array<{ name: string; amount: number; type: string }>;
  recentContributions: Array<{ date: string; recipient: string; amount: number }>;
  affiliations: string[];
}

export interface LobbyistProfile {
  id: string;
  name: string;
  firm: string;
  registrationDate: string;
  clients: Array<{ name: string; industry: string; amount: number }>;
  lobbyingTargets: string[];
  issues: string[];
  totalCompensation: number;
}

export interface RecipientProfile {
  id: string;
  name: string;
  type: 'candidate' | 'pac' | 'super_pac' | 'party' | 'nonprofit';
  party?: string;
  office?: string;
  state?: string;
  totalRaised: number;
  topDonors: Array<{ name: string; amount: number; type: string }>;
  topIndustries: Array<{ industry: string; amount: number }>;
}

// ============================================================================
// API Service Types
// ============================================================================

export interface ApiStatus {
  available: boolean;
  remainingCalls?: number;
  resetTime?: Date;
  error?: string;
}

export interface PoliticalApiStatus {
  openfec: ApiStatus;
  senateLDA: ApiStatus;
  propublica: ApiStatus;
}

export interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

export interface RateLimitState {
  calls: number[];
  provider: string;
}

// Search parameters
export interface CandidateSearchParams {
  q?: string;
  state?: string;
  party?: string;
  office?: 'H' | 'S' | 'P';
  cycle?: number;
  per_page?: number;
  page?: number;
}

export interface CommitteeSearchParams {
  q?: string;
  state?: string;
  party?: string;
  committee_type?: string;
  cycle?: number;
  per_page?: number;
  page?: number;
}

export interface ContributionSearchParams {
  contributor_name?: string;
  contributor_city?: string;
  contributor_state?: string;
  contributor_employer?: string;
  committee_id?: string;
  min_amount?: number;
  max_amount?: number;
  min_date?: string;
  max_date?: string;
  per_page?: number;
  sort?: string;
  sort_hide_null?: boolean;
  sort_null_only?: boolean;
  last_index?: string;
  last_contribution_receipt_date?: string;
}

export interface LobbyistSearchParams {
  registrant_name?: string;
  client_name?: string;
  lobbyist_name?: string;
  filing_year?: number;
  filing_period?: string;
  page?: number;
  page_size?: number;
}

export interface NonprofitSearchParams {
  q: string;
  state?: string;
  ntee?: number;
  page?: number;
}
