# Supabase Database Schema Enhancements

## Overview

This document outlines suggested database schema expansions to support more robust money trail analysis, time-series tracking, and investigative features for the Political Donor Tracker.

## Current Schema (Summary)

### Existing Tables
1. **donors** - Individual/organizational donors with net worth
2. **media_funding** - Donor-to-media outlet connections
3. **pac_contributions** - PAC summary data
4. **pac_contributions_detail** - Detailed PAC transactions
5. **political_recipients** - Politicians and their vote records
6. **organizations** - Foundations, think tanks, lobbying firms
7. **network_nodes** - Unified network graph nodes (104 nodes)
8. **network_edges** - Network connections (relationships)

---

## Proposed Enhancements

### 1. Transaction History Table

**Purpose**: Track individual monetary transactions over time for trend analysis

```sql
CREATE TABLE transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transaction Identifiers
  source_entity_id TEXT NOT NULL, -- Links to network_nodes.id
  target_entity_id TEXT NOT NULL, -- Links to network_nodes.id

  -- Transaction Details
  amount NUMERIC(15, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL, -- 'donation', 'grant', 'investment', 'advertising', 'consulting_fee'

  -- Metadata
  purpose TEXT, -- Purpose of transaction
  is_disclosed BOOLEAN DEFAULT true,
  disclosure_source TEXT, -- FEC filing ID, 990 form, etc.
  confidence_score NUMERIC(3, 2) CHECK (confidence_score BETWEEN 0 AND 1), -- 0.0 to 1.0

  -- Source Attribution
  data_source TEXT NOT NULL, -- 'fec', 'irs_990', 'opensecrets', 'propublica', 'manual'
  source_url TEXT,
  verified_date DATE,
  verified_by TEXT,

  -- Deduplication
  dedup_hash TEXT UNIQUE, -- Hash of key fields to prevent duplicates

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT fk_source FOREIGN KEY (source_entity_id) REFERENCES network_nodes(id) ON DELETE CASCADE,
  CONSTRAINT fk_target FOREIGN KEY (target_entity_id) REFERENCES network_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_transaction_history_source ON transaction_history(source_entity_id);
CREATE INDEX idx_transaction_history_target ON transaction_history(target_entity_id);
CREATE INDEX idx_transaction_history_date ON transaction_history(transaction_date);
CREATE INDEX idx_transaction_history_amount ON transaction_history(amount);
CREATE INDEX idx_transaction_history_type ON transaction_history(transaction_type);
```

**Use Cases**:
- Time-series analysis: "Show me all funding from Soros Foundation to Media Matters over last 5 years"
- Trend detection: "Has funding increased/decreased over time?"
- Seasonal patterns: "Which entities donate more in election years?"
- Animated network replay: Visualize network evolution month-by-month

---

### 2. Entity Metadata Table

**Purpose**: Rich biographical and contextual information for entities

```sql
CREATE TABLE entity_metadata (
  entity_id TEXT PRIMARY KEY, -- Links to network_nodes.id

  -- Biographical Info
  full_name TEXT,
  aliases TEXT[], -- Other names, maiden names, company name changes
  birth_date DATE,
  birth_place TEXT,
  current_residence_city TEXT,
  current_residence_state TEXT,
  current_residence_country TEXT DEFAULT 'US',

  -- Professional Background
  education TEXT[], -- Array of "Institution - Degree - Year"
  career_history JSONB, -- [{company, role, start_year, end_year, description}]
  board_memberships TEXT[], -- Current board positions
  past_board_memberships TEXT[], -- Historical board positions

  -- Business Interests
  companies_owned TEXT[], -- Companies they own or control
  stock_holdings JSONB, -- [{ticker, shares, value, as_of_date}]
  real_estate_holdings JSONB, -- [{address, value, purchase_date}]

  -- Political Information
  political_registrations JSONB, -- [{party, state, registration_date, status}]
  political_donations_summary JSONB, -- {total_donated, recipient_count, avg_donation, largest_recipient}
  lobbying_activity JSONB, -- [{year, amount_spent, issues}]

  -- Media Presence
  social_media_handles JSONB, -- {twitter, linkedin, facebook, instagram, tiktok}
  website_url TEXT,
  wikipedia_url TEXT,
  news_mentions_count INTEGER DEFAULT 0,

  -- Controversy & Risk Indicators
  legal_issues TEXT[], -- Lawsuits, investigations, convictions
  ethics_violations TEXT[], -- Congressional ethics complaints, etc.
  sanctions JSONB, -- [{sanctioning_body, reason, date}]
  foreign_agent_status BOOLEAN DEFAULT false,
  fara_registration_number TEXT, -- Foreign Agents Registration Act ID

  -- Relationships
  family_members JSONB, -- [{name, relationship, political_activity}]
  known_associates TEXT[], -- Frequently connected individuals

  -- Source Attribution
  sources JSONB NOT NULL DEFAULT '[]', -- [{source_name, url, accessed_date}]
  last_verified DATE,
  data_quality_score NUMERIC(3, 2) CHECK (data_quality_score BETWEEN 0 AND 1),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_entity FOREIGN KEY (entity_id) REFERENCES network_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_entity_metadata_name ON entity_metadata(full_name);
CREATE INDEX idx_entity_metadata_residence ON entity_metadata(current_residence_state);
CREATE INDEX idx_entity_metadata_foreign_agent ON entity_metadata(foreign_agent_status);
```

**Use Cases**:
- Rich entity detail panels in UI
- Search by education (e.g., "All Harvard Business School grads who donate to PACs")
- Conflict of interest detection (e.g., "Board members who lobby their own companies")
- Geographic clustering (e.g., "Major donors from Silicon Valley")

---

### 3. Watchlist / Bookmarks Table

**Purpose**: Allow users to save entities of interest for monitoring

```sql
CREATE TABLE user_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Identity (if multi-user in future)
  user_id TEXT NOT NULL DEFAULT 'default_user',

  -- Watchlist Details
  watchlist_name TEXT NOT NULL,
  description TEXT,
  entity_ids TEXT[] NOT NULL, -- Array of network_nodes.id

  -- Alert Configuration
  alert_on_new_connections BOOLEAN DEFAULT true,
  alert_on_new_transactions BOOLEAN DEFAULT true,
  alert_threshold_amount NUMERIC(15, 2), -- Only alert if transaction > this amount

  -- Sharing (for collaborative investigations)
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE, -- For sharing via URL

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_watchlists_user ON user_watchlists(user_id);
CREATE INDEX idx_watchlists_entities ON user_watchlists USING GIN(entity_ids);
```

**Use Cases**:
- "Save this donor for later investigation"
- "Alert me when George Soros makes a new donation over $100k"
- Share investigation boards with colleagues
- Track multiple entities simultaneously

---

### 4. Alert Log Table

**Purpose**: Record alerts triggered by watchlist rules

```sql
CREATE TABLE alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alert Details
  watchlist_id UUID NOT NULL,
  entity_id TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'new_connection', 'new_transaction', 'entity_update'
  alert_message TEXT NOT NULL,

  -- Related Data
  related_transaction_id UUID, -- Links to transaction_history.id
  related_entity_id TEXT, -- New entity they connected to

  -- Status
  is_read BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,

  -- Timestamps
  triggered_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_watchlist FOREIGN KEY (watchlist_id) REFERENCES user_watchlists(id) ON DELETE CASCADE
);

CREATE INDEX idx_alert_log_watchlist ON alert_log(watchlist_id);
CREATE INDEX idx_alert_log_read ON alert_log(is_read);
CREATE INDEX idx_alert_log_triggered ON alert_log(triggered_at);
```

**Use Cases**:
- Notification system for monitored entities
- Audit trail of interesting developments
- RSS feed of watchlist activity

---

### 5. Media Content Table

**Purpose**: Track articles, op-eds, and content from media outlets to analyze bias and funding correlation

```sql
CREATE TABLE media_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content Identifiers
  outlet_id TEXT NOT NULL, -- Links to network_nodes.id (where type='media')
  article_url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,

  -- Publication Details
  published_date DATE NOT NULL,
  article_type TEXT, -- 'news', 'opinion', 'editorial', 'sponsored'

  -- Content Analysis
  excerpt TEXT, -- First 500 chars
  word_count INTEGER,
  sentiment_score NUMERIC(3, 2), -- -1.0 (negative) to 1.0 (positive)
  political_lean_score NUMERIC(3, 2), -- -1.0 (left) to 1.0 (right)

  -- Topic Classification
  topics TEXT[], -- ['israel', 'ukraine', 'climate', 'healthcare']
  entities_mentioned TEXT[], -- Network nodes mentioned in article
  politicians_mentioned TEXT[], -- Politicians mentioned

  -- Engagement Metrics
  social_shares INTEGER,
  comments_count INTEGER,

  -- Source Attribution
  scraped_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_outlet FOREIGN KEY (outlet_id) REFERENCES network_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_media_content_outlet ON media_content(outlet_id);
CREATE INDEX idx_media_content_published ON media_content(published_date);
CREATE INDEX idx_media_content_topics ON media_content USING GIN(topics);
CREATE INDEX idx_media_content_entities ON media_content USING GIN(entities_mentioned);
```

**Use Cases**:
- "Show me all CNN articles mentioning George Soros in 2024"
- Bias analysis: "Does outlet coverage correlate with donor funding?"
- Content trends: "Which topics get most coverage from funded outlets?"
- Entity influence: "How often is this donor mentioned positively vs negatively?"

---

### 6. Lobbying Activities Table

**Purpose**: Detailed lobbying disclosures linked to entities and issues

```sql
CREATE TABLE lobbying_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lobbying Firm / Lobbyist
  lobbyist_entity_id TEXT NOT NULL, -- Links to network_nodes.id
  client_entity_id TEXT, -- Who they're lobbying for

  -- Lobbying Details
  filing_year INTEGER NOT NULL,
  filing_quarter TEXT, -- 'Q1', 'Q2', 'Q3', 'Q4'
  income_amount NUMERIC(15, 2), -- Lobbying income
  expense_amount NUMERIC(15, 2), -- Lobbying expenses

  -- Issues & Targets
  issues TEXT[] NOT NULL, -- ['defense', 'foreign_affairs', 'israel', 'tech_regulation']
  specific_issues TEXT, -- Detailed description of what they lobbied on
  government_entities_lobbied TEXT[], -- ['House Foreign Affairs Committee', 'Senate Armed Services']
  politicians_lobbied TEXT[], -- Specific politicians contacted

  -- Bill Tracking
  bills_mentioned TEXT[], -- ['H.R. 1234', 'S. 5678']

  -- Registration Info
  lda_filing_id TEXT, -- Lobbying Disclosure Act filing ID
  filing_url TEXT,
  filing_date DATE,

  -- Foreign Influence
  is_foreign_entity BOOLEAN DEFAULT false,
  foreign_country TEXT,
  fara_related BOOLEAN DEFAULT false,

  -- Source
  data_source TEXT DEFAULT 'senate_lda',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_lobbyist FOREIGN KEY (lobbyist_entity_id) REFERENCES network_nodes(id) ON DELETE CASCADE,
  CONSTRAINT fk_client FOREIGN KEY (client_entity_id) REFERENCES network_nodes(id) ON DELETE SET NULL
);

CREATE INDEX idx_lobbying_lobbyist ON lobbying_activities(lobbyist_entity_id);
CREATE INDEX idx_lobbying_client ON lobbying_activities(client_entity_id);
CREATE INDEX idx_lobbying_year ON lobbying_activities(filing_year);
CREATE INDEX idx_lobbying_issues ON lobbying_activities USING GIN(issues);
CREATE INDEX idx_lobbying_foreign ON lobbying_activities(is_foreign_entity);
```

**Use Cases**:
- "Show me all lobbying on Israel-related bills in 2024"
- "Which politicians are most frequently lobbied by AIPAC?"
- Follow the money: "This donor funds this foundation, which employs this lobbyist, who lobbies this politician"
- Foreign influence: "Which foreign entities are lobbying on US policy?"

---

### 7. Political Positions Table

**Purpose**: Track politician stances on key issues to correlate with donor influence

```sql
CREATE TABLE political_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Politician
  politician_entity_id TEXT NOT NULL, -- Links to network_nodes.id (where type='politician')

  -- Issue & Position
  issue_category TEXT NOT NULL, -- 'foreign_policy', 'israel', 'ukraine', 'climate', 'healthcare'
  specific_issue TEXT NOT NULL, -- 'Israel military aid', 'Ukraine aid package', etc.
  position_stance TEXT NOT NULL, -- 'strong_support', 'support', 'neutral', 'oppose', 'strong_oppose'
  position_score NUMERIC(3, 2), -- -1.0 (strongly oppose) to 1.0 (strongly support)

  -- Evidence
  evidence_type TEXT, -- 'vote', 'statement', 'speech', 'press_release', 'interview'
  vote_bill_id TEXT, -- Bill number if evidence_type='vote'
  vote_result TEXT, -- 'yes', 'no', 'abstain', 'present'
  vote_date DATE,
  statement_text TEXT,
  source_url TEXT NOT NULL,

  -- Context
  cosponsor BOOLEAN DEFAULT false, -- Did they cosponsor the bill?
  cosponsor_rank INTEGER, -- 1 = primary sponsor

  -- Timestamps
  position_date DATE NOT NULL, -- When they took this position
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_politician FOREIGN KEY (politician_entity_id) REFERENCES network_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_positions_politician ON political_positions(politician_entity_id);
CREATE INDEX idx_positions_issue ON political_positions(issue_category);
CREATE INDEX idx_positions_stance ON political_positions(position_stance);
CREATE INDEX idx_positions_date ON political_positions(position_date);
```

**Use Cases**:
- "How did this politician vote on Israel aid bills?"
- Donor influence analysis: "Politician changed stance after receiving $500k from pro-Israel PAC"
- Issue tracking: "Which politicians support Ukraine aid?"
- Correlation analysis: "Is there a relationship between donor funding and vote alignment?"

---

### 8. Network Edge Metadata Table

**Purpose**: Enrich network connections with detailed provenance and strength indicators

```sql
CREATE TABLE network_edge_metadata (
  edge_id UUID PRIMARY KEY, -- Links to network_edges (need to add id column to network_edges first)

  -- Relationship Strength
  interaction_frequency INTEGER, -- Number of documented interactions
  total_transaction_value NUMERIC(15, 2), -- Sum of all transactions
  avg_transaction_value NUMERIC(15, 2),
  first_interaction_date DATE,
  last_interaction_date DATE,
  relationship_duration_days INTEGER,

  -- Relationship Quality
  public_acknowledgment BOOLEAN DEFAULT false, -- Do they publicly acknowledge the relationship?
  shared_events INTEGER DEFAULT 0, -- How many events did they both attend?
  mutual_connections INTEGER DEFAULT 0, -- How many entities connect to both?

  -- Evidence Quality
  source_count INTEGER DEFAULT 1, -- How many independent sources confirm this connection?
  source_quality_score NUMERIC(3, 2), -- 0.0 (rumors) to 1.0 (official filings)
  controversy_level TEXT, -- 'none', 'minor', 'moderate', 'major'
  controversy_description TEXT,

  -- Red Flags
  timing_suspicious BOOLEAN DEFAULT false, -- Transaction right before vote, etc.
  undisclosed BOOLEAN DEFAULT false, -- Should have been disclosed but wasn't
  shell_org_involved BOOLEAN DEFAULT false, -- Routed through shell organization
  foreign_involvement BOOLEAN DEFAULT false, -- Foreign entity in the chain

  -- Notes
  investigator_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_edge_metadata_strength ON network_edge_metadata(total_transaction_value);
CREATE INDEX idx_edge_metadata_controversy ON network_edge_metadata(controversy_level);
CREATE INDEX idx_edge_metadata_red_flags ON network_edge_metadata(timing_suspicious, undisclosed, shell_org_involved, foreign_involvement);
```

**Use Cases**:
- Prioritize investigation: "Show me high-value, suspicious connections first"
- Relationship strength visualization: "Make edges thicker for stronger relationships"
- Red flag filtering: "Show only connections with 3+ red flags"
- Timeline analysis: "Show relationships that started right before major policy changes"

---

### 9. Investigation Sessions Table

**Purpose**: Save and share complex network analysis sessions

```sql
CREATE TABLE investigation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session Metadata
  session_name TEXT NOT NULL,
  description TEXT,
  investigator TEXT DEFAULT 'anonymous',

  -- Saved State
  focused_entity_ids TEXT[], -- Which entities were being investigated
  applied_filters JSONB, -- {node_types: [], relationships: [], date_range: {}}
  network_layout JSONB, -- {node_positions: {}, zoom: 1.0, pan: {x: 0, y: 0}}
  highlighted_paths JSONB, -- Saved path traces

  -- Findings
  key_findings TEXT[],
  flagged_connections UUID[], -- network_edge IDs
  notes TEXT,

  -- Sharing
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  collaborators TEXT[], -- Email addresses or user IDs

  -- Export
  exported_at TIMESTAMPTZ,
  export_format TEXT, -- 'json', 'pdf', 'csv'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investigations_investigator ON investigation_sessions(investigator);
CREATE INDEX idx_investigations_public ON investigation_sessions(is_public);
CREATE INDEX idx_investigations_accessed ON investigation_sessions(last_accessed);
```

**Use Cases**:
- "Save this investigation for tomorrow"
- Share findings: "Here's a link to my George Soros funding network analysis"
- Collaborative research: "Add Sarah as a collaborator on this investigation"
- Resume work: "Load my last session and continue where I left off"

---

### 10. Data Source Quality Table

**Purpose**: Track reliability and update frequency of data sources

```sql
CREATE TABLE data_source_quality (
  source_name TEXT PRIMARY KEY, -- 'fec', 'opensecrets', 'propublica', etc.

  -- Quality Metrics
  reliability_score NUMERIC(3, 2) CHECK (reliability_score BETWEEN 0 AND 1),
  completeness_score NUMERIC(3, 2) CHECK (completeness_score BETWEEN 0 AND 1),
  update_frequency TEXT, -- 'realtime', 'daily', 'weekly', 'monthly', 'quarterly', 'annually'

  -- Update Tracking
  last_successful_fetch TIMESTAMPTZ,
  last_failed_fetch TIMESTAMPTZ,
  fetch_success_rate NUMERIC(5, 2), -- Percentage

  -- Coverage
  record_count INTEGER DEFAULT 0,
  date_range_start DATE,
  date_range_end DATE,

  -- API Details
  api_endpoint TEXT,
  api_rate_limit INTEGER, -- Requests per hour
  api_key_required BOOLEAN DEFAULT false,

  -- Metadata
  source_url TEXT,
  documentation_url TEXT,
  contact_email TEXT,

  -- Notes
  known_issues TEXT[],
  data_gaps TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Use Cases**:
- Data quality dashboard: "Which sources are most reliable?"
- Update monitoring: "When was FEC data last refreshed?"
- Source selection: "Use OpenSecrets for PAC data (99% reliable) over scraped data (60% reliable)"
- Troubleshooting: "Why is this entity missing? Check source coverage dates"

---

## Implementation Priority

### Phase 1: Core Transactional Data (High Priority)
1. **transaction_history** - Essential for time-series and trend analysis
2. **network_edge_metadata** - Enriches existing network with provenance
3. **entity_metadata** - Rich entity details for investigation

### Phase 2: User Features (Medium Priority)
4. **user_watchlists** - User engagement and monitoring
5. **alert_log** - Notification system
6. **investigation_sessions** - Save/share investigations

### Phase 3: Content & Influence Analysis (Medium Priority)
7. **media_content** - Media bias and funding correlation
8. **lobbying_activities** - Track influence operations
9. **political_positions** - Politician stance tracking

### Phase 4: Quality & Metadata (Lower Priority)
10. **data_source_quality** - System health and reliability

---

## Migration Strategy

### Step 1: Add Tables Incrementally
```sql
-- Example: Start with transaction_history
BEGIN;
  -- Create table
  CREATE TABLE transaction_history (...);

  -- Create indexes
  CREATE INDEX idx_transaction_history_source ON transaction_history(source_entity_id);

  -- Add RLS policies if needed
  ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

COMMIT;
```

### Step 2: Backfill Historical Data
```sql
-- Migrate existing PAC contribution data to transaction_history
INSERT INTO transaction_history (
  source_entity_id,
  target_entity_id,
  amount,
  transaction_date,
  transaction_type,
  data_source
)
SELECT
  pac.donor_id,
  rec.id,
  pac.amount,
  COALESCE(pac.contribution_date, (pac.election_cycle || '-01-01')::DATE),
  'donation',
  pac.data_source
FROM pac_contributions_detail pac
JOIN political_recipients rec ON pac.recipient_name = rec.name;
```

### Step 3: Update Application Code
```typescript
// New service method in supabaseService.ts
async getTransactionHistory(
  entityId: string,
  options?: { startDate?: Date; endDate?: Date; minAmount?: number }
): Promise<Transaction[]> {
  let query = supabase
    .from('transaction_history')
    .select('*')
    .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)
    .order('transaction_date', { ascending: false });

  if (options?.startDate) {
    query = query.gte('transaction_date', options.startDate.toISOString());
  }
  if (options?.endDate) {
    query = query.lte('transaction_date', options.endDate.toISOString());
  }
  if (options?.minAmount) {
    query = query.gte('amount', options.minAmount);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
```

---

## Visualization Enhancements Enabled

With this enhanced schema, the UI can support:

### 1. **Time-Series Network Animation**
```typescript
// Replay network evolution over time
const NetworkTimeline: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2020-01-01'));
  const transactions = useTransactionsUpTo(currentDate);
  const networkSnapshot = buildNetworkFromTransactions(transactions);

  return (
    <div>
      <NetworkVisualization data={networkSnapshot} />
      <TimelineSlider value={currentDate} onChange={setCurrentDate} />
    </div>
  );
};
```

### 2. **Funding Flow Sankey Diagram**
```typescript
// Show money flowing from donors → PACs → politicians
<SankeyDiagram
  nodes={entities}
  links={transactions.map(t => ({
    source: t.source_entity_id,
    target: t.target_entity_id,
    value: t.amount
  }))}
/>
```

### 3. **Entity Detail Panel with Timeline**
```typescript
<EntityDetailPanel entity={selectedEntity}>
  <TransactionTimeline transactions={entityTransactions} />
  <RelatedEntities connections={entityConnections} />
  <MediaMentions articles={entityMentions} />
  <LobbyingActivity lobbying={entityLobbying} />
  <PoliticalPositions positions={entityVotes} />
</EntityDetailPanel>
```

### 4. **Controversy Heatmap**
```typescript
// Visualize high-risk connections
<NetworkVisualization
  colorEdges={(edge) => {
    const metadata = edgeMetadata[edge.id];
    const riskScore = calculateRiskScore(metadata);
    return riskScoreToColor(riskScore); // Red = high risk
  }}
/>
```

---

## Data Collection Recommendations

### Automated Scraping
1. **FEC API** - Daily updates for new filings
2. **OpenSecrets API** - Weekly PAC contribution summaries
3. **Senate LDA** - Quarterly lobbying disclosures
4. **ProPublica Congress API** - Daily vote records
5. **MediaStack API** - Daily media article scraping
6. **Twitter API** - Monitor entity social media

### Manual Curation
1. **High-profile investigations** - ProPublica, NYT investigative pieces
2. **Court documents** - PACER filings for legal issues
3. **FARA registrations** - Foreign agent disclosures
4. **Foundation 990s** - Annual tax filings for foundations

### User Contributions
1. **Crowdsourced tips** - Allow users to submit evidence with URLs
2. **Document uploads** - PDFs of filings, screenshots
3. **Verification system** - Multiple users must confirm before accepting

---

## Performance Considerations

### Indexing Strategy
- **B-tree indexes** on frequently filtered columns (dates, amounts, types)
- **GIN indexes** on array and JSONB columns for fast containment queries
- **Partial indexes** on boolean flags (e.g., `WHERE foreign_involvement = true`)

### Partitioning
For large tables (millions of rows), consider partitioning:
```sql
-- Partition transaction_history by year
CREATE TABLE transaction_history (
  -- columns
) PARTITION BY RANGE (transaction_date);

CREATE TABLE transaction_history_2020 PARTITION OF transaction_history
  FOR VALUES FROM ('2020-01-01') TO ('2021-01-01');

CREATE TABLE transaction_history_2021 PARTITION OF transaction_history
  FOR VALUES FROM ('2021-01-01') TO ('2022-01-01');
-- etc.
```

### Materialized Views
Pre-compute expensive aggregations:
```sql
CREATE MATERIALIZED VIEW entity_funding_summary AS
SELECT
  source_entity_id,
  COUNT(*) as transaction_count,
  SUM(amount) as total_given,
  AVG(amount) as avg_transaction,
  MIN(transaction_date) as first_transaction,
  MAX(transaction_date) as last_transaction
FROM transaction_history
GROUP BY source_entity_id;

CREATE INDEX ON entity_funding_summary(source_entity_id);

-- Refresh daily
REFRESH MATERIALIZED VIEW CONCURRENTLY entity_funding_summary;
```

---

## Security & Privacy

### Row-Level Security (RLS)
```sql
-- Only show publicly disclosed transactions
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public transactions only" ON transaction_history
  FOR SELECT USING (is_disclosed = true);

-- Admin users can see everything
CREATE POLICY "Admin full access" ON transaction_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

### PII Handling
- **Anonymize addresses**: Store only city/state, not full addresses
- **Redact SSNs/EINs**: Never store full identifiers
- **Aggregate small donors**: Don't track individuals who donate < $200 (FEC threshold)

---

## Conclusion

These schema enhancements transform the Political Donor Tracker from a static network snapshot into a dynamic investigation platform with:

- **Temporal analysis** - Track changes over time
- **Deep entity profiles** - Rich biographical and financial data
- **User engagement** - Watchlists, alerts, saved investigations
- **Influence tracking** - Lobbying, media, political correlations
- **Data provenance** - Source attribution and quality metrics

Implementation should be phased, starting with high-impact tables (transaction_history, entity_metadata, network_edge_metadata) before moving to user features and advanced analytics.
