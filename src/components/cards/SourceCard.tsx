// SourceCard - Controlled component for displaying political data sources
import {
  Key,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Database,
  DollarSign,
  Eye,
  UserCheck,
  Map,
  Moon,
  Search,
  Globe2,
  Scale
} from 'lucide-react';
import {
  POLITICAL_SOURCE_CATEGORIES,
  type PoliticalDataSource
} from '../../config/politicalFinanceSources';
import type { LucideIcon } from 'lucide-react';

// Icon mapping - maps string names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  Eye,
  UserCheck,
  Map,
  Moon,
  Search,
  Globe2,
  Scale,
  Database,
};

interface SourceCardProps {
  source: PoliticalDataSource;
  isExpanded: boolean;
  onToggleExpand: (sourceId: string | null) => void;
}

export function SourceCard({ source, isExpanded, onToggleExpand }: SourceCardProps) {
  const categoryConfig = POLITICAL_SOURCE_CATEGORIES[source.category];
  const IconComponent = ICON_MAP[categoryConfig.icon] || Database;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-slate-800 ${categoryConfig.color}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">{source.name}</h4>
            <p className="text-xs text-slate-500">{categoryConfig.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {source.type === 'rss' && (
            <span className="text-xs px-2 py-0.5 bg-orange-900/30 text-orange-400 border border-orange-800/50 rounded">
              RSS
            </span>
          )}
          {source.type === 'api' && (
            <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-800/50 rounded">
              API
            </span>
          )}
          {source.apiKeyRequired && (
            <span title="API key required"><Key className="h-4 w-4 text-yellow-500" /></span>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{source.description}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded ${
          source.reliability === 'official' ? 'bg-green-900/30 text-green-400 border border-green-800/50' :
          source.reliability === 'verified' ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' :
          'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          {source.reliability}
        </span>
        <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded">
          {source.coverage}
        </span>
        <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded">
          {source.updateFrequency}
        </span>
      </div>

      <button
        onClick={() => onToggleExpand(isExpanded ? null : source.id)}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
      >
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {isExpanded ? 'Less details' : 'More details'}
      </button>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 mb-2">
            <strong className="text-slate-300">Data Types:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {source.dataTypes.map(dt => (
                <span key={dt} className="px-2 py-0.5 bg-slate-800 rounded">
                  {dt.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-2"
          >
            <ExternalLink className="h-3 w-3" />
            Access source
          </a>
        </div>
      )}
    </div>
  );
}
