# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Political Donor Tracker is a React TypeScript application for tracking campaign finance data, lobbyist activities, and political contributions. It aggregates data from 55+ political finance sources including FEC, Senate LDA, and ProPublica. Features D3.js network visualizations for donor-media relationships powered by Supabase.

## Development Commands

```bash
npm run dev           # Start Vite development server (localhost:5173)
npm run build         # Run ESLint + TypeScript check + Vite production build
npm run lint          # Run ESLint only
npm run preview       # Preview production build locally
npm test              # Run vitest in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report

# Run single test file or by pattern
npm test -- src/services/feedCache.test.ts   # Run specific test file
npm test -- -t "cache expiration"            # Run tests matching pattern
```

## Architecture

### Component Structure

- **Entry**: `src/main.tsx` → `src/App.tsx` → `src/components/PoliticalDonorTracker.tsx`
- **Tab Components** (`src/components/tabs/`): DashboardTab, DonorsTab, NetworkTab, MoneyTrailExplorer
- **Card Components** (`src/components/cards/`): DonorCard, RecipientCard, LobbyistCard, SourceCard
- **D3 Visualizations** (`src/components/d3/`): DonorMediaNetwork, useForceLayout
- **Error Handling**: ErrorBoundary component with HOC wrapper

### Service Layer

Services use dependency injection via React Context for testability. Interfaces are co-located with implementations:

- `politicalApiService.ts` - OpenFEC, Senate LDA, ProPublica APIs with rate limiting and caching (exports `IPoliticalApiService`, `createPoliticalApiService`)
- `supabaseService.ts` - Supabase queries for donors, media_funding, PAC contributions, network graph data (exports `ISupabaseService`, `createSupabaseService`)
- `cache.ts` - TTL-based in-memory cache with expiration tracking (exports `SimpleCache`, `createCache`)

Factory functions create service instances that are injected via `ServicesContext`. `src/App.tsx` calls `createDefaultServices()` and wraps the app in `<ServicesProvider>`. Components access services via `useServices()` hook.

**Memory Management**: `src/main.tsx` runs periodic cache cleanup via `setInterval(() => appCache.clearExpired(), 60000)` to prevent memory leaks from expired cache entries.

**Important**: Services return real API data only - no mock data fallbacks. When APIs are unavailable, errors are surfaced to users.

### Hooks

- `usePoliticalData.ts` - FEC/Senate API state, loading/error handling, search actions. Uses `useServices()` to access `politicalApiService`
- `useSupabaseData.ts` - Supabase data fetching for network visualization. Uses `useServices()` to access `supabaseService`

### D3 + React Integration

D3 handles physics/layout calculations, React handles DOM rendering. The simulation runs in useEffect with `useRef` for positions during active simulation, `useState` only when simulation settles (alpha < 0.1).

### Data Flow for Network Visualization

1. `useSupabaseData` calls `supabaseService.getDonorMediaNetwork()`
2. Service queries `network_nodes` + `network_edges` tables from Supabase
3. Maps database columns to frontend types (`NetworkNode`, `NetworkLink`)
4. `DonorMediaNetwork` receives `{ nodes: NetworkNode[], links: NetworkLink[] }`
5. `useForceLayout` runs D3 force simulation, returns positioned nodes/links
6. React renders SVG elements based on simulation output

## Environment Variables

```
VITE_OPENFEC_API_KEY     # Optional - falls back to DEMO_KEY with stricter rate limits
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_ANON_KEY   # Supabase anonymous key for client-side queries
```

Environment validation in `src/lib/supabase.ts` logs warnings in development when variables are missing.

## Key Patterns

### API Response Handling
Profile fetch methods return `{ data: T | null; source: 'api'; error?: string }`. No mock data - errors are surfaced to users with helpful messages.

### Supabase Integration
- Client initialized in `src/lib/supabase.ts` with inline environment warnings in development
- Service layer checks `isSupabaseConfigured()` before queries
- Tables: `donors`, `media_funding`, `pac_contributions`, `pac_contributions_detail`, `political_recipients`, `network_nodes`, `network_edges`
- Network graph uses `network_nodes` and `network_edges` tables for D3 visualization data

### RSS Feed Parsing
Uses browser-native DOMParser (not regex) for XML parsing. Multi-proxy fallback: rss2json → allorigins → corsproxy.

## Type System

- `src/types/political.ts` - FEC API types, LDA types, profile types
- `src/types/supabase.ts` - Supabase table types, NetworkNode, NetworkLink
- `src/types/index.ts` - Feed-related types

## Tech Stack

- React 19, TypeScript 5.9, Vite 7
- Tailwind CSS 3.4
- Recharts (bar/pie charts), D3.js v7 (network graphs)
- Supabase (enriched donor data)
- Vitest + Testing Library (testing)

## Testing

Test setup in `src/test/setup.ts` provides global mocks for:
- `ResizeObserver` (D3 components)
- `matchMedia` (UI components)
- `IntersectionObserver`

### Test Structure

- **Unit Tests**: Mock dependencies using factory functions
  - `cache.test.ts` - TTL expiration, memory management, clearExpired()
  - `politicalApiService.test.ts` - Rate limiting, caching, API error handling
  - `feedCache.test.ts` - RSS feed caching behavior
  - `formatting.test.ts` - Utility function validation

- **Integration Tests**: Connect to real Supabase database
  - `supabaseService.integration.test.ts` - Real database queries, uses `describe.skipIf(!supabase)` to skip when unconfigured
  - Creates test data in `beforeAll()`, cleans up in `afterAll()`
  - Validates against actual production data (20 donors, 3 media outlets, 104 network nodes)

### Writing Tests

Mock services in tests by passing mock dependencies to factory functions:

```typescript
const mockCache: SimpleCache = {
  get: vi.fn().mockReturnValue(null),
  set: vi.fn(),
  // ... other methods
};
const service = createPoliticalApiService(mockCache);
```

Integration tests require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.

## Deployment

Deployed on Vercel: https://political-donor-tracker.vercel.app
GitHub: https://github.com/zach-wendland/PoliticalDonorTracker
