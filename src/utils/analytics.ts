import type { FeedItem, TrendingTopic, HourlyAggregate, SourceTopicMatrix } from '../types';

// Topic keyword mappings for extraction from titles
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'Foreign Policy': ['war', 'ukraine', 'russia', 'israel', 'china', 'nato', 'intervention', 'troops', 'military', 'ceasefire', 'peace', 'treaty', 'diplomacy', 'sanctions', 'iran', 'syria', 'yemen', 'taiwan'],
  'Economy': ['inflation', 'fed', 'federal reserve', 'dollar', 'debt', 'economy', 'tariff', 'trade', 'gdp', 'recession', 'jobs', 'unemployment', 'stock', 'market', 'interest rate', 'banking', 'crypto', 'bitcoin'],
  'Immigration': ['border', 'immigration', 'migrant', 'deportation', 'visa', 'asylum', 'caravan', 'illegal', 'ice', 'cbp', 'wall'],
  'Culture War': ['woke', 'dei', 'trans', 'lgbtq', 'cancel', 'censor', 'free speech', 'first amendment', 'pronouns', 'gender', 'disney', 'hollywood', 'academia'],
  'Deep State': ['fbi', 'cia', 'intelligence', 'surveillance', 'whistleblower', 'classified', 'leaked', 'doj', 'justice department', 'raid', 'subpoena', 'epstein'],
  'Elections': ['trump', 'biden', 'vote', 'election', 'poll', 'campaign', '2024', 'primary', 'ballot', 'swing state', 'electoral', 'republican', 'democrat', 'gop', 'rnc', 'dnc'],
  'Tech/Censorship': ['big tech', 'twitter', 'facebook', 'google', 'youtube', 'deplatform', 'shadowban', 'algorithm', 'ai', 'elon', 'musk', 'zuckerberg'],
  'Religion': ['christian', 'church', 'faith', 'god', 'bible', 'pope', 'catholic', 'evangelical', 'prayer', 'religious'],
};

// All topic names for filtering UI
export const ALL_TOPICS = Object.keys(TOPIC_KEYWORDS);

/**
 * Extract topics from a feed item title using keyword matching
 */
export function extractTopics(title: string): string[] {
  const lowerTitle = title.toLowerCase();
  const matchedTopics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      matchedTopics.push(topic);
    }
  }

  return matchedTopics.length > 0 ? matchedTopics : ['General'];
}

/**
 * Calculate freshness score (0-100) based on article age
 * Newer articles score higher - this is a real metric, not random
 */
export function calculateFreshnessScore(publishDate: Date): number {
  const now = Date.now();
  const ageMs = now - publishDate.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours < 1) return Math.round(90 + (1 - ageHours) * 10);
  if (ageHours < 3) return Math.round(89 - ((ageHours - 1) / 2) * 19);
  if (ageHours < 6) return Math.round(69 - ((ageHours - 3) / 3) * 19);
  if (ageHours < 12) return Math.round(49 - ((ageHours - 6) / 6) * 19);
  if (ageHours < 24) return Math.round(29 - ((ageHours - 12) / 12) * 19);
  return Math.max(0, Math.round(9 - (ageHours - 24) / 24 * 9));
}

/**
 * Calculate velocity (rate of change) for a set of timestamps
 * Higher velocity = more articles in recent hours
 */
function calculateVelocity(timestamps: Date[]): number {
  if (timestamps.length < 2) return timestamps.length;

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const recentCount = timestamps.filter(t => t >= oneHourAgo).length;
  const previousCount = timestamps.filter(t => t >= twoHoursAgo && t < oneHourAgo).length;

  // Velocity is weighted towards recent activity
  if (previousCount === 0) return recentCount * 2;
  return (recentCount / previousCount) * recentCount;
}

/**
 * Get hour string for grouping (e.g., "14:00")
 */
function getHourKey(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    hour12: false
  }) + ':00';
}

/**
 * Compute trending topics from feed items
 */
export function computeTrendingTopics(feed: FeedItem[]): TrendingTopic[] {
  const topicData: Map<string, {
    count: number;
    sources: Set<string>;
    timestamps: Date[];
    hourlyBuckets: Map<string, number>;
  }> = new Map();

  // Process each feed item
  for (const item of feed) {
    const topics = extractTopics(item.title);
    const hourKey = getHourKey(item.rawDate);

    for (const topic of topics) {
      const existing = topicData.get(topic) || {
        count: 0,
        sources: new Set<string>(),
        timestamps: [],
        hourlyBuckets: new Map<string, number>(),
      };

      existing.count++;
      existing.sources.add(item.source);
      existing.timestamps.push(item.rawDate);
      existing.hourlyBuckets.set(hourKey, (existing.hourlyBuckets.get(hourKey) || 0) + 1);

      topicData.set(topic, existing);
    }
  }

  // Convert to array and calculate metrics
  const trending: TrendingTopic[] = Array.from(topicData.entries())
    .map(([topic, data]) => ({
      topic,
      count: data.count,
      velocity: calculateVelocity(data.timestamps),
      sources: Array.from(data.sources),
      hourlyData: Array.from(data.hourlyBuckets.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
    }))
    .sort((a, b) => b.velocity - a.velocity);

  return trending;
}

/**
 * Compute hourly aggregates for chart visualization
 */
export function computeHourlyAggregates(feed: FeedItem[]): HourlyAggregate[] {
  const hourlyMap = new Map<string, { count: number; topics: Map<string, number> }>();

  for (const item of feed) {
    const hourKey = getHourKey(item.rawDate);
    const existing = hourlyMap.get(hourKey) || { count: 0, topics: new Map() };

    existing.count++;

    const topics = extractTopics(item.title);
    for (const topic of topics) {
      existing.topics.set(topic, (existing.topics.get(topic) || 0) + 1);
    }

    hourlyMap.set(hourKey, existing);
  }

  return Array.from(hourlyMap.entries())
    .map(([hour, data]) => ({
      hour,
      count: data.count,
      topics: Object.fromEntries(data.topics),
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

/**
 * Compute source-topic matrix for heatmap visualization
 */
export function computeSourceTopicMatrix(feed: FeedItem[]): SourceTopicMatrix {
  const matrix: SourceTopicMatrix = {};

  for (const item of feed) {
    if (!matrix[item.source]) {
      matrix[item.source] = {};
    }

    const topics = extractTopics(item.title);
    for (const topic of topics) {
      matrix[item.source][topic] = (matrix[item.source][topic] || 0) + 1;
    }
  }

  return matrix;
}

/**
 * Calculate a simple sentiment indicator (0-100)
 * Based on topic distribution - more "critical" topics = lower sentiment
 */
export function calculateSentimentScore(topics: Record<string, number>): number {
  const criticalTopics = ['Deep State', 'Culture War', 'Tech/Censorship'];
  const totalMentions = Object.values(topics).reduce((a, b) => a + b, 0);

  if (totalMentions === 0) return 50;

  const criticalMentions = criticalTopics.reduce(
    (sum, topic) => sum + (topics[topic] || 0),
    0
  );

  // More critical topics = lower sentiment (inverted)
  const criticalRatio = criticalMentions / totalMentions;
  return Math.round((1 - criticalRatio) * 100);
}

/**
 * Get chart data formatted for Recharts
 */
export function getChartData(hourlyAggregates: HourlyAggregate[]): Array<{
  name: string;
  volume: number;
  sentiment: number;
}> {
  return hourlyAggregates.map(agg => ({
    name: agg.hour,
    volume: agg.count,
    sentiment: calculateSentimentScore(agg.topics),
  }));
}

/**
 * Get top N trending topics as bar chart data
 */
export function getNarrativeData(trending: TrendingTopic[], limit = 5): Array<{
  topic: string;
  value: number;
}> {
  return trending.slice(0, limit).map(t => ({
    topic: t.topic,
    value: t.count,
  }));
}
