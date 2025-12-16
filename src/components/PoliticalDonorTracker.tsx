import { useState, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  Key,
} from 'lucide-react';
import {
  ALL_POLITICAL_SOURCES,
  POLITICAL_SOURCE_CATEGORIES,
  SOURCE_STATS,
} from '../config/politicalFinanceSources';
import { usePoliticalData } from '../hooks/usePoliticalData';
import { useSupabaseData } from '../hooks/useSupabaseData';
import {
  DashboardTab,
  DonorsTab,
  NetworkTab,
} from './tabs';
import { TABS, type TabView } from '../constants/ui';

export default function PoliticalDonorTracker() {
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');

  // Search input for Donors tab
  const [donorSearchInput, setDonorSearchInput] = useState('');

  // Political data hook
  const {
    donorProfile,
    isLoadingDonor,
    donorError,
    apiStatus,
    searchDonor,
  } = usePoliticalData();

  // Supabase enriched data hook
  const {
    donorMediaNetwork,
    isLoadingNetwork,
    isConfigured: isSupabaseConfigured,
    fetchDonorMediaNetwork,
  } = useSupabaseData();

  // Category distribution for pie chart
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_POLITICAL_SOURCES.forEach(source => {
      const label = POLITICAL_SOURCE_CATEGORIES[source.category].label;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  // Data type distribution for bar chart
  const dataTypeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_POLITICAL_SOURCES.forEach(source => {
      source.dataTypes.forEach(dt => {
        const label = dt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        counts[label] = (counts[label] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, []);


  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600/20 p-2 rounded-lg border border-emerald-500/30">
                <Activity className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">POLITICAL DONOR TRACKER</h1>
                <p className="text-xs text-slate-400 font-mono">Campaign Finance & Lobbyist Intelligence</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              {SOURCE_STATS.totalSources} sources integrated
            </span>
            <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-xs font-semibold border border-emerald-800/50 rounded">
              LIVE
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Overview Tab */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            categoryDistribution={categoryDistribution}
            dataTypeDistribution={dataTypeDistribution}
          />
        )}

        {/* Donors Tab */}
        {activeTab === 'donors' && (
          <DonorsTab
            apiStatus={apiStatus.openfec}
            searchInput={donorSearchInput}
            onSearchInputChange={setDonorSearchInput}
            onSearch={searchDonor}
            isLoading={isLoadingDonor}
            error={donorError}
            profile={donorProfile}
          />
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <NetworkTab
            isSupabaseConfigured={isSupabaseConfigured}
            isLoading={isLoadingNetwork}
            networkData={donorMediaNetwork}
            onRefresh={fetchDonorMediaNetwork}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-500">
                Political Donor Tracker - Campaign Finance Intelligence Platform
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Data sourced from {SOURCE_STATS.officialSources} official government sources and {SOURCE_STATS.verifiedSources} verified watchdog organizations
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {SOURCE_STATS.totalSources} sources
              </span>
              <span className="flex items-center gap-1">
                <Key className="h-3 w-3 text-blue-500" />
                {SOURCE_STATS.apiSourcesCount} APIs
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
