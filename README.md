# Political Donor Tracker

A comprehensive campaign finance intelligence platform built with React, TypeScript, and D3.js. Track political contributions, lobbyist activities, and visualize donor-media ownership networks.

![Network Visualization](docs/network-screenshot.png)

## Features

### Data Intelligence
- **55+ integrated data sources** including official government databases and watchdog organizations
- **FEC API integration** for real-time campaign finance data
- **Senate LDA integration** for lobbyist disclosure data
- **RSS feed aggregation** from political finance watchdog sources

### Interactive Visualizations
- **D3.js Force-Directed Network Graph** - Visualize connections between wealthy donors and media outlets they fund, own, or invest in
- **Recharts dashboards** - Category distributions, data type coverage, and contribution analytics
- **Interactive filtering** - Filter by relationship type, donor type, media type

### Data Profiles
- **Donor Profiles** - Track individual and organizational political contributions
- **Recipient Tracking** - Candidates, PACs, Super PACs, and political organizations
- **Lobbyist Disclosures** - Registered lobbyists, their clients, and lobbying activities

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts (bar/pie charts), D3.js (network graphs)
- **Backend Data**: Supabase (enriched donor data)
- **APIs**: OpenFEC API, Senate LDA API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/zach-wendland/PoliticalDonorTracker.git
cd PoliticalDonorTracker

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# OpenFEC API Key (get one at https://api.open.fec.gov/developers/)
VITE_OPENFEC_API_KEY=your_api_key_here

# Supabase Configuration (for enriched donor data)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Project Structure

```
src/
├── components/
│   ├── d3/                          # D3.js visualizations
│   │   ├── DonorMediaNetwork.tsx    # Force-directed network graph
│   │   ├── useForceLayout.ts        # D3 force simulation hook
│   │   └── index.ts
│   └── PoliticalDonorTracker.tsx    # Main application component
├── config/
│   └── politicalFinanceSources.ts   # Data source configuration
├── hooks/
│   ├── usePoliticalData.ts          # FEC/Senate API data hook
│   └── useSupabaseData.ts           # Supabase data hook
├── lib/
│   └── supabase.ts                  # Supabase client
├── services/
│   ├── politicalApiService.ts       # FEC/Senate API service
│   ├── supabaseService.ts           # Supabase query service
│   ├── feedService.ts               # RSS feed aggregation
│   └── feedCache.ts                 # Feed caching
└── types/
    ├── political.ts                 # Political data types
    └── supabase.ts                  # Supabase schema types
```

## Data Sources

### Official Government Sources
- FEC Campaign Finance Data
- Senate Lobbying Disclosure Act Database
- House Ethics Financial Disclosures
- FARA (Foreign Agents Registration Act)

### Watchdog Organizations
- OpenSecrets / Center for Responsive Politics
- ProPublica Nonprofit Explorer
- Sunlight Foundation
- CREW (Citizens for Responsibility and Ethics)

### State-Level Data
- California FPPC
- Texas Ethics Commission
- New York State Board of Elections
- Florida Division of Elections
- And more...

## Network Visualization

The donor-media network visualization shows:
- **Donors** (green circles) - Sized by net worth, colored by type (individual, foundation, PAC, corporation)
- **Media Outlets** (colored circles) - Colored by type (TV, Print, Digital, Radio, Podcast)
- **Connections** - Lines showing ownership, investment, board membership, and funding relationships

### Interaction
- **Drag nodes** to rearrange layout
- **Hover** for detailed tooltips
- **Click** to highlight connections
- **Filter** by relationship type
- **Zoom** in/out for detail

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Database Schema (Supabase)

The project uses Supabase tables for enriched political data:

| Table | Description |
|-------|-------------|
| `donors` | Wealthy donors with net worth, affiliations, media connections |
| `media_funding` | Donor-to-media outlet funding relationships |
| `pac_contributions` | PAC contribution summaries by type |
| `pac_contributions_detail` | Detailed PAC recipient data |
| `political_recipients` | Politicians with party, state, voting records |

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
