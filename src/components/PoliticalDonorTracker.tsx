import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  Building2,
  Eye,
  UserCheck,
  Map,
  Moon,
  Search,
  Globe2,
  Scale,
  DollarSign,
  Users,
  FileText,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Database,
  Rss,
  Key,
  Shield,
  BarChart3,
  PieChart,
  Loader2,
  Wifi,
  WifiOff,
  Network
} from 'lucide-react';
import {
  ALL_POLITICAL_SOURCES,
  POLITICAL_SOURCE_CATEGORIES,
  POLITICAL_LIVE_FEEDS,
  SOURCE_STATS,
  type PoliticalDataSource,
  type SourceCategory,
  type DonorProfile,
  type LobbyistProfile,
  type RecipientProfile
} from '../config/politicalFinanceSources';
import { feedService, type FeedItem } from '../services/feedService';
import { usePoliticalData } from '../hooks/usePoliticalData';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { DonorMediaNetwork } from './d3';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

type TabView = 'dashboard' | 'donors' | 'recipients' | 'lobbyists' | 'network' | 'sources' | 'feed';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Eye,
  UserCheck,
  Map,
  Moon,
  Search,
  Globe2,
  Scale
};

const CATEGORY_COLORS: Record<SourceCategory, string> = {
  FEC_FEDERAL: '#3b82f6',
  OPENSECRETS: '#8b5cf6',
  LOBBYIST_DISCLOSURE: '#f97316',
  STATE_FINANCE: '#22c55e',
  NONPROFIT_DARK_MONEY: '#64748b',
  WATCHDOG_INVESTIGATIVE: '#ef4444',
  FOREIGN_INFLUENCE: '#06b6d4',
  ETHICS_COMPLIANCE: '#eab308'
};

export default function PoliticalDonorTracker() {
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SourceCategory | 'all'>('all');
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Search inputs for API tabs
  const [donorSearchInput, setDonorSearchInput] = useState('');
  const [recipientSearchInput, setRecipientSearchInput] = useState('');
  const [lobbyistSearchInput, setLobbyistSearchInput] = useState('');

  // Political data hook
  const {
    // Profile data
    donorProfile,
    recipientProfile,
    lobbyistProfile,
    // Sample data fallbacks
    sampleDonors,
    sampleRecipients,
    sampleLobbyists,
    // Loading states
    isLoadingDonor,
    isLoadingRecipient,
    isLoadingLobbyist,
    // Error states
    donorError,
    recipientError,
    lobbyistError,
    // API status
    apiStatus,
    // Fallback indicators
    donorUsingMock,
    recipientUsingMock,
    lobbyistUsingMock,
    // Actions
    searchDonor,
    searchRecipient,
    searchLobbyist,
  } = usePoliticalData();

  // Supabase enriched data hook
  const {
    donorMediaNetwork,
    isLoadingNetwork,
    isConfigured: isSupabaseConfigured,
    fetchDonorMediaNetwork,
  } = useSupabaseData();

  // Memoized filtered sources
  const filteredSources = useMemo(() => {
    return ALL_POLITICAL_SOURCES.filter(source => {
      const matchesSearch = searchQuery === '' ||
        source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || source.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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

  // Fetch RSS feeds
  const fetchFeeds = useCallback(async () => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const feedSources = POLITICAL_LIVE_FEEDS.map(source => ({
        id: source.id,
        name: source.name,
        url: source.url,
        category: source.category,
        topic_map: source.description
      }));
      const result = await feedService.fetchFeeds(feedSources);
      setFeedItems(result.items);

      // Check for errors
      const errorCount = Object.keys(result.errors).length;
      if (errorCount > 0) {
        setFeedError(`${errorCount} feed(s) failed to load. Some sources may be unavailable.`);
      }
    } catch (err) {
      setFeedError('Failed to fetch feeds. Please try again.');
      console.error('Feed fetch error:', err);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'feed' && feedItems.length === 0) {
      fetchFeeds();
    }
  }, [activeTab, feedItems.length, fetchFeeds]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderSourceCard = (source: PoliticalDataSource) => {
    const categoryConfig = POLITICAL_SOURCE_CATEGORIES[source.category];
    const IconComponent = ICON_MAP[categoryConfig.icon] || Database;
    const isExpanded = expandedSource === source.id;

    return (
      <div
        key={source.id}
        className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-all"
      >
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
          onClick={() => setExpandedSource(isExpanded ? null : source.id)}
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
  };

  const renderDonorCard = (donor: DonorProfile) => (
    <div key={donor.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-bold text-white text-lg">{donor.name}</h4>
          <p className="text-sm text-slate-400">{donor.occupation} at {donor.employer}</p>
          <p className="text-xs text-slate-500">{donor.city}, {donor.state}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(donor.totalContributions)}</p>
          <p className="text-xs text-slate-500">{donor.contributionCount} contributions</p>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Top Recipients</h5>
        <div className="space-y-2">
          {donor.topRecipients.map((r, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded p-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-300">{r.name}</span>
                <span className="text-xs text-slate-500">({r.type})</span>
              </div>
              <span className="text-sm font-medium text-emerald-400">{formatCurrency(r.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h5 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Recent Activity</h5>
        <div className="space-y-1">
          {donor.recentContributions.slice(0, 3).map((c, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{formatDate(c.date)}</span>
              <span className="text-slate-400">{c.recipient}</span>
              <span className="text-emerald-400">{formatCurrency(c.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {donor.affiliations.map((a, i) => (
          <span key={i} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
            {a}
          </span>
        ))}
      </div>
    </div>
  );

  const renderLobbyistCard = (lobbyist: LobbyistProfile) => (
    <div key={lobbyist.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-bold text-white text-lg">{lobbyist.name}</h4>
          <p className="text-sm text-slate-400">{lobbyist.firm}</p>
          <p className="text-xs text-slate-500">Registered: {formatDate(lobbyist.registrationDate)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(lobbyist.totalCompensation)}</p>
          <p className="text-xs text-slate-500">total compensation</p>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Clients</h5>
        <div className="space-y-2">
          {lobbyist.clients.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded p-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                <div>
                  <span className="text-sm text-slate-300 block">{c.name}</span>
                  <span className="text-xs text-slate-500">{c.industry}</span>
                </div>
              </div>
              <span className="text-sm font-medium text-orange-400">{formatCurrency(c.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Lobbying Targets</h5>
          <ul className="space-y-1">
            {lobbyist.lobbyingTargets.map((t, i) => (
              <li key={i} className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-1 h-1 bg-orange-400 rounded-full" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Issues</h5>
          <div className="flex flex-wrap gap-1">
            {lobbyist.issues.map((issue, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-orange-900/30 text-orange-400 border border-orange-800/50 rounded">
                {issue}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecipientCard = (recipient: RecipientProfile) => (
    <div key={recipient.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white text-lg">{recipient.name}</h4>
            {recipient.party && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                recipient.party === 'Democratic' ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' :
                recipient.party === 'Republican' ? 'bg-red-900/30 text-red-400 border border-red-800/50' :
                'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {recipient.party}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 capitalize">{recipient.type.replace('_', ' ')}</p>
          {recipient.office && recipient.state && (
            <p className="text-xs text-slate-500">{recipient.office} - {recipient.state}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-400">{formatCurrency(recipient.totalRaised)}</p>
          <p className="text-xs text-slate-500">total raised</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Top Donors</h5>
          <div className="space-y-2">
            {recipient.topDonors.slice(0, 3).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate mr-2">{d.name}</span>
                <span className="text-purple-400 whitespace-nowrap">{formatCurrency(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h5 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Top Industries</h5>
          <div className="space-y-2">
            {recipient.topIndustries.slice(0, 3).map((ind, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate mr-2">{ind.industry}</span>
                <span className="text-purple-400 whitespace-nowrap">{formatCurrency(ind.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const tabs: { id: TabView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'donors', label: 'Donors', icon: DollarSign },
    { id: 'recipients', label: 'Recipients', icon: Users },
    { id: 'lobbyists', label: 'Lobbyists', icon: UserCheck },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'sources', label: 'Data Sources', icon: Database },
    { id: 'feed', label: 'Live Feed', icon: Rss }
  ];

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
            {tabs.map(tab => {
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
          <div className="space-y-6">
            {/* Stats Cards */}
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

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-emerald-400" />
                  Sources by Category
                </h3>
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
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Data Types Coverage
                </h3>
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

            {/* Source Categories Grid */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Data Source Categories
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(POLITICAL_SOURCE_CATEGORIES).map(([key, config]) => {
                  const IconComponent = ICON_MAP[config.icon] || Database;
                  const count = ALL_POLITICAL_SOURCES.filter(s => s.category === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedCategory(key as SourceCategory);
                        setActiveTab('sources');
                      }}
                      className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-all text-left"
                    >
                      <div className={`p-2 rounded-lg bg-slate-800 ${config.color} inline-block mb-2`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <h4 className="font-semibold text-white text-sm mb-1">{config.label}</h4>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{config.description}</p>
                      <p className="text-lg font-bold text-emerald-400">{count} sources</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coverage Gaps Notice */}
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-400 mb-1">Coverage Gaps & Notes</h4>
                  <ul className="text-sm text-yellow-200/80 space-y-1">
                    <li>Some API sources require registration for API keys (FEC, OpenSecrets)</li>
                    <li>Municipal/local campaign finance portals not yet integrated</li>
                    <li>Real-time transaction feeds limited to FEC bulk data updates</li>
                    <li>International political finance tracking not included</li>
                    <li>Some state portals use legacy systems requiring scraping</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Donors Tab */}
        {activeTab === 'donors' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Donor Profiles</h2>
                <p className="text-sm text-slate-400">Track individual and organizational political contributions</p>
              </div>
              <div className="flex items-center gap-2">
                {/* API Status Indicator */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  apiStatus.openfec.available ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {apiStatus.openfec.available ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  FEC API {apiStatus.openfec.remainingCalls !== undefined && `(${apiStatus.openfec.remainingCalls} calls left)`}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); searchDonor(donorSearchInput); }} className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search donors by name..."
                    value={donorSearchInput}
                    onChange={(e) => setDonorSearchInput(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-64"
                  />
                  {isLoadingDonor && <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />}
                </form>
              </div>
            </div>

            {/* Status/Error Messages */}
            {donorError && (
              <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{donorError}</span>
                </div>
              </div>
            )}

            {donorUsingMock && !donorError && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FileText className="h-4 w-4" />
                  <span>Showing sample data. Search for a donor name to fetch live FEC contribution data.</span>
                </div>
              </div>
            )}

            {/* Donor Profile Result */}
            {donorProfile && !donorUsingMock && (
              <div className="grid md:grid-cols-1 gap-6">
                {renderDonorCard(donorProfile)}
              </div>
            )}

            {/* Sample Data Display */}
            {(donorUsingMock || !donorProfile) && (
              <div className="grid md:grid-cols-2 gap-6">
                {sampleDonors.map(renderDonorCard)}
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
        )}

        {/* Recipients Tab */}
        {activeTab === 'recipients' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Recipient Tracking</h2>
                <p className="text-sm text-slate-400">Candidates, PACs, Super PACs, and political organizations</p>
              </div>
              <div className="flex items-center gap-2">
                {/* API Status Indicator */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  apiStatus.openfec.available ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {apiStatus.openfec.available ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  FEC API
                </div>
                <form onSubmit={(e) => { e.preventDefault(); searchRecipient(recipientSearchInput); }} className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search candidates/committees..."
                    value={recipientSearchInput}
                    onChange={(e) => setRecipientSearchInput(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-64"
                  />
                  {isLoadingRecipient && <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />}
                </form>
              </div>
            </div>

            {/* Status/Error Messages */}
            {recipientError && (
              <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{recipientError}</span>
                </div>
              </div>
            )}

            {recipientUsingMock && !recipientError && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FileText className="h-4 w-4" />
                  <span>Showing sample data. Search for a candidate or committee name to fetch live FEC data.</span>
                </div>
              </div>
            )}

            {/* Recipient Profile Result */}
            {recipientProfile && !recipientUsingMock && (
              <div className="grid md:grid-cols-1 gap-6">
                {renderRecipientCard(recipientProfile)}
              </div>
            )}

            {/* Sample Data Display */}
            {(recipientUsingMock || !recipientProfile) && (
              <div className="grid md:grid-cols-2 gap-6">
                {sampleRecipients.map(renderRecipientCard)}
              </div>
            )}

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
        )}

        {/* Lobbyists Tab */}
        {activeTab === 'lobbyists' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Lobbyist Disclosures</h2>
                <p className="text-sm text-slate-400">Registered lobbyists, their clients, and lobbying activities</p>
              </div>
              <div className="flex items-center gap-2">
                {/* API Status Indicator */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  apiStatus.senateLDA.available ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {apiStatus.senateLDA.available ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  Senate LDA
                </div>
                <form onSubmit={(e) => { e.preventDefault(); searchLobbyist(lobbyistSearchInput); }} className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search lobbying firms..."
                    value={lobbyistSearchInput}
                    onChange={(e) => setLobbyistSearchInput(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-64"
                  />
                  {isLoadingLobbyist && <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />}
                </form>
              </div>
            </div>

            {/* Status/Error Messages */}
            {lobbyistError && (
              <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{lobbyistError}</span>
                </div>
              </div>
            )}

            {lobbyistUsingMock && !lobbyistError && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FileText className="h-4 w-4" />
                  <span>Showing sample data. Search for a lobbying firm name to fetch live Senate LDA disclosures.</span>
                </div>
              </div>
            )}

            {/* Lobbyist Profile Result */}
            {lobbyistProfile && !lobbyistUsingMock && (
              <div className="grid md:grid-cols-1 gap-6">
                {renderLobbyistCard(lobbyistProfile)}
              </div>
            )}

            {/* Sample Data Display */}
            {(lobbyistUsingMock || !lobbyistProfile) && (
              <div className="grid md:grid-cols-2 gap-6">
                {sampleLobbyists.map(renderLobbyistCard)}
              </div>
            )}

            <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Data Sources for Lobbyist Data</h4>
              <div className="flex flex-wrap gap-2">
                {ALL_POLITICAL_SOURCES
                  .filter(s => s.dataTypes.includes('lobbyist_registrations') || s.dataTypes.includes('lobbyist_activities'))
                  .map(source => (
                    <span key={source.id} className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded flex items-center gap-1">
                      {source.reliability === 'official' && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                      {source.name}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Donor-Media Network</h2>
                <p className="text-sm text-slate-400">
                  Visualize connections between wealthy donors and media outlets they fund or own
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isSupabaseConfigured ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Wifi className="h-3.5 w-3.5" />
                    Supabase Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400">
                    <WifiOff className="h-3.5 w-3.5" />
                    Configure Supabase for live data
                  </span>
                )}
                <button
                  onClick={() => fetchDonorMediaNetwork()}
                  disabled={isLoadingNetwork || !isSupabaseConfigured}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs text-slate-200 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingNetwork ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {isLoadingNetwork ? (
              <div className="flex items-center justify-center h-96 bg-slate-900/50 border border-slate-800 rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Loading network data...</p>
                </div>
              </div>
            ) : donorMediaNetwork && donorMediaNetwork.nodes.length > 0 ? (
              <DonorMediaNetwork
                data={donorMediaNetwork}
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
            {donorMediaNetwork && donorMediaNetwork.nodes.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Donors</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {donorMediaNetwork.nodes.filter(n => n.type === 'donor').length}
                  </p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-cyan-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Media Outlets</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {donorMediaNetwork.nodes.filter(n => n.type === 'media').length}
                  </p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Network className="h-5 w-5 text-purple-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Connections</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{donorMediaNetwork.links.length}</p>
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
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-48"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as SourceCategory | 'all')}
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
              {filteredSources.map(renderSourceCard)}
            </div>

            {filteredSources.length === 0 && (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No sources match your filters</p>
              </div>
            )}
          </div>
        )}

        {/* Live Feed Tab */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Live News Feed</h2>
                <p className="text-sm text-slate-400">Real-time updates from political finance watchdog sources</p>
              </div>
              <button
                onClick={fetchFeeds}
                disabled={feedLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${feedLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {feedError && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-400">{feedError}</span>
              </div>
            )}

            {feedLoading && feedItems.length === 0 && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-800 rounded w-1/2 mb-3" />
                    <div className="h-3 bg-slate-800 rounded w-full" />
                  </div>
                ))}
              </div>
            )}

            {feedItems.length > 0 && (
              <div className="space-y-4">
                {feedItems.map((item, index) => (
                  <a
                    key={`${item.id}-${index}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1 hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-400 line-clamp-2 mb-2">{item.topic}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.rawDate ? formatDate(item.rawDate.toISOString()) : item.time}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-800 rounded">{item.source}</span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-600 flex-shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            )}

            {!feedLoading && feedItems.length === 0 && !feedError && (
              <div className="text-center py-12">
                <Rss className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No feed items yet. Click refresh to load.</p>
              </div>
            )}
          </div>
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
                <Rss className="h-3 w-3 text-orange-500" />
                {SOURCE_STATS.rssFeedsCount} RSS feeds
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
