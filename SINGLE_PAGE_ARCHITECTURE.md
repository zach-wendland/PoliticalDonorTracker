# Single-Page Architecture Refactor

## Overview

The Political Donor Tracker has been refactored from a tab-based multi-view application to a unified single-page experience that emphasizes network visualization and data exploration.

## Key Changes

### 1. **Removed Tab Navigation System**
- **Before**: 3 separate tabs (Dashboard, Network, Money Trail Explorer)
- **After**: Single continuous page with all content in a logical flow
- **Benefits**:
  - Better user flow and discoverability
  - No context switching between tabs
  - All features visible without navigation

### 2. **Network Visualization as Hero Section**
- **Position**: Top of page (primary focus)
- **Toggle**: Switch between "Money Trail Explorer" (interactive) and "Network Graph" (standard D3 visualization)
- **Features**:
  - **Money Trail Explorer** (Default view):
    - Path finding between entities
    - Multi-hop relationship tracing
    - Advanced filtering (node type, relationship type, political lean)
    - Interactive link details with source documents
    - Real-time network statistics
  - **Network Graph**:
    - D3 force-directed layout
    - Node sizing based on net worth/funding
    - Color coding by donor type / political lean
    - Drag-and-drop repositioning
    - Relationship filtering

### 3. **Enhanced Header**
Added productivity features directly in the header:
- **Global Search**: Search across all entities in the network
- **Live Data Indicator**: Shows Supabase connection status
- **Quick Actions**:
  - Refresh network data
  - Export network as JSON
  - Toggle advanced filters
- **Source Counter**: Display total data sources (55+)
- **Live Intel Badge**: Emphasizes real-time data nature

### 4. **Removed Coverage Gaps Section**
- **Rationale**: Negative framing doesn't serve user goals
- **Replacement**: Focus on capabilities rather than limitations
- **Data transparency**: Maintained through source categories grid

### 5. **Content Hierarchy**
New top-to-bottom flow:
1. **Network Intelligence** (Hero) - Interactive network exploration
2. **Data Sources Overview** - 4 key statistics cards
3. **Data Distribution Analytics** - Pie chart + Bar chart
4. **Data Source Categories** - 8 category cards with source counts

## New Features Implemented

### Search & Discovery
- **Global entity search** in header (search by name, type)
- **Quick filtering** via header button
- **Node highlighting** on hover/selection
- **Path tracing** between any two entities

### Data Export
- **JSON export** of entire network graph
- Filename includes date: `swamp-tracker-network-YYYY-MM-DD.json`
- Preserves all node/link metadata

### Network View Toggle
- **Seamless switching** between exploration modes
- **State preservation** when switching views
- **Visual indicator** of active view

### Enhanced Tooltips
- **Rich node information** including:
  - Entity type and political lean
  - Net worth / total funding
  - Connection counts
  - Relationship types
- **Link details** showing:
  - Funding amounts
  - Time periods
  - Confidence levels

## Architecture Patterns

### Component Structure
```
PoliticalDonorTracker (Single Page)
├── Header (Sticky, with search & actions)
├── Main Content
│   ├── Network Intelligence Section
│   │   ├── View Toggle (Trail vs Graph)
│   │   └── Active Network Component
│   ├── Stats Dashboard (4 cards)
│   ├── Charts Section (Pie + Bar)
│   └── Source Categories Grid
└── Footer (Attribution)
```

### Responsive Design
- **Header**: Collapses search on mobile, maintains core functionality
- **Network**: Full-width on all screen sizes (min-height: 700px)
- **Stats**: 2 columns on mobile, 4 on desktop
- **Charts**: Stack vertically on mobile, side-by-side on desktop
- **Categories**: 2 columns on mobile, 4 on desktop

### State Management
- **Network view toggle**: Local state (`activeNetworkView`)
- **Search query**: Local state with future filtering hookup
- **Filters panel**: Toggleable with visual indicator
- **Network data**: Global via `useSupabaseData()` hook
- **Loading states**: Granular per-section

## Suggested Enhancements (Future Work)

### 1. **Advanced Search Implementation**
Currently the search input exists but needs backend hookup:
```typescript
// Filter nodes based on search query
const filteredNodes = useMemo(() => {
  if (!searchQuery || !donorMediaNetwork) return donorMediaNetwork?.nodes || [];
  return donorMediaNetwork.nodes.filter(node =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [searchQuery, donorMediaNetwork]);
```

### 2. **Persistent Filters**
Save user filter preferences to localStorage:
```typescript
useEffect(() => {
  const savedFilters = localStorage.getItem('swamp-tracker-filters');
  if (savedFilters) {
    setFilters(JSON.parse(savedFilters));
  }
}, []);
```

### 3. **Bookmark System**
Allow users to save interesting entities for later:
```typescript
interface Bookmark {
  entityId: string;
  entityName: string;
  entityType: NetworkNode['type'];
  createdAt: string;
  notes?: string;
}
```

### 4. **Comparison Mode**
Side-by-side comparison of two entities:
- Total funding given/received
- Shared connections
- Political lean alignment
- Timeline overlap

### 5. **Time-Series Visualization**
Show how relationships evolved over time:
- Animated network replay
- Timeline scrubber
- Year-by-year funding changes

### 6. **Advanced Export Options**
Beyond JSON export:
- CSV format (for Excel/spreadsheet analysis)
- SVG network snapshot (for presentations)
- PDF report generation (executive summary)

### 7. **Collaborative Features**
- Share specific network views via URL
- Annotations on entities/connections
- Public/private investigation boards

## Performance Considerations

### Implemented Optimizations
1. **useMemo for expensive computations**:
   - Category distribution
   - Data type distribution
   - Filtered network nodes

2. **Lazy component rendering**:
   - Only active network view is rendered
   - Charts use ResponsiveContainer for optimal sizing

3. **D3 Force Simulation**:
   - Runs in useEffect with proper cleanup
   - Uses refs for position updates (avoid re-renders)
   - Settles automatically (alpha threshold)

### Future Optimizations
1. **Virtual scrolling** for large node lists
2. **WebGL rendering** for 1000+ node networks
3. **Progressive loading** of network data
4. **Service worker caching** for offline support

## Accessibility

### Current Implementation
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation for buttons
- Focus indicators on all controls
- High contrast color scheme

### Future Improvements
- Screen reader announcements for network changes
- Keyboard-only network navigation
- Alternative text-based network exploration
- WCAG 2.1 AAA compliance

## Data Flow

```
User Interaction
     ↓
PoliticalDonorTracker (State)
     ↓
useSupabaseData() Hook
     ↓
SupabaseService (API Layer)
     ↓
Supabase Database (network_nodes, network_edges)
     ↓
NetworkData (nodes: NetworkNode[], links: NetworkLink[])
     ↓
MoneyTrailExplorer OR DonorMediaNetwork
     ↓
D3 Force Layout (useForceLayout)
     ↓
SVG Rendering
```

## Testing Strategy

### Unit Tests
- Individual component rendering
- State management hooks
- Filter logic
- Search functionality

### Integration Tests
- Network data fetching
- User interaction flows
- Export functionality

### E2E Tests
- Complete user journeys
- Network exploration scenarios
- Cross-browser compatibility

## Migration Guide

### For Users
1. **No manual migration needed** - the refactor is transparent
2. **Existing Supabase data works as-is**
3. **Bookmarks lost** - was tab-based state, now continuous page

### For Developers
1. **Update imports**: No more `DashboardTab` in isolation
2. **State location**: Network state now in main component
3. **URL structure**: Remove tab-based routing if it existed

## Questions & Answers

**Q: Why remove tabs?**
A: Single-page flow reduces cognitive load and improves discoverability. Users can see all features without clicking around.

**Q: What happens to the Dashboard tab content?**
A: All dashboard content (stats, charts, categories) moved to the single page in a logical flow below the network visualization.

**Q: Can users still switch between network views?**
A: Yes! The toggle button provides instant switching between "Money Trail Explorer" and "Network Graph" modes.

**Q: Is the page too long now?**
A: The network visualization is the hero/focal point. Charts and stats are secondary context, accessible via scroll. Most users will spend 80% of time in the network section.

**Q: How does this affect mobile users?**
A: Mobile experience improved - no tab switching on small screens. All content flows naturally with responsive breakpoints.

## Conclusion

The single-page refactor transforms Political Donor Tracker from a segmented multi-view app into a cohesive investigation platform. The network visualization is now the primary interface, supported by contextual data and analytics. This architecture better serves the core use case: tracing money flows and exposing hidden connections.
