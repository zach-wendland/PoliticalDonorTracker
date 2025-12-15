// LobbyistsTab - Lobbyist search and profile display
import { Search, Wifi, WifiOff, Loader2, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { LobbyistCard } from '../cards';
import { ALL_POLITICAL_SOURCES, type LobbyistProfile } from '../../config/politicalFinanceSources';

interface ApiStatus {
  available: boolean;
  remainingCalls?: number;
}

interface LobbyistsTabProps {
  apiStatus: ApiStatus;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  error: string | null;
  profile: LobbyistProfile | null;
}

export function LobbyistsTab({
  apiStatus,
  searchInput,
  onSearchInputChange,
  onSearch,
  isLoading,
  error,
  profile,
}: LobbyistsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Lobbyist Directory</h2>
          <p className="text-sm text-slate-400">Search Senate LDA filings for registered lobbyists, clients, and activities</p>
        </div>
        <div className="flex items-center gap-2">
          {/* API Status Indicator */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
            apiStatus.available ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
          }`}>
            {apiStatus.available ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            Senate LDA {apiStatus.remainingCalls !== undefined && `(${apiStatus.remainingCalls} calls left)`}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onSearch(searchInput); }} className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search lobbyists..."
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

      {/* Lobbyist Profile Result */}
      {profile && (
        <div className="grid md:grid-cols-1 gap-6">
          <LobbyistCard lobbyist={profile} />
        </div>
      )}

      {/* Empty State - No Search Yet */}
      {!profile && !error && !isLoading && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-8 text-center">
          <UserCheck className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Search Senate LDA Lobbyist Records</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Enter a lobbyist firm name or registrant to search Senate Lobbying Disclosure Act filings.
            Find lobbying activities, client lists, and government targets.
          </p>
          <div className="mt-4 text-xs text-slate-600">
            Try searching: "Akin Gump", "Squire Patton", "K Street", or any lobbying firm name
          </div>
        </div>
      )}

      {/* Data Source Attribution */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Data Sources for Lobbyist Data</h4>
        <div className="flex flex-wrap gap-2">
          {ALL_POLITICAL_SOURCES
            .filter(s => s.dataTypes.includes('lobbyist_registrations'))
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
