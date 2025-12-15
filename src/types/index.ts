// Core data types for Political Donor Tracker

export interface FeedItem {
  id: string;
  title: string;
  source: string;
  topic: string;
  time: string;
  rawDate: Date;
  url: string;
  velocity: number;
  category: string;
}

export interface SourceItem {
  id: number | string;
  name: string;
  category: string;
  tier?: string;
  focus?: string;
  url: string;
  topic_map?: string;
}

export interface RSSItem {
  title?: string;
  pubDate?: string;
  link?: string;
  description?: string;
  content?: string;
}

export interface RSSResponse {
  status: 'ok' | 'error';
  message?: string;
  items?: RSSItem[];
}

export type FeedStatus = 'ok' | 'error' | 'loading';

// Analytics types
export interface TrendingTopic {
  topic: string;
  count: number;
  velocity: number;
  sources: string[];
  hourlyData: Array<{ hour: string; count: number }>;
}

export interface HourlyAggregate {
  hour: string;
  count: number;
  topics: Record<string, number>;
}

export interface SourceTopicMatrix {
  [source: string]: {
    [topic: string]: number;
  };
}

// Search and filter types
export interface SearchFilters {
  query: string;
  topics: string[];
  categories: string[];
  dateRange: DateRangeValue;
  velocityThreshold: number;
}

export type DateRangeValue = '1h' | '6h' | '24h' | 'all';

export interface DateRange {
  label: string;
  value: DateRangeValue;
  hours: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: number;
}

// Media configuration types
export interface RumbleChannel {
  id: string;
  name: string;
  embedId: string;
}

export interface TwitterAccount {
  handle: string;
  name: string;
}

export interface MediaSettings {
  rumbleChannels: RumbleChannel[];
  twitterAccounts: TwitterAccount[];
}

// User preferences
export interface UserPreferences {
  defaultTab: 'grid' | 'feed' | 'synthesis' | 'media';
  defaultCategory: string;
  filterPresets: FilterPreset[];
  mediaSettings: MediaSettings;
}

// Category icon type (for SOURCE_CATEGORIES)
export interface CategoryConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// Cache types
export interface FeedCache {
  items: FeedItem[];
  timestamp: number;
}
