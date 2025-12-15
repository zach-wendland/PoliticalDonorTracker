# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Political Donor Tracker is a React TypeScript application for tracking campaign finance data, lobbyist activities, and political contributions. It aggregates data from 60+ political finance sources including FEC, OpenSecrets, Senate LDA, and state-level portals.

## Development Commands

```bash
npm run dev       # Start Vite development server
npm run build     # Run ESLint + TypeScript check + Vite production build
npm run lint      # Run ESLint only
npm run preview   # Preview production build locally
```

## Architecture

### Core Application Structure

- **Entry**: `src/main.tsx` → `src/App.tsx` → `src/components/PoliticalDonorTracker.tsx`
- **Single Component UI**: The entire dashboard is in `PoliticalDonorTracker.tsx` with tabs for Dashboard, Donors, Recipients, Lobbyists, Data Sources, and Live Feed

### Data Layer

**Services** (`src/services/`):
- `politicalApiService.ts` - Singleton service handling OpenFEC, Senate LDA, and ProPublica APIs with rate limiting, caching, and fallback to mock data
- `feedService.ts` - RSS feed aggregation with multi-proxy distribution (rss2json, allorigins, corsproxy) and automatic fallback
- `feedCache.ts` - TTL-based in-memory cache with automatic expiry cleanup

**API Integration Pattern**:
1. Services check cache first
2. Track rate limits per provider (1000/hour for OpenFEC)
3. Transform API responses to UI-ready profiles (`DonorProfile`, `RecipientProfile`, `LobbyistProfile`)
4. Fall back to sample data on error with clear indicators

**Custom Hook** (`src/hooks/usePoliticalData.ts`):
- Provides all API state, loading/error handling, and search actions
- Manages mock data indicators (`donorUsingMock`, etc.)
- Refreshes API status every 30 seconds

### Configuration

**Data Sources** (`src/config/politicalFinanceSources.ts`):
- Defines 60+ political data sources with metadata (category, reliability, coverage, update frequency)
- Source categories: FEC_FEDERAL, OPENSECRETS, LOBBYIST_DISCLOSURE, STATE_FINANCE, NONPROFIT_DARK_MONEY, WATCHDOG_INVESTIGATIVE, FOREIGN_INFLUENCE, ETHICS_COMPLIANCE
- Sample data for demo/fallback purposes

### Type System

- `src/types/political.ts` - FEC API types, LDA types, ProPublica types, search params, transformed profile types
- `src/types/index.ts` - Feed-related types (FeedItem, RSSItem, RSSResponse)

## Key Patterns

### Environment Variables
```
VITE_OPENFEC_API_KEY    # Optional - falls back to DEMO_KEY with stricter rate limits
```

### API Response Handling
All API methods return `{ data, source: 'api' | 'mock', error?: string }` pattern for graceful degradation.

### UI State
Uses React useState extensively with memoized derived data (useMemo for filtered sources, category distributions). Charts use Recharts library.

## Tech Stack

- React 19 + TypeScript 5.9
- Vite 7 (with manual chunks for react-vendor, chart-vendor, icon-vendor)
- Tailwind CSS 3.4
- Recharts for data visualization
- Lucide React for icons
