import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Key,
  Target,
  Database,
  Rss,
  Map,
  PieChart,
  BarChart3,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Download,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  ALL_POLITICAL_SOURCES,
  POLITICAL_SOURCE_CATEGORIES,
  SOURCE_STATS,
} from '../config/politicalFinanceSources';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { DonorMediaNetwork } from './d3';
import { MoneyTrailExplorer } from './tabs';
import { ICON_MAP, CATEGORY_COLORS } from '../constants/ui';

export default function PoliticalDonorTracker() {
  const [activeNetworkView, setActiveNetworkView] = useState<'standard' | 'trail'>('trail');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

  // Filter network based on search query
  const filteredNetwork = useMemo(() => {
    if (!donorMediaNetwork || !searchQuery.trim()) {
      return donorMediaNetwork;
    }

    const query = searchQuery.toLowerCase().trim();

    // Filter nodes that match the search query
    const matchedNodes = donorMediaNetwork.nodes.filter(node => {
      return (
        node.name.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query) ||
        node.description?.toLowerCase().includes(query) ||
        node.donorType?.toLowerCase().includes(query) ||
        node.outletType?.toLowerCase().includes(query) ||
        node.orgType?.toLowerCase().includes(query) ||
        node.politicalLean?.toLowerCase().includes(query) ||
        node.country?.toLowerCase().includes(query) ||
        node.state?.toLowerCase().includes(query)
      );
    });

    // Get IDs of matched nodes
    const matchedNodeIds = new Set(matchedNodes.map(n => n.id));

    // Filter links to only include connections between matched nodes
    const filteredLinks = donorMediaNetwork.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source;
      const targetId = typeof link.target === 'string' ? link.target : link.target;
      return matchedNodeIds.has(sourceId) && matchedNodeIds.has(targetId);
    });

    return {
      nodes: matchedNodes,
      links: filteredLinks,
    };
  }, [donorMediaNetwork, searchQuery]);

  // Export network data
  const handleExport = () => {
    if (!donorMediaNetwork) return;
    const dataStr = JSON.stringify(donorMediaNetwork, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swamp-tracker-network-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-900/30 p-2 rounded-lg border border-red-700/40">
                <Target className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">SWAMP TRACKER</h1>
                <p className="text-xs text-slate-400 font-mono">Follow the Money · Expose the Network</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {searchQuery && filteredNetwork && (
                <div className="absolute -bottom-6 left-0 text-xs text-slate-400">
                  {filteredNetwork.nodes.length} result{filteredNetwork.nodes.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Connection Status */}
            {isSupabaseConfigured ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Wifi className="h-3.5 w-3.5" />
                Live Data
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-400">
                <WifiOff className="h-3.5 w-3.5" />
                Configure Supabase
              </span>
            )}

            {/* Action Buttons */}
            <button
              onClick={fetchDonorMediaNetwork}
              disabled={isLoadingNetwork || !isSupabaseConfigured}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs text-slate-200 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingNetwork ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={handleExport}
              disabled={!donorMediaNetwork}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs text-slate-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                showFilters
                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>

            <span className="text-xs text-slate-500 font-mono">
              {SOURCE_STATS.totalSources} sources
            </span>
            <span className="px-2 py-1 bg-red-900/30 text-red-400 text-xs font-semibold border border-red-800/50 rounded">
              LIVE INTEL
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-8">
        {/* Network Visualization Hero Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Network Intelligence</h2>
              <p className="text-sm text-slate-400">Interactive money flow visualization and analysis</p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveNetworkView('trail')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  activeNetworkView === 'trail'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Money Trail Explorer
              </button>
              <button
                onClick={() => setActiveNetworkView('standard')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  activeNetworkView === 'standard'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Network Graph
              </button>
            </div>
          </div>

          {/* Network Visualization */}
          <div className="min-h-[700px]">
            {activeNetworkView === 'trail' ? (
              <MoneyTrailExplorer
                isSupabaseConfigured={isSupabaseConfigured}
                isLoading={isLoadingNetwork}
                networkData={filteredNetwork}
                onRefresh={fetchDonorMediaNetwork}
              />
            ) : (
              filteredNetwork && filteredNetwork.nodes.length > 0 ? (
                <DonorMediaNetwork
                  data={filteredNetwork}
                  width={1700}
                  height={700}
                />
              ) : (
                <div className="flex items-center justify-center h-[700px] bg-slate-900/50 border border-slate-800 rounded-lg">
                  <div className="text-center max-w-md">
                    <Target className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {searchQuery ? 'No Search Results' : 'No Network Data Available'}
                    </h3>
                    {searchQuery ? (
                      <p className="text-sm text-slate-400">
                        No entities found matching "{searchQuery}". Try a different search term.
                      </p>
                    ) : !isSupabaseConfigured ? (
                      <>
                        <p className="text-sm text-slate-400 mb-4">
                          Configure your Supabase connection to visualize donor-media relationships.
                        </p>
                        <div className="bg-slate-800/50 rounded-lg p-4 text-left text-xs">
                          <p className="text-slate-300 font-mono mb-2">Add to .env:</p>
                          <code className="text-emerald-400">
                            VITE_SUPABASE_URL=https://your-project.supabase.co<br />
                            VITE_SUPABASE_ANON_KEY=your_anon_key_here
                          </code>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">
                        No donor-media relationships found in the database. Add data to the network tables.
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* Stats Dashboard */}
        <section>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            Data Sources Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-emerald-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide">Total Sources</span>
              </div>
              <p className="text-3xl font-bold text-white">{SOURCE_STATS.totalSources}</p>
              <p className="text-xs text-slate-500 mt-1">
                {SOURCE_STATS.officialSources} official, {SOURCE_STATS.verifiedSources} verified
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Rss className="h-5 w-5 text-orange-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide">RSS Feeds</span>
              </div>
              <p className="text-3xl font-bold text-white">{SOURCE_STATS.rssFeedsCount}</p>
              <p className="text-xs text-slate-500 mt-1">Live news feeds</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-5 w-5 text-blue-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide">API Sources</span>
              </div>
              <p className="text-3xl font-bold text-white">{SOURCE_STATS.apiSourcesCount}</p>
              <p className="text-xs text-slate-500 mt-1">Data API endpoints</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Map className="h-5 w-5 text-green-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide">Coverage</span>
              </div>
              <p className="text-3xl font-bold text-white">{SOURCE_STATS.stateSources}</p>
              <p className="text-xs text-slate-500 mt-1">State-level portals</p>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Data Distribution Analytics
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-emerald-400" />
                Sources by Category
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Object.values(CATEGORY_COLORS)[index % Object.values(CATEGORY_COLORS).length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value) => <span className="text-slate-400">{value}</span>}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data Types Distribution */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Data Types Coverage
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataTypeDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Source Categories Grid */}
        <section>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            Data Source Categories
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(POLITICAL_SOURCE_CATEGORIES).map(([key, config]) => {
              const IconComponent = ICON_MAP[config.icon] || Database;
              const count = ALL_POLITICAL_SOURCES.filter(s => s.category === key).length;
              return (
                <div
                  key={key}
                  className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors"
                >
                  <div className={`p-2 rounded-lg bg-slate-800 ${config.color} inline-block mb-2`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">{config.label}</h4>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{config.description}</p>
                  <p className="text-lg font-bold text-emerald-400">{count} sources</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="max-w-[1800px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-500">
                Swamp Tracker - Follow the Money · Expose the Network
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Data sourced from {SOURCE_STATS.officialSources} official government sources and {SOURCE_STATS.verifiedSources} verified watchdog organizations
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-red-500" />
                {SOURCE_STATS.totalSources} sources
              </span>
              <span className="flex items-center gap-1">
                <Key className="h-3 w-3 text-cyan-500" />
                {SOURCE_STATS.apiSourcesCount} APIs
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
