// SourcesTab - Data sources manifest with search and filter
import { Search, Database } from 'lucide-react';
import { SourceCard } from '../cards';
import {
  ALL_POLITICAL_SOURCES,
  POLITICAL_SOURCE_CATEGORIES,
  type PoliticalDataSource,
  type SourceCategory
} from '../../config/politicalFinanceSources';

interface SourcesTabProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedCategory: SourceCategory | 'all';
  onCategoryChange: (category: SourceCategory | 'all') => void;
  filteredSources: PoliticalDataSource[];
  expandedSource: string | null;
  onExpandedSourceChange: (sourceId: string | null) => void;
}

export function SourcesTab({
  searchQuery,
  onSearchQueryChange,
  selectedCategory,
  onCategoryChange,
  filteredSources,
  expandedSource,
  onExpandedSourceChange,
}: SourcesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Data Sources Manifest</h2>
          <p className="text-sm text-slate-400">
            {filteredSources.length} of {ALL_POLITICAL_SOURCES.length} sources
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-48"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as SourceCategory | 'all')}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            {Object.entries(POLITICAL_SOURCE_CATEGORIES).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSources.map(source => (
          <SourceCard
            key={source.id}
            source={source}
            isExpanded={expandedSource === source.id}
            onToggleExpand={onExpandedSourceChange}
          />
        ))}
      </div>

      {filteredSources.length === 0 && (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No sources match your filters</p>
        </div>
      )}
    </div>
  );
}
