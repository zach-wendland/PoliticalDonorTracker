// Political Finance, Donor, and Lobbyist Data Sources Configuration

export interface PoliticalDataSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scrape';
  category: SourceCategory;
  description: string;
  coverage: 'federal' | 'state' | 'local' | 'international';
  dataTypes: DataType[];
  updateFrequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  reliability: 'official' | 'verified' | 'community';
  apiKeyRequired?: boolean;
  rateLimit?: string;
}

export type SourceCategory =
  | 'FEC_FEDERAL'
  | 'OPENSECRETS'
  | 'LOBBYIST_DISCLOSURE'
  | 'STATE_FINANCE'
  | 'NONPROFIT_DARK_MONEY'
  | 'WATCHDOG_INVESTIGATIVE'
  | 'FOREIGN_INFLUENCE'
  | 'ETHICS_COMPLIANCE';

export type DataType =
  | 'donor_contributions'
  | 'pac_expenditures'
  | 'lobbyist_registrations'
  | 'lobbyist_activities'
  | 'foreign_agent_filings'
  | 'nonprofit_disclosures'
  | 'ethics_violations'
  | 'campaign_filings'
  | 'bundler_data'
  | 'independent_expenditures';

export const POLITICAL_SOURCE_CATEGORIES: Record<SourceCategory, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  FEC_FEDERAL: {
    label: "Federal Election Commission",
    icon: "Building2",
    color: "text-blue-400",
    description: "Official federal campaign finance filings and disclosures"
  },
  OPENSECRETS: {
    label: "OpenSecrets / CRP",
    icon: "Eye",
    color: "text-purple-400",
    description: "Center for Responsive Politics aggregated data"
  },
  LOBBYIST_DISCLOSURE: {
    label: "Lobbyist Disclosures",
    icon: "UserCheck",
    color: "text-orange-400",
    description: "Congressional lobbying registrations and activity reports"
  },
  STATE_FINANCE: {
    label: "State Campaign Finance",
    icon: "Map",
    color: "text-green-400",
    description: "State-level campaign finance portals and disclosures"
  },
  NONPROFIT_DARK_MONEY: {
    label: "Nonprofit / Dark Money",
    icon: "Moon",
    color: "text-slate-400",
    description: "501(c) organizations and politically active nonprofits"
  },
  WATCHDOG_INVESTIGATIVE: {
    label: "Watchdog Organizations",
    icon: "Search",
    color: "text-red-400",
    description: "Investigative journalism and transparency groups"
  },
  FOREIGN_INFLUENCE: {
    label: "Foreign Influence",
    icon: "Globe2",
    color: "text-cyan-400",
    description: "FARA filings and foreign lobbying disclosures"
  },
  ETHICS_COMPLIANCE: {
    label: "Ethics & Compliance",
    icon: "Scale",
    color: "text-yellow-400",
    description: "Congressional ethics filings and financial disclosures"
  }
};

// ============================================================================
// FEDERAL ELECTION COMMISSION (FEC) SOURCES
// ============================================================================
export const FEC_SOURCES: PoliticalDataSource[] = [
  {
    id: 'fec-api-candidates',
    name: 'FEC Candidate Filings API',
    url: 'https://api.open.fec.gov/v1/candidates/',
    type: 'api',
    category: 'FEC_FEDERAL',
    description: 'Official FEC candidate registration and filing data',
    coverage: 'federal',
    dataTypes: ['campaign_filings', 'donor_contributions'],
    updateFrequency: 'daily',
    reliability: 'official',
    apiKeyRequired: true,
    rateLimit: '1000/hour'
  },
  {
    id: 'fec-api-committees',
    name: 'FEC Committee Filings API',
    url: 'https://api.open.fec.gov/v1/committees/',
    type: 'api',
    category: 'FEC_FEDERAL',
    description: 'PAC, Super PAC, and party committee filings',
    coverage: 'federal',
    dataTypes: ['pac_expenditures', 'donor_contributions'],
    updateFrequency: 'daily',
    reliability: 'official',
    apiKeyRequired: true
  },
  {
    id: 'fec-api-receipts',
    name: 'FEC Individual Contributions API',
    url: 'https://api.open.fec.gov/v1/schedules/schedule_a/',
    type: 'api',
    category: 'FEC_FEDERAL',
    description: 'Itemized individual contributions over $200',
    coverage: 'federal',
    dataTypes: ['donor_contributions'],
    updateFrequency: 'daily',
    reliability: 'official',
    apiKeyRequired: true
  },
  {
    id: 'fec-api-disbursements',
    name: 'FEC Disbursements API',
    url: 'https://api.open.fec.gov/v1/schedules/schedule_b/',
    type: 'api',
    category: 'FEC_FEDERAL',
    description: 'Campaign spending and expenditure records',
    coverage: 'federal',
    dataTypes: ['pac_expenditures'],
    updateFrequency: 'daily',
    reliability: 'official',
    apiKeyRequired: true
  },
  {
    id: 'fec-api-independent-expenditures',
    name: 'FEC Independent Expenditures API',
    url: 'https://api.open.fec.gov/v1/schedules/schedule_e/',
    type: 'api',
    category: 'FEC_FEDERAL',
    description: 'Independent expenditures by PACs and Super PACs',
    coverage: 'federal',
    dataTypes: ['independent_expenditures', 'pac_expenditures'],
    updateFrequency: 'daily',
    reliability: 'official',
    apiKeyRequired: true
  },
  {
    id: 'fec-rss-press',
    name: 'FEC Press Releases RSS',
    url: 'https://www.fec.gov/updates/?tab=press-releases',
    type: 'rss',
    category: 'FEC_FEDERAL',
    description: 'Official FEC announcements and press releases',
    coverage: 'federal',
    dataTypes: ['campaign_filings'],
    updateFrequency: 'weekly',
    reliability: 'official'
  },
  {
    id: 'fec-bulk-data',
    name: 'FEC Bulk Data Downloads',
    url: 'https://www.fec.gov/data/browse-data/?tab=bulk-data',
    type: 'api',
    category: 'FEC_FEDERAL',
    description: 'Complete downloadable FEC datasets',
    coverage: 'federal',
    dataTypes: ['donor_contributions', 'pac_expenditures', 'campaign_filings'],
    updateFrequency: 'daily',
    reliability: 'official'
  }
];

// ============================================================================
// OPENSECRETS / CENTER FOR RESPONSIVE POLITICS
// ============================================================================
export const OPENSECRETS_SOURCES: PoliticalDataSource[] = [
  {
    id: 'opensecrets-api-members',
    name: 'OpenSecrets Member Profiles API',
    url: 'https://www.opensecrets.org/api/?method=getLegislators',
    type: 'api',
    category: 'OPENSECRETS',
    description: 'Legislator campaign finance profiles',
    coverage: 'federal',
    dataTypes: ['donor_contributions', 'pac_expenditures'],
    updateFrequency: 'daily',
    reliability: 'verified',
    apiKeyRequired: true
  },
  {
    id: 'opensecrets-api-contributors',
    name: 'OpenSecrets Top Contributors API',
    url: 'https://www.opensecrets.org/api/?method=candContrib',
    type: 'api',
    category: 'OPENSECRETS',
    description: 'Top donors to specific candidates',
    coverage: 'federal',
    dataTypes: ['donor_contributions', 'bundler_data'],
    updateFrequency: 'weekly',
    reliability: 'verified',
    apiKeyRequired: true
  },
  {
    id: 'opensecrets-api-industries',
    name: 'OpenSecrets Industry Contributions API',
    url: 'https://www.opensecrets.org/api/?method=candIndustry',
    type: 'api',
    category: 'OPENSECRETS',
    description: 'Industry sector contribution analysis',
    coverage: 'federal',
    dataTypes: ['donor_contributions'],
    updateFrequency: 'weekly',
    reliability: 'verified',
    apiKeyRequired: true
  },
  {
    id: 'opensecrets-api-pacs',
    name: 'OpenSecrets PAC Summary API',
    url: 'https://www.opensecrets.org/api/?method=congCmteIndus',
    type: 'api',
    category: 'OPENSECRETS',
    description: 'PAC contributions to congressional committees',
    coverage: 'federal',
    dataTypes: ['pac_expenditures'],
    updateFrequency: 'weekly',
    reliability: 'verified',
    apiKeyRequired: true
  },
  {
    id: 'opensecrets-rss-news',
    name: 'OpenSecrets News RSS',
    url: 'https://www.opensecrets.org/news/feed/',
    type: 'rss',
    category: 'OPENSECRETS',
    description: 'Latest money in politics news and analysis',
    coverage: 'federal',
    dataTypes: ['donor_contributions', 'pac_expenditures'],
    updateFrequency: 'daily',
    reliability: 'verified'
  },
  {
    id: 'opensecrets-bulk-data',
    name: 'OpenSecrets Bulk Data',
    url: 'https://www.opensecrets.org/bulk-data',
    type: 'api',
    category: 'OPENSECRETS',
    description: 'Comprehensive downloadable datasets',
    coverage: 'federal',
    dataTypes: ['donor_contributions', 'pac_expenditures', 'lobbyist_activities'],
    updateFrequency: 'quarterly',
    reliability: 'verified'
  }
];

// ============================================================================
// LOBBYIST DISCLOSURE SOURCES
// ============================================================================
export const LOBBYIST_SOURCES: PoliticalDataSource[] = [
  {
    id: 'senate-lda-search',
    name: 'Senate Lobbying Disclosure Database',
    url: 'https://lda.senate.gov/api/v1/filings/',
    type: 'api',
    category: 'LOBBYIST_DISCLOSURE',
    description: 'Official Senate lobbying registrations and reports',
    coverage: 'federal',
    dataTypes: ['lobbyist_registrations', 'lobbyist_activities'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  },
  {
    id: 'house-clerk-lobbying',
    name: 'House Clerk Lobbying Disclosures',
    url: 'https://lobbyingdisclosure.house.gov/',
    type: 'scrape',
    category: 'LOBBYIST_DISCLOSURE',
    description: 'House of Representatives lobbying filings',
    coverage: 'federal',
    dataTypes: ['lobbyist_registrations', 'lobbyist_activities'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  },
  {
    id: 'opensecrets-lobbying-api',
    name: 'OpenSecrets Lobbying API',
    url: 'https://www.opensecrets.org/api/?method=getLobbyists',
    type: 'api',
    category: 'LOBBYIST_DISCLOSURE',
    description: 'Aggregated lobbying data with analysis',
    coverage: 'federal',
    dataTypes: ['lobbyist_registrations', 'lobbyist_activities'],
    updateFrequency: 'quarterly',
    reliability: 'verified',
    apiKeyRequired: true
  },
  {
    id: 'lobbying-data-gov',
    name: 'Lobbying Data (Data.gov)',
    url: 'https://catalog.data.gov/dataset/lobbying-disclosure-act-data',
    type: 'api',
    category: 'LOBBYIST_DISCLOSURE',
    description: 'Government open data lobbying records',
    coverage: 'federal',
    dataTypes: ['lobbyist_registrations', 'lobbyist_activities'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  },
  {
    id: 'propublica-lobbying',
    name: 'ProPublica Represent Lobbying',
    url: 'https://projects.propublica.org/represent/lobbying',
    type: 'api',
    category: 'LOBBYIST_DISCLOSURE',
    description: 'Searchable lobbying disclosure database',
    coverage: 'federal',
    dataTypes: ['lobbyist_registrations', 'lobbyist_activities'],
    updateFrequency: 'quarterly',
    reliability: 'verified'
  }
];

// ============================================================================
// STATE CAMPAIGN FINANCE SOURCES
// ============================================================================
export const STATE_FINANCE_SOURCES: PoliticalDataSource[] = [
  {
    id: 'followthemoney-api',
    name: 'Follow The Money API (NIMP)',
    url: 'https://api.followthemoney.org/',
    type: 'api',
    category: 'STATE_FINANCE',
    description: 'National Institute on Money in Politics - all 50 states',
    coverage: 'state',
    dataTypes: ['donor_contributions', 'campaign_filings'],
    updateFrequency: 'weekly',
    reliability: 'verified',
    apiKeyRequired: true
  },
  {
    id: 'ca-cal-access',
    name: 'California Cal-Access',
    url: 'https://cal-access.sos.ca.gov/',
    type: 'api',
    category: 'STATE_FINANCE',
    description: 'California campaign finance and lobbying database',
    coverage: 'state',
    dataTypes: ['donor_contributions', 'lobbyist_registrations'],
    updateFrequency: 'daily',
    reliability: 'official'
  },
  {
    id: 'tx-ethics-commission',
    name: 'Texas Ethics Commission',
    url: 'https://www.ethics.state.tx.us/search/',
    type: 'api',
    category: 'STATE_FINANCE',
    description: 'Texas campaign finance and ethics filings',
    coverage: 'state',
    dataTypes: ['donor_contributions', 'lobbyist_registrations'],
    updateFrequency: 'weekly',
    reliability: 'official'
  },
  {
    id: 'ny-elections-finance',
    name: 'New York State BOE Campaign Finance',
    url: 'https://www.elections.ny.gov/CFViewReports.html',
    type: 'scrape',
    category: 'STATE_FINANCE',
    description: 'New York campaign finance filings',
    coverage: 'state',
    dataTypes: ['donor_contributions', 'campaign_filings'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  },
  {
    id: 'fl-dos-finance',
    name: 'Florida Division of Elections',
    url: 'https://dos.myflorida.com/elections/candidates-committees/campaign-finance/',
    type: 'api',
    category: 'STATE_FINANCE',
    description: 'Florida campaign finance database',
    coverage: 'state',
    dataTypes: ['donor_contributions', 'campaign_filings'],
    updateFrequency: 'weekly',
    reliability: 'official'
  },
  {
    id: 'pa-dos-finance',
    name: 'Pennsylvania Campaign Finance',
    url: 'https://www.campaignfinanceonline.pa.gov/',
    type: 'scrape',
    category: 'STATE_FINANCE',
    description: 'Pennsylvania campaign finance filings',
    coverage: 'state',
    dataTypes: ['donor_contributions', 'campaign_filings'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  },
  {
    id: 'il-elections-finance',
    name: 'Illinois State Board of Elections',
    url: 'https://www.elections.il.gov/CampaignDisclosure/',
    type: 'api',
    category: 'STATE_FINANCE',
    description: 'Illinois campaign disclosure database',
    coverage: 'state',
    dataTypes: ['donor_contributions', 'campaign_filings'],
    updateFrequency: 'weekly',
    reliability: 'official'
  },
  {
    id: 'oh-sos-finance',
    name: 'Ohio Secretary of State Campaign Finance',
    url: 'https://www.ohiosos.gov/campaign-finance/',
    type: 'scrape',
    category: 'STATE_FINANCE',
    description: 'Ohio campaign finance filings',
    coverage: 'state',
    dataTypes: ['donor_contributions', 'campaign_filings'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  },
  {
    id: 'ga-ethics-commission',
    name: 'Georgia Government Transparency & Campaign Finance',
    url: 'https://ethics.ga.gov/campaign-finance/',
    type: 'api',
    category: 'STATE_FINANCE',
    description: 'Georgia ethics and campaign finance portal',
    coverage: 'state',
    dataTypes: ['donor_contributions', 'campaign_filings', 'lobbyist_registrations'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  },
  {
    id: 'az-sos-finance',
    name: 'Arizona Campaign Finance',
    url: 'https://azsos.gov/elections/campaign-finance',
    type: 'scrape',
    category: 'STATE_FINANCE',
    description: 'Arizona campaign finance database',
    coverage: 'state',
    dataTypes: ['donor_contributions', 'campaign_filings'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  }
];

// ============================================================================
// NONPROFIT & DARK MONEY SOURCES
// ============================================================================
export const NONPROFIT_SOURCES: PoliticalDataSource[] = [
  {
    id: 'propublica-nonprofit-explorer',
    name: 'ProPublica Nonprofit Explorer',
    url: 'https://projects.propublica.org/nonprofits/api/v2/',
    type: 'api',
    category: 'NONPROFIT_DARK_MONEY',
    description: 'IRS 990 filings for nonprofits and foundations',
    coverage: 'federal',
    dataTypes: ['nonprofit_disclosures', 'donor_contributions'],
    updateFrequency: 'quarterly',
    reliability: 'verified'
  },
  {
    id: 'irs-eo-search',
    name: 'IRS Exempt Organizations Search',
    url: 'https://apps.irs.gov/app/eos/',
    type: 'api',
    category: 'NONPROFIT_DARK_MONEY',
    description: 'Official IRS exempt organization database',
    coverage: 'federal',
    dataTypes: ['nonprofit_disclosures'],
    updateFrequency: 'weekly',
    reliability: 'official'
  },
  {
    id: 'irs-990-bulk',
    name: 'IRS 990 Bulk Data (AWS)',
    url: 'https://registry.opendata.aws/irs990/',
    type: 'api',
    category: 'NONPROFIT_DARK_MONEY',
    description: 'Complete IRS 990 electronic filings',
    coverage: 'federal',
    dataTypes: ['nonprofit_disclosures', 'donor_contributions'],
    updateFrequency: 'monthly',
    reliability: 'official'
  },
  {
    id: 'opensecrets-527',
    name: 'OpenSecrets 527 Organizations',
    url: 'https://www.opensecrets.org/527s/',
    type: 'api',
    category: 'NONPROFIT_DARK_MONEY',
    description: '527 political organization tracking',
    coverage: 'federal',
    dataTypes: ['donor_contributions', 'independent_expenditures'],
    updateFrequency: 'quarterly',
    reliability: 'verified',
    apiKeyRequired: true
  },
  {
    id: 'opensecrets-outside-spending',
    name: 'OpenSecrets Outside Spending',
    url: 'https://www.opensecrets.org/outsidespending/',
    type: 'api',
    category: 'NONPROFIT_DARK_MONEY',
    description: 'Super PAC and dark money spending tracker',
    coverage: 'federal',
    dataTypes: ['independent_expenditures', 'pac_expenditures'],
    updateFrequency: 'weekly',
    reliability: 'verified',
    apiKeyRequired: true
  },
  {
    id: 'guidestar-api',
    name: 'Candid GuideStar API',
    url: 'https://www.guidestar.org/profile/',
    type: 'api',
    category: 'NONPROFIT_DARK_MONEY',
    description: 'Nonprofit profiles and financial data',
    coverage: 'federal',
    dataTypes: ['nonprofit_disclosures'],
    updateFrequency: 'monthly',
    reliability: 'verified',
    apiKeyRequired: true
  }
];

// ============================================================================
// WATCHDOG & INVESTIGATIVE SOURCES
// ============================================================================
export const WATCHDOG_SOURCES: PoliticalDataSource[] = [
  {
    id: 'propublica-represent',
    name: 'ProPublica Represent API',
    url: 'https://projects.propublica.org/api-docs/congress-api/',
    type: 'api',
    category: 'WATCHDOG_INVESTIGATIVE',
    description: 'Congressional data including votes and member info',
    coverage: 'federal',
    dataTypes: ['campaign_filings'],
    updateFrequency: 'daily',
    reliability: 'verified',
    apiKeyRequired: true
  },
  {
    id: 'propublica-rss',
    name: 'ProPublica RSS Feed',
    url: 'https://www.propublica.org/feeds/propublica/main',
    type: 'rss',
    category: 'WATCHDOG_INVESTIGATIVE',
    description: 'Investigative journalism and accountability reporting',
    coverage: 'federal',
    dataTypes: ['ethics_violations', 'donor_contributions'],
    updateFrequency: 'daily',
    reliability: 'verified'
  },
  {
    id: 'sunlight-foundation-legacy',
    name: 'Sunlight Foundation Legacy Data',
    url: 'https://sunlightfoundation.com/api/',
    type: 'api',
    category: 'WATCHDOG_INVESTIGATIVE',
    description: 'Historical transparency data (archived)',
    coverage: 'federal',
    dataTypes: ['lobbyist_activities', 'donor_contributions'],
    updateFrequency: 'quarterly',
    reliability: 'verified'
  },
  {
    id: 'maplight-api',
    name: 'MapLight API',
    url: 'https://maplight.org/data/',
    type: 'api',
    category: 'WATCHDOG_INVESTIGATIVE',
    description: 'Money in politics and legislative influence tracking',
    coverage: 'federal',
    dataTypes: ['donor_contributions', 'lobbyist_activities'],
    updateFrequency: 'weekly',
    reliability: 'verified'
  },
  {
    id: 'crew-rss',
    name: 'CREW (Citizens for Ethics) RSS',
    url: 'https://www.citizensforethics.org/feed/',
    type: 'rss',
    category: 'WATCHDOG_INVESTIGATIVE',
    description: 'Government ethics watchdog news',
    coverage: 'federal',
    dataTypes: ['ethics_violations'],
    updateFrequency: 'daily',
    reliability: 'verified'
  },
  {
    id: 'politifact-rss',
    name: 'PolitiFact RSS',
    url: 'https://www.politifact.com/rss/all/',
    type: 'rss',
    category: 'WATCHDOG_INVESTIGATIVE',
    description: 'Political fact-checking and claims analysis',
    coverage: 'federal',
    dataTypes: ['campaign_filings'],
    updateFrequency: 'daily',
    reliability: 'verified'
  },
  {
    id: 'factcheck-org-rss',
    name: 'FactCheck.org RSS',
    url: 'https://www.factcheck.org/feed/',
    type: 'rss',
    category: 'WATCHDOG_INVESTIGATIVE',
    description: 'Non-partisan fact-checking',
    coverage: 'federal',
    dataTypes: ['campaign_filings'],
    updateFrequency: 'daily',
    reliability: 'verified'
  },
  {
    id: 'intercept-politics-rss',
    name: 'The Intercept Politics RSS',
    url: 'https://theintercept.com/feed/?rss',
    type: 'rss',
    category: 'WATCHDOG_INVESTIGATIVE',
    description: 'Investigative political journalism',
    coverage: 'federal',
    dataTypes: ['ethics_violations', 'lobbyist_activities'],
    updateFrequency: 'daily',
    reliability: 'verified'
  },
  {
    id: 'muckrock-rss',
    name: 'MuckRock RSS',
    url: 'https://www.muckrock.com/news/feed/',
    type: 'rss',
    category: 'WATCHDOG_INVESTIGATIVE',
    description: 'FOIA-based investigative reporting',
    coverage: 'federal',
    dataTypes: ['ethics_violations'],
    updateFrequency: 'daily',
    reliability: 'verified'
  },
  {
    id: 'documentcloud-api',
    name: 'DocumentCloud API',
    url: 'https://api.www.documentcloud.org/',
    type: 'api',
    category: 'WATCHDOG_INVESTIGATIVE',
    description: 'Primary source documents repository',
    coverage: 'federal',
    dataTypes: ['lobbyist_activities', 'ethics_violations'],
    updateFrequency: 'daily',
    reliability: 'verified'
  }
];

// ============================================================================
// FOREIGN INFLUENCE & FARA SOURCES
// ============================================================================
export const FOREIGN_INFLUENCE_SOURCES: PoliticalDataSource[] = [
  {
    id: 'fara-gov',
    name: 'FARA eFile System (DOJ)',
    url: 'https://efile.fara.gov/ords/fara/f?p=API:SEARCH',
    type: 'api',
    category: 'FOREIGN_INFLUENCE',
    description: 'Foreign Agents Registration Act filings',
    coverage: 'federal',
    dataTypes: ['foreign_agent_filings', 'lobbyist_registrations'],
    updateFrequency: 'weekly',
    reliability: 'official'
  },
  {
    id: 'opensecrets-fara',
    name: 'OpenSecrets Foreign Lobbying',
    url: 'https://www.opensecrets.org/fara/',
    type: 'api',
    category: 'FOREIGN_INFLUENCE',
    description: 'Analyzed foreign lobbying data',
    coverage: 'federal',
    dataTypes: ['foreign_agent_filings', 'lobbyist_activities'],
    updateFrequency: 'quarterly',
    reliability: 'verified',
    apiKeyRequired: true
  },
  {
    id: 'propublica-foreign-lobbying',
    name: 'ProPublica Foreign Lobbying',
    url: 'https://projects.propublica.org/foreign-lobbying/',
    type: 'api',
    category: 'FOREIGN_INFLUENCE',
    description: 'Foreign lobbying influence tracker',
    coverage: 'federal',
    dataTypes: ['foreign_agent_filings'],
    updateFrequency: 'quarterly',
    reliability: 'verified'
  },
  {
    id: 'ofac-sanctions',
    name: 'OFAC Sanctions List',
    url: 'https://sanctionssearch.ofac.treas.gov/',
    type: 'api',
    category: 'FOREIGN_INFLUENCE',
    description: 'Treasury Department sanctions and blocked persons',
    coverage: 'international',
    dataTypes: ['foreign_agent_filings'],
    updateFrequency: 'weekly',
    reliability: 'official'
  }
];

// ============================================================================
// ETHICS & COMPLIANCE SOURCES
// ============================================================================
export const ETHICS_SOURCES: PoliticalDataSource[] = [
  {
    id: 'house-ethics-committee',
    name: 'House Ethics Committee',
    url: 'https://ethics.house.gov/',
    type: 'scrape',
    category: 'ETHICS_COMPLIANCE',
    description: 'House member ethics investigations and reports',
    coverage: 'federal',
    dataTypes: ['ethics_violations'],
    updateFrequency: 'weekly',
    reliability: 'official'
  },
  {
    id: 'senate-ethics-committee',
    name: 'Senate Ethics Committee',
    url: 'https://www.ethics.senate.gov/',
    type: 'scrape',
    category: 'ETHICS_COMPLIANCE',
    description: 'Senate member ethics filings',
    coverage: 'federal',
    dataTypes: ['ethics_violations'],
    updateFrequency: 'weekly',
    reliability: 'official'
  },
  {
    id: 'house-financial-disclosure',
    name: 'House Financial Disclosures',
    url: 'https://disclosures-clerk.house.gov/FinancialDisclosure',
    type: 'api',
    category: 'ETHICS_COMPLIANCE',
    description: 'House member personal financial disclosures',
    coverage: 'federal',
    dataTypes: ['ethics_violations'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  },
  {
    id: 'senate-financial-disclosure',
    name: 'Senate Financial Disclosures (eFD)',
    url: 'https://efdsearch.senate.gov/',
    type: 'api',
    category: 'ETHICS_COMPLIANCE',
    description: 'Senate member financial disclosure search',
    coverage: 'federal',
    dataTypes: ['ethics_violations'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  },
  {
    id: 'oge-records',
    name: 'Office of Government Ethics Records',
    url: 'https://www.oge.gov/',
    type: 'scrape',
    category: 'ETHICS_COMPLIANCE',
    description: 'Executive branch ethics and financial disclosures',
    coverage: 'federal',
    dataTypes: ['ethics_violations'],
    updateFrequency: 'quarterly',
    reliability: 'official'
  },
  {
    id: 'capitol-trades',
    name: 'Capitol Trades API',
    url: 'https://www.capitoltrades.com/',
    type: 'api',
    category: 'ETHICS_COMPLIANCE',
    description: 'Congressional stock trading tracker',
    coverage: 'federal',
    dataTypes: ['ethics_violations'],
    updateFrequency: 'weekly',
    reliability: 'community'
  },
  {
    id: 'quiver-quant-congress',
    name: 'Quiver Quantitative Congress Trading',
    url: 'https://www.quiverquant.com/congresstrading/',
    type: 'api',
    category: 'ETHICS_COMPLIANCE',
    description: 'Congressional trading analysis',
    coverage: 'federal',
    dataTypes: ['ethics_violations'],
    updateFrequency: 'weekly',
    reliability: 'community'
  }
];

// ============================================================================
// COMBINED SOURCE MANIFEST
// ============================================================================
export const ALL_POLITICAL_SOURCES: PoliticalDataSource[] = [
  ...FEC_SOURCES,
  ...OPENSECRETS_SOURCES,
  ...LOBBYIST_SOURCES,
  ...STATE_FINANCE_SOURCES,
  ...NONPROFIT_SOURCES,
  ...WATCHDOG_SOURCES,
  ...FOREIGN_INFLUENCE_SOURCES,
  ...ETHICS_SOURCES
];

// Live RSS feeds that can be fetched without API keys
export const POLITICAL_LIVE_FEEDS: PoliticalDataSource[] = ALL_POLITICAL_SOURCES.filter(
  source => source.type === 'rss'
);

// APIs that require authentication
export const POLITICAL_API_SOURCES: PoliticalDataSource[] = ALL_POLITICAL_SOURCES.filter(
  source => source.type === 'api'
);

// Summary statistics
export const SOURCE_STATS = {
  totalSources: ALL_POLITICAL_SOURCES.length,
  fecSources: FEC_SOURCES.length,
  openSecretsSources: OPENSECRETS_SOURCES.length,
  lobbyistSources: LOBBYIST_SOURCES.length,
  stateSources: STATE_FINANCE_SOURCES.length,
  nonprofitSources: NONPROFIT_SOURCES.length,
  watchdogSources: WATCHDOG_SOURCES.length,
  foreignSources: FOREIGN_INFLUENCE_SOURCES.length,
  ethicsSources: ETHICS_SOURCES.length,
  rssFeedsCount: POLITICAL_LIVE_FEEDS.length,
  apiSourcesCount: POLITICAL_API_SOURCES.length,
  officialSources: ALL_POLITICAL_SOURCES.filter(s => s.reliability === 'official').length,
  verifiedSources: ALL_POLITICAL_SOURCES.filter(s => s.reliability === 'verified').length,
  federalCoverage: ALL_POLITICAL_SOURCES.filter(s => s.coverage === 'federal').length,
  stateCoverage: ALL_POLITICAL_SOURCES.filter(s => s.coverage === 'state').length
};

// Mock donor data for demonstration
export interface DonorProfile {
  id: string;
  name: string;
  occupation: string;
  employer: string;
  city: string;
  state: string;
  totalContributions: number;
  contributionCount: number;
  topRecipients: { name: string; amount: number; type: string }[];
  recentContributions: { date: string; recipient: string; amount: number }[];
  affiliations: string[];
}

export interface LobbyistProfile {
  id: string;
  name: string;
  firm: string;
  registrationDate: string;
  clients: { name: string; industry: string; amount: number }[];
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
  topDonors: { name: string; amount: number; type: string }[];
  topIndustries: { industry: string; amount: number }[];
}

// Sample demonstration data
export const SAMPLE_DONORS: DonorProfile[] = [
  {
    id: 'd1',
    name: 'Sample Donor A',
    occupation: 'CEO',
    employer: 'Technology Corp',
    city: 'San Francisco',
    state: 'CA',
    totalContributions: 250000,
    contributionCount: 45,
    topRecipients: [
      { name: 'Senate Candidate X', amount: 5800, type: 'candidate' },
      { name: 'Tech PAC', amount: 50000, type: 'pac' }
    ],
    recentContributions: [
      { date: '2024-01-15', recipient: 'Senate Candidate X', amount: 2900 },
      { date: '2024-01-10', recipient: 'Tech PAC', amount: 25000 }
    ],
    affiliations: ['Tech Industry Association', 'Business Roundtable']
  }
];

export const SAMPLE_LOBBYISTS: LobbyistProfile[] = [
  {
    id: 'l1',
    name: 'Sample Lobbyist B',
    firm: 'Capitol Consulting Group',
    registrationDate: '2020-03-15',
    clients: [
      { name: 'Pharma Corp', industry: 'Pharmaceuticals', amount: 500000 },
      { name: 'Insurance Co', industry: 'Insurance', amount: 350000 }
    ],
    lobbyingTargets: ['Senate Finance Committee', 'House Ways & Means'],
    issues: ['Healthcare', 'Tax Policy', 'Drug Pricing'],
    totalCompensation: 850000
  }
];

export const SAMPLE_RECIPIENTS: RecipientProfile[] = [
  {
    id: 'r1',
    name: 'Sample Candidate Y',
    type: 'candidate',
    party: 'Democratic',
    office: 'Senate',
    state: 'NY',
    totalRaised: 15000000,
    topDonors: [
      { name: 'Finance PAC', amount: 500000, type: 'pac' },
      { name: 'Individual Donor A', amount: 5800, type: 'individual' }
    ],
    topIndustries: [
      { industry: 'Finance/Insurance', amount: 2500000 },
      { industry: 'Lawyers/Law Firms', amount: 1800000 }
    ]
  }
];
