// FeedTab - Live RSS news feed display
import { RefreshCw, AlertCircle, Clock, ExternalLink, Rss } from 'lucide-react';
import { formatDate } from '../../utils/formatting';
import type { FeedItem } from '../../services/feedService';

interface FeedTabProps {
  items: FeedItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function FeedTab({
  items,
  isLoading,
  error,
  onRefresh,
}: FeedTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Live News Feed</h2>
          <p className="text-sm text-slate-400">Real-time updates from political finance watchdog sources</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {isLoading && items.length === 0 && (
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

      {items.length > 0 && (
        <div className="space-y-4">
          {items.map((item, index) => (
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

      {!isLoading && items.length === 0 && !error && (
        <div className="text-center py-12">
          <Rss className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No feed items yet. Click refresh to load.</p>
        </div>
      )}
    </div>
  );
}
