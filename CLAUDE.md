# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Political Donor Tracker is a React TypeScript application for tracking campaign finance data, lobbyist activities, and political contributions. It aggregates data from 55+ political finance sources including FEC, OpenSecrets, Senate LDA, and state-level portals. Features D3.js network visualizations for donor-media relationships powered by Supabase.

## Development Commands

```bash
npm run dev       # Start Vite development server (localhost:5173)
npm run build     # Run ESLint + TypeScript check + Vite production build
npm run lint      # Run ESLint only
npm run preview   # Preview production build locally
```

## Architecture

### Core Application Structure

- **Entry**: `src/main.tsx` → `src/App.tsx` → `src/components/PoliticalDonorTracker.tsx`
- **Single Component UI**: The entire dashboard is in `PoliticalDonorTracker.tsx` with tabs: Overview, Donors, Recipients, Lobbyists, Network, Data Sources, Live Feed

### Data Layer

**Services** (`src/services/`):
- `politicalApiService.ts` - Singleton for OpenFEC, Senate LDA, ProPublica APIs with rate limiting, caching, fallback to mock data
- `supabaseService.ts` - Singleton for Supabase queries (donors, media_funding, PAC contributions) with TTL caching
- `feedService.ts` - RSS feed aggregation with multi-proxy distribution and automatic fallback
- `feedCache.ts` - TTL-based in-memory cache with automatic expiry cleanup

**Hooks** (`src/hooks/`):
- `usePoliticalData.ts` - FEC/Senate API state, loading/error handling, search actions, mock data indicators
- `useSupabaseData.ts` - Supabase data fetching for enriched donor profiles and network visualization data

### D3.js Visualizations (`src/components/d3/`)

- `DonorMediaNetwork.tsx` - Force-directed network graph showing donor-media ownership/funding relationships
- `useForceLayout.ts` - D3 force simulation hook (D3 for physics, React for rendering)
- Node types: donors (sized by net worth) and media outlets (colored by type)
- Interactive: drag nodes, zoom, filter by relationship type, hover tooltips

### Data Flow for Network Visualization

1. `useSupabaseData` calls `supabaseService.getDonorMediaNetwork()`
2. Service queries `donors` + `media_funding` tables, builds graph structure
3. `DonorMediaNetwork` receives `{ nodes: NetworkNode[], links: NetworkLink[] }`
4. `useForceLayout` runs D3 force simulation, returns positioned nodes/links
5. React renders SVG elements based on simulation output

### Configuration

**Data Sources** (`src/config/politicalFinanceSources.ts`):
- 55+ sources with metadata (category, reliability, coverage, update frequency)
- Categories: FEC_FEDERAL, OPENSECRETS, LOBBYIST_DISCLOSURE, STATE_FINANCE, NONPROFIT_DARK_MONEY, WATCHDOG_INVESTIGATIVE, FOREIGN_INFLUENCE, ETHICS_COMPLIANCE

### Type System

- `src/types/political.ts` - FEC API types, LDA types, profile types
- `src/types/supabase.ts` - Supabase table types, NetworkNode, NetworkLink, DonorMediaNetwork
- `src/types/index.ts` - Feed-related types

## Environment Variables

```
VITE_OPENFEC_API_KEY     # Optional - falls back to DEMO_KEY with stricter rate limits
VITE_SUPABASE_URL        # Supabase project URL (stonk-data: zgjcdrpcdnommxtahdpr)
VITE_SUPABASE_ANON_KEY   # Supabase anonymous key for client-side queries
```

## Key Patterns

### API Response Handling
All API methods use graceful degradation - return data with source indicator, fall back to mock data on error.

### Supabase Integration
- Client initialized in `src/lib/supabase.ts`
- Service layer checks `isConfigured()` before queries
- Tables: `donors`, `media_funding`, `pac_contributions`, `pac_contributions_detail`, `political_recipients`

### D3 + React Integration
D3 handles physics/layout calculations, React handles DOM rendering. The simulation runs in a useEffect, updates React state on tick events.

## Tech Stack

- React 19, TypeScript 5.9, Vite 7
- Tailwind CSS 3.4
- Recharts (bar/pie charts), D3.js v7 (network graphs)
- Supabase (enriched donor data)
- Lucide React (icons)

## Deployment

Deployed on Vercel: https://political-donor-tracker.vercel.app
GitHub: https://github.com/zach-wendland/PoliticalDonorTracker
