// DonorCard - Pure presentational component for donor profiles
import { Users } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatting';
import type { DonorProfile } from '../../config/politicalFinanceSources';

interface DonorCardProps {
  donor: DonorProfile;
}

export function DonorCard({ donor }: DonorCardProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
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
}
