// NetworkTab - D3 donor-media network visualization
import { RefreshCw, Wifi, WifiOff, Loader2, Network, DollarSign, FileText, Shield } from 'lucide-react';
import { DonorMediaNetwork } from '../d3';
import type { DonorMediaNetwork as NetworkData } from '../../types/supabase';

interface NetworkTabProps {
  isSupabaseConfigured: boolean;
  isLoading: boolean;
  networkData: NetworkData | null;
  onRefresh: () => void;
}

export function NetworkTab({
  isSupabaseConfigured,
  isLoading,
  networkData,
  onRefresh,
}: NetworkTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Donor-Media Network</h2>
          <p className="text-sm text-slate-400">Visualize funding relationships between donors and media outlets</p>
        </div>
        <div className="flex items-center gap-3">
          {isSupabaseConfigured ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Wifi className="h-3.5 w-3.5" />
              Supabase connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <WifiOff className="h-3.5 w-3.5" />
              Configure Supabase for live data
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading || !isSupabaseConfigured}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs text-slate-200 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-400">Loading network data...</p>
          </div>
        </div>
      ) : networkData && networkData.nodes.length > 0 ? (
        <DonorMediaNetwork
          data={networkData}
          width={1200}
          height={700}
        />
      ) : (
        <div className="flex items-center justify-center h-96 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="text-center max-w-md">
            <Network className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">No Network Data Available</h3>
            {!isSupabaseConfigured ? (
              <>
                <p className="text-sm text-slate-400 mb-4">
                  Configure your Supabase connection to visualize donor-media relationships from the stonk-data project.
                </p>
                <div className="bg-slate-800/50 rounded-lg p-4 text-left text-xs">
                  <p className="text-slate-300 font-mono mb-2">Add to .env:</p>
                  <code className="text-emerald-400">
                    VITE_SUPABASE_URL=https://zgjcdrpcdnommxtahdpr.supabase.co<br />
                    VITE_SUPABASE_ANON_KEY=your_anon_key
                  </code>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">
                No donor-media relationships found in the database. Add data to the donors and media_funding tables.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Network Stats */}
      {networkData && networkData.nodes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Donors</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {networkData.nodes.filter(n => n.type === 'donor').length}
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Media Outlets</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {networkData.nodes.filter(n => n.type === 'media').length}
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-5 w-5 text-purple-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Connections</span>
            </div>
            <p className="text-2xl font-bold text-white">{networkData.links.length}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-amber-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Data Source</span>
            </div>
            <p className="text-sm font-medium text-white">Supabase</p>
            <p className="text-xs text-slate-500">stonk-data project</p>
          </div>
        </div>
      )}
    </div>
  );
}
