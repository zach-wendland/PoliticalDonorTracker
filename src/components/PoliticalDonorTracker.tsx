import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  Rss,
  Key,
} from 'lucide-react';
import {
  ALL_POLITICAL_SOURCES,
  POLITICAL_SOURCE_CATEGORIES,
  POLITICAL_LIVE_FEEDS,
  SOURCE_STATS,
  type SourceCategory
} from '../config/politicalFinanceSources';
import { feedService, type FeedItem } from '../services/feedService';
import { usePoliticalData } from '../hooks/usePoliticalData';
import { useSupabaseData } from '../hooks/useSupabaseData';
import {
  DashboardTab,
  DonorsTab,
  RecipientsTab,
  LobbyistsTab,
  NetworkTab,
  SourcesTab,
  FeedTab
} from './tabs';
import { TABS, type TabView } from '../constants/ui';

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
            onNavigateToSources={(category) => {
              setSelectedCategory(category);
              setActiveTab('sources');
            }}
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
            sampleData={sampleDonors}
            usingMock={donorUsingMock}
          />
        )}

        {/* Recipients Tab */}
        {activeTab === 'recipients' && (
          <RecipientsTab
            apiStatus={apiStatus.openfec}
            searchInput={recipientSearchInput}
            onSearchInputChange={setRecipientSearchInput}
            onSearch={searchRecipient}
            isLoading={isLoadingRecipient}
            error={recipientError}
            profile={recipientProfile}
            sampleData={sampleRecipients}
            usingMock={recipientUsingMock}
          />
        )}

        {/* Lobbyists Tab */}
        {activeTab === 'lobbyists' && (
          <LobbyistsTab
            apiStatus={apiStatus.senateLDA}
            searchInput={lobbyistSearchInput}
            onSearchInputChange={setLobbyistSearchInput}
            onSearch={searchLobbyist}
            isLoading={isLoadingLobbyist}
            error={lobbyistError}
            profile={lobbyistProfile}
            sampleData={sampleLobbyists}
            usingMock={lobbyistUsingMock}
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

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <SourcesTab
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            filteredSources={filteredSources}
            expandedSource={expandedSource}
            onExpandedSourceChange={setExpandedSource}
          />
        )}

        {/* Live Feed Tab */}
        {activeTab === 'feed' && (
          <FeedTab
            items={feedItems}
            isLoading={feedLoading}
            error={feedError}
            onRefresh={fetchFeeds}
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
