// LobbyistCard - Pure presentational component for lobbyist profiles
import { Building2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatting';
import type { LobbyistProfile } from '../../config/politicalFinanceSources';

interface LobbyistCardProps {
  lobbyist: LobbyistProfile;
}

export function LobbyistCard({ lobbyist }: LobbyistCardProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
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
}
