// Supabase Database Types for stonk-data project
// Auto-generated from actual table schemas

export interface SupabaseDonor {
  id: string;
  name: string;
  donor_type: 'individual' | 'foundation' | 'pac' | 'corporation';
  net_worth_billions: number | null;
  wealth_source: string | null;
  total_contributions: number;
  contribution_count: number;
  pro_israel_indicators: string[];
  media_connections: MediaConnection[];
  israel_connections: string[];
  metadata: DonorMetadata;
  sources: SourceCitation[];
  created_at: string;
  updated_at: string;
}

export interface DonorMetadata {
  notes?: string;
  opensecrets_id?: string;
  [key: string]: unknown;
}

export interface MediaConnection {
  outlet_name: string;
  relationship: string;
}

export interface SourceCitation {
  url: string;
  name: string;
  accessDate: string;
}

export interface MediaFunding {
  id: string;
  donor_id: string;
  outlet_name: string;
  outlet_domain: string | null;
  relationship_type: 'owner' | 'board' | 'investor' | 'advertiser' | 'grant' | 'founder' | 'funder';
  outlet_type: 'TV' | 'Print' | 'Digital' | 'Radio' | 'Podcast' | 'Other';
  estimated_amount: number | null;
  start_year: number | null;
  end_year: number | null;
  source_citations: SourceCitation[];
  created_at: string;
}

export interface PacContribution {
  id: string;
  pac_name: string;
  pac_type: 'pro-Israel' | 'pro-Saudi' | 'pro-China' | 'general-foreign-policy' | 'defense' | 'tech' | 'other';
  total_raised: number | null;
  total_spent: number | null;
  election_cycle: string | null;
  top_recipients: PacRecipient[];
  source_fec_id: string | null;
  created_at: string;
}

export interface PacRecipient {
  name: string;
  amount: number;
  party?: string;
}

export interface PacContributionDetail {
  id: string;
  pac_id: string;
  pac_name: string;
  recipient_id: string | null;
  recipient_name: string;
  recipient_type: 'candidate' | 'party' | 'pac' | 'committee';
  recipient_party: 'D' | 'R' | 'I' | 'L' | 'G' | null;
  recipient_state: string | null;
  recipient_district: string | null;
  amount: number;
  election_cycle: string;
  contribution_date: string | null;
  contribution_type: 'direct' | 'independent_expenditure' | 'oppose' | 'support';
  fec_filing_id: string | null;
  data_source: 'fec' | 'opensecrets' | 'trackaipac';
  source_confidence: number;
  last_verified: string | null;
  dedup_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface PoliticalRecipient {
  id: string;
  name: string;
  party: 'R' | 'D' | 'I' | 'Other' | null;
  state: string | null;
  chamber: 'House' | 'Senate' | 'Governor' | 'President' | 'Other' | null;
  total_received: number;
  pro_israel_votes: VoteRecord[];
  committee_assignments: string[];
  created_at: string;
  updated_at: string;
}

export interface VoteRecord {
  bill: string;
  vote: 'yes' | 'no' | 'abstain';
  date: string;
}

export interface Organization {
  id: string;
  name: string;
  org_type: 'pac' | 'super_pac' | 'lobbying_firm' | '501c3' | '501c4' | 'think_tank' | 'foundation' | 'defense_contractor' | 'tech_company' | 'pr_firm' | 'influence_ops';
  country: string;
  fec_id: string | null;
  fara_id: string | null;
  website: string | null;
  annual_budget: number | null;
  employee_count: number | null;
  founding_year: number | null;
  headquarters: string | null;
  pro_israel_indicators: string[];
  key_figures: KeyFigure[];
  notes: string | null;
  source_citations: SourceCitation[];
  created_at: string;
  updated_at: string;
}

export interface KeyFigure {
  name: string;
  role: string;
}

// D3 Network Graph Types
export interface NetworkNode {
  id: string;
  name: string;
  type: 'donor' | 'media' | 'foundation' | 'pac' | 'shell_org' | 'politician';
  // Donor-specific
  netWorth?: number;
  donorType?: string;
  totalContributions?: number;
  // Media-specific
  outletType?: string;
  domain?: string;
  // Organization-specific
  orgType?: string;
  ein?: string;
  fecId?: string;
  website?: string;
  // Location
  country?: string;
  state?: string;
  // Political info
  party?: string;
  chamber?: string;
  politicalLean?: 'left' | 'right' | 'neutral' | 'bipartisan' | 'unknown';
  // Metadata for tooltips
  description?: string;
  totalFunding?: number;
  boardMembers?: string[];
  riskIndicators?: unknown[];
}

export interface NetworkLink {
  source: string;
  target: string;
  relationship: string;
  startYear?: number;
  endYear?: number;
  amount?: number;
  // Extended link data for Money Trail Explorer
  intermediaries?: string[]; // IDs of shell orgs in between
  sourceDocuments?: SourceCitation[];
  grantPurpose?: string;
  isActive?: boolean;
  isDisclosed?: boolean;
  confidence?: 'high' | 'medium' | 'low';
}

export interface DonorMediaNetwork {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

// Money Trail Explorer Types
export interface MoneyPath {
  nodes: NetworkNode[];
  links: NetworkLink[];
  totalAmount: number;
  hopCount: number;
}

export interface ConnectionDetail {
  link: NetworkLink;
  sourceNode: NetworkNode;
  targetNode: NetworkNode;
  intermediaryOrgs?: NetworkNode[];
  downstreamRecipients?: { name: string; percentage: number }[];
  sharedBoardMembers?: string[];
}

export interface PathFinderOptions {
  maxHops: number;
  includeIntermediaries: boolean;
  filterByRelationship?: string[];
  filterByNodeType?: NetworkNode['type'][];
}
