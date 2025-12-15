// DonorsTab - Donor search and profile display
import { Search, Wifi, WifiOff, Loader2, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { DonorCard } from '../cards';
import { ALL_POLITICAL_SOURCES, type DonorProfile } from '../../config/politicalFinanceSources';

interface ApiStatus {
  available: boolean;
  remainingCalls?: number;
}

interface DonorsTabProps {
  apiStatus: ApiStatus;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  error: string | null;
  profile: DonorProfile | null;
}

export function DonorsTab({
  apiStatus,
  searchInput,
  onSearchInputChange,
  onSearch,
  isLoading,
  error,
  profile,
}: DonorsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Donor Profiles</h2>
          <p className="text-sm text-slate-400">Search FEC records for individual and organizational political contributions</p>
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
              placeholder="Search donors by name..."
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

      {/* Donor Profile Result */}
      {profile && (
        <div className="grid md:grid-cols-1 gap-6">
          <DonorCard donor={profile} />
        </div>
      )}

      {/* Empty State - No Search Yet */}
      {!profile && !error && !isLoading && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-8 text-center">
          <DollarSign className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Search FEC Donor Records</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Enter a donor name to search Federal Election Commission contribution records.
            Data includes itemized contributions of $200 or more to federal campaigns and committees.
          </p>
          <div className="mt-4 text-xs text-slate-600">
            Try searching: "Koch", "Soros", "Bloomberg", or any individual/organization name
          </div>
        </div>
      )}

      {/* Data Source Attribution */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Data Sources for Donor Profiles</h4>
        <div className="flex flex-wrap gap-2">
          {ALL_POLITICAL_SOURCES
            .filter(s => s.dataTypes.includes('donor_contributions'))
            .slice(0, 6)
            .map(source => (
              <span key={source.id} className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded flex items-center gap-1">
                {source.reliability === 'official' && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                {source.name}
              </span>
            ))}
          <span className="text-xs text-slate-500">
            +{ALL_POLITICAL_SOURCES.filter(s => s.dataTypes.includes('donor_contributions')).length - 6} more
          </span>
        </div>
      </div>
    </div>
  );
}
