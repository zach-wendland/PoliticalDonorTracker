// DataSourceBanner - Indicator for API connection status and data source

import { Wifi, WifiOff, Database, RefreshCw } from 'lucide-react';

type DataSourceType = 'live' | 'cached' | 'error';

interface DataSourceBannerProps {
  /** Current data source type */
  source: DataSourceType;
  /** Optional message to display */
  message?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Callback for retry action */
  onRetry?: () => void;
  /** API name for display */
  apiName?: string;
}

const SOURCE_CONFIG: Record<DataSourceType, {
  bg: string;
  border: string;
  text: string;
  icon: typeof Wifi;
  label: string;
  description: string;
}> = {
  live: {
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-800/50',
    text: 'text-emerald-400',
    icon: Wifi,
    label: 'LIVE DATA',
    description: 'Connected to live API - showing real-time data',
  },
  cached: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-800/50',
    text: 'text-blue-400',
    icon: Database,
    label: 'CACHED',
    description: 'Showing cached data - may not reflect latest changes',
  },
  error: {
    bg: 'bg-red-900/20',
    border: 'border-red-800/50',
    text: 'text-red-400',
    icon: WifiOff,
    label: 'OFFLINE',
    description: 'Unable to connect to API - check your connection',
  },
};

export function DataSourceBanner({
  source,
  message,
  compact = false,
  onRetry,
  apiName,
}: DataSourceBannerProps) {
  const config = SOURCE_CONFIG[source];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.border} border ${config.text}`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
        {apiName && <span className="opacity-70">({apiName})</span>}
      </div>
    );
  }

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.bg} ${config.text}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${config.text}`}>{config.label}</span>
              {apiName && (
                <span className={`text-xs ${config.text} opacity-70`}>• {apiName}</span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {message || config.description}
            </p>
          </div>
        </div>
        {onRetry && source === 'error' && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
