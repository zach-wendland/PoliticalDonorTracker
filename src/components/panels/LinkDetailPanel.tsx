// LinkDetailPanel - Drill-down view for network connections
// Shows detailed information when clicking on a link in the Money Trail

import { X, ExternalLink, FileText, Users, ArrowRight, AlertTriangle, Calendar, DollarSign, Building2, ChevronRight } from 'lucide-react';
import type { NetworkNode, NetworkLink, DonorMediaNetwork } from '../../types/supabase';
import { formatCurrency, RELATIONSHIP_LABELS, NODE_TYPE_INFO, getDownstreamRecipients, findSharedBoardMembers } from '../../utils/pathFinder';

interface LinkDetailPanelProps {
  link: NetworkLink;
  sourceNode: NetworkNode;
  targetNode: NetworkNode;
  network: DonorMediaNetwork;
  onClose: () => void;
  onNodeClick: (nodeId: string) => void;
}

export function LinkDetailPanel({
  link,
  sourceNode,
  targetNode,
  network,
  onClose,
  onNodeClick,
}: LinkDetailPanelProps) {
  // Get downstream recipients from target node
  const downstreamRecipients = getDownstreamRecipients(network, targetNode.id, 2);

  // Find shared board members
  const sharedMembers = findSharedBoardMembers(sourceNode, targetNode);

  // Confidence badge color
  const confidenceColor = {
    high: 'bg-green-900/30 text-green-400 border-green-800/50',
    medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
    low: 'bg-red-900/30 text-red-400 border-red-800/50',
  }[link.confidence || 'medium'];

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">CONNECTION DETAIL</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Connection Summary */}
        <div className="flex items-center gap-2 text-sm">
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: NODE_TYPE_INFO[sourceNode.type]?.color + '20', color: NODE_TYPE_INFO[sourceNode.type]?.color }}
          >
            {sourceNode.name}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-500" />
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: NODE_TYPE_INFO[targetNode.type]?.color + '20', color: NODE_TYPE_INFO[targetNode.type]?.color }}
          >
            {targetNode.name}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Relationship Info */}
        <section>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Relationship</h4>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-cyan-400">
                {RELATIONSHIP_LABELS[link.relationship] || link.relationship}
              </span>
              {link.confidence && (
                <span className={`px-2 py-0.5 text-xs rounded border ${confidenceColor}`}>
                  {link.confidence} confidence
                </span>
              )}
            </div>

            {link.amount && (
              <div className="flex items-center gap-2 text-white mb-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span className="text-xl font-bold">{formatCurrency(link.amount)}</span>
                {link.startYear && link.endYear && (
                  <span className="text-xs text-slate-400">
                    ({link.startYear}-{link.endYear})
                  </span>
                )}
              </div>
            )}

            {link.startYear && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>Since {link.startYear}</span>
                {link.isActive === false && (
                  <span className="text-red-400">(Inactive)</span>
                )}
              </div>
            )}

            {link.grantPurpose && (
              <p className="mt-2 text-sm text-slate-300 italic">
                "{link.grantPurpose}"
              </p>
            )}
          </div>
        </section>

        {/* Source Entity */}
        <section>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Source Entity</h4>
          <button
            onClick={() => onNodeClick(sourceNode.id)}
            className="w-full text-left bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-semibold">{sourceNode.name}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: NODE_TYPE_INFO[sourceNode.type]?.color + '20', color: NODE_TYPE_INFO[sourceNode.type]?.color }}
                  >
                    {NODE_TYPE_INFO[sourceNode.type]?.label || sourceNode.type}
                  </span>
                  {sourceNode.politicalLean && sourceNode.politicalLean !== 'unknown' && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      sourceNode.politicalLean === 'left' ? 'bg-blue-900/30 text-blue-400' :
                      sourceNode.politicalLean === 'right' ? 'bg-red-900/30 text-red-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {sourceNode.politicalLean}
                    </span>
                  )}
                </div>
                {sourceNode.netWorth && (
                  <p className="text-sm text-slate-400 mt-1">Net Worth: ${sourceNode.netWorth}B</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-slate-500" />
            </div>
          </button>
        </section>

        {/* Target Entity */}
        <section>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Target Entity</h4>
          <button
            onClick={() => onNodeClick(targetNode.id)}
            className="w-full text-left bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-semibold">{targetNode.name}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: NODE_TYPE_INFO[targetNode.type]?.color + '20', color: NODE_TYPE_INFO[targetNode.type]?.color }}
                  >
                    {NODE_TYPE_INFO[targetNode.type]?.label || targetNode.type}
                  </span>
                  {targetNode.domain && (
                    <span className="text-xs text-slate-500">{targetNode.domain}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-500" />
            </div>
          </button>
        </section>

        {/* Intermediary Organizations */}
        {link.intermediaries && link.intermediaries.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Intermediary Organizations
            </h4>
            <div className="bg-yellow-900/10 border border-yellow-800/30 rounded-lg p-3">
              <p className="text-xs text-yellow-400 mb-2">
                Money flows through these shell/pass-through organizations:
              </p>
              <div className="space-y-2">
                {link.intermediaries.map((intId) => {
                  const intNode = network.nodes.find(n => n.id === intId);
                  return intNode ? (
                    <button
                      key={intId}
                      onClick={() => onNodeClick(intId)}
                      className="flex items-center gap-2 w-full text-left p-2 bg-slate-800/50 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-300">{intNode.name}</span>
                      {intNode.ein && (
                        <span className="text-xs text-slate-500">EIN: {intNode.ein}</span>
                      )}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          </section>
        )}

        {/* Shared Board Members */}
        {sharedMembers.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              Shared Board Members
            </h4>
            <div className="bg-purple-900/10 border border-purple-800/30 rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {sharedMembers.map((member, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded"
                  >
                    {member}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Downstream Recipients */}
        {downstreamRecipients.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Downstream Recipients (from {targetNode.name})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {downstreamRecipients.slice(0, 10).map(({ node, totalAmount, pathCount }) => (
                <button
                  key={node.id}
                  onClick={() => onNodeClick(node.id)}
                  className="flex items-center justify-between w-full p-2 bg-slate-800/50 border border-slate-700 rounded hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: NODE_TYPE_INFO[node.type]?.color }}
                    />
                    <span className="text-sm text-slate-300">{node.name}</span>
                  </div>
                  <div className="text-right">
                    {totalAmount > 0 && (
                      <span className="text-xs text-emerald-400">{formatCurrency(totalAmount)}</span>
                    )}
                    <span className="text-xs text-slate-500 ml-2">{pathCount} path{pathCount > 1 ? 's' : ''}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Source Documents */}
        {link.sourceDocuments && link.sourceDocuments.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Source Documents
            </h4>
            <div className="space-y-2">
              {link.sourceDocuments.map((doc, i) => (
                <a
                  key={i}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-slate-800/50 border border-slate-700 rounded hover:border-cyan-700 transition-colors group"
                >
                  <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-cyan-400" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-slate-300 group-hover:text-cyan-400 truncate block">
                      {doc.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      Accessed: {doc.accessDate}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="border-t border-slate-700 pt-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNodeClick(sourceNode.id)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded border border-slate-700 transition-colors"
            >
              Trace from source
            </button>
            <button
              onClick={() => onNodeClick(targetNode.id)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded border border-slate-700 transition-colors"
            >
              Trace from target
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
