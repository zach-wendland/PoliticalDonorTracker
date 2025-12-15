// RecipientsTab - Recipient search and profile display
import { Search, Wifi, WifiOff, Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { RecipientCard } from '../cards';
import { ALL_POLITICAL_SOURCES, type RecipientProfile } from '../../config/politicalFinanceSources';

interface ApiStatus {
  available: boolean;
  remainingCalls?: number;
}

interface RecipientsTabProps {
  apiStatus: ApiStatus;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  error: string | null;
  profile: RecipientProfile | null;
}

export function RecipientsTab({
  apiStatus,
  searchInput,
  onSearchInputChange,
  onSearch,
  isLoading,
  error,
  profile,
}: RecipientsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Recipient Tracking</h2>
          <p className="text-sm text-slate-400">Search FEC records for candidates, PACs, Super PACs, and political committees</p>
        </div>
        <div className="flex items-center gap-2">
          {/* API Status Indicator */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
            apiStatus.available ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
          }`}>
            {apiStatus.available ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            FEC API {apiStatus.remainingCalls !== undefined && `(${apiStatus.remainingCalls} calls left)`}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onSearch(searchInput); }} className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search recipients..."
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-64"
            />
            {isLoading && <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />}
          </form>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Recipient Profile Result */}
      {profile && (
        <div className="grid md:grid-cols-1 gap-6">
          <RecipientCard recipient={profile} />
        </div>
      )}

      {/* Empty State - No Search Yet */}
      {!profile && !error && !isLoading && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Search FEC Recipient Records</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Enter a candidate name, committee name, or PAC to search Federal Election Commission records.
            Find campaign committees, Super PACs, and political organizations.
          </p>
          <div className="mt-4 text-xs text-slate-600">
            Try searching: "Biden", "Trump", "ActBlue", "WinRed", or any committee name
          </div>
        </div>
      )}

      {/* Data Source Attribution */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Data Sources for Recipients</h4>
        <div className="flex flex-wrap gap-2">
          {ALL_POLITICAL_SOURCES
            .filter(s => s.dataTypes.includes('pac_expenditures') || s.dataTypes.includes('campaign_filings'))
            .slice(0, 6)
            .map(source => (
              <span key={source.id} className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded flex items-center gap-1">
                {source.reliability === 'official' && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                {source.name}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
