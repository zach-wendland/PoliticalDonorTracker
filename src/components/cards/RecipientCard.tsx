// RecipientCard - Pure presentational component for recipient profiles
import { formatCurrency } from '../../utils/formatting';
import type { RecipientProfile } from '../../config/politicalFinanceSources';

interface RecipientCardProps {
  recipient: RecipientProfile;
}

export function RecipientCard({ recipient }: RecipientCardProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
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
}
