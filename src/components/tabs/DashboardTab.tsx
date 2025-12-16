// DashboardTab - Overview dashboard with stats, charts, and category navigation
import {
  Database,
  Rss,
  Key,
  Map,
  PieChart,
  BarChart3,
  Shield,
  AlertCircle,
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
} from '../../config/politicalFinanceSources';
import { ICON_MAP, CATEGORY_COLORS } from '../../constants/ui';

interface DashboardTabProps {
  categoryDistribution: Array<{ name: string; value: number }>;
  dataTypeDistribution: Array<{ name: string; count: number }>;
}

export function DashboardTab({
  categoryDistribution,
  dataTypeDistribution,
}: DashboardTabProps) {
  return (
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
              <div
                key={key}
                className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"
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
  );
}
