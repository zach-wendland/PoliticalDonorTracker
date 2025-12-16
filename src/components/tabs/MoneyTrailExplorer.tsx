// MoneyTrailExplorer - Interactive investigation tool for tracing money flows
// Replaces the static DonorsTab with a powerful network exploration interface

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Wifi,
  WifiOff,
  Loader2,
  Network,
  DollarSign,
  Building2,
  Tv,
  Flag,
  AlertTriangle,
  User,
  ChevronDown,
  X,
  Target,
  Route,
} from 'lucide-react';
import { useForceLayout, type SimulationNode, type SimulationLink } from '../d3/useForceLayout';
import { LinkDetailPanel } from '../panels/LinkDetailPanel';
import type { DonorMediaNetwork as NetworkData, NetworkNode, NetworkLink, MoneyPath } from '../../types/supabase';
import {
  findPaths,
  getNodeStats,
  formatCurrency,
  RELATIONSHIP_LABELS,
  NODE_TYPE_INFO,
  POLITICAL_LEAN_COLORS,
} from '../../utils/pathFinder';

interface MoneyTrailExplorerProps {
  isSupabaseConfigured: boolean;
  isLoading: boolean;
  networkData: NetworkData | null;
  onRefresh: () => void;
}

// Icon mapping for node types
const NODE_ICONS: Record<string, typeof DollarSign> = {
  donor: DollarSign,
  media: Tv,
  foundation: Building2,
  pac: Flag,
  shell_org: AlertTriangle,
  politician: User,
};

export function MoneyTrailExplorer({
  isSupabaseConfigured,
  isLoading,
  networkData,
  onRefresh,
}: MoneyTrailExplorerProps) {
  // State
  const [startEntity, setStartEntity] = useState<string | null>(null);
  const [endEntity, setEndEntity] = useState<string | null>(null);
  const [maxHops, setMaxHops] = useState(3);
  const [includeIntermediaries, setIncludeIntermediaries] = useState(true);
  const [filterRelationships, setFilterRelationships] = useState<string[]>([]);
  const [filterNodeTypes, setFilterNodeTypes] = useState<NetworkNode['type'][]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedLink, setSelectedLink] = useState<{
    link: NetworkLink;
    sourceNode: NetworkNode;
    targetNode: NetworkNode;
  } | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<MoneyPath | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SimulationNode | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Memoized node map for quick lookups
  const nodeMap = useMemo(() => {
    if (!networkData) return new Map<string, NetworkNode>();
    return new Map(networkData.nodes.map(n => [n.id, n]));
  }, [networkData]);

  // Filter nodes by search query
  const filteredNodes = useMemo(() => {
    if (!networkData) return [];
    if (!searchQuery) return networkData.nodes;
    const query = searchQuery.toLowerCase();
    return networkData.nodes.filter(n =>
      n.name.toLowerCase().includes(query) ||
      n.type.toLowerCase().includes(query)
    );
  }, [networkData, searchQuery]);

  // Get unique relationship types
  const relationshipTypes = useMemo(() => {
    if (!networkData) return [];
    return [...new Set(networkData.links.map(l => l.relationship))];
  }, [networkData]);

  // Filter network data based on selections
  const displayNetwork = useMemo(() => {
    if (!networkData) return { nodes: [], links: [] };

    let links = networkData.links;
    let nodes = networkData.nodes;

    // Filter by relationship type
    if (filterRelationships.length > 0) {
      links = links.filter(l => filterRelationships.includes(l.relationship));
    }

    // Filter by node type
    if (filterNodeTypes.length > 0) {
      nodes = nodes.filter(n => filterNodeTypes.includes(n.type));
      const nodeIds = new Set(nodes.map(n => n.id));
      links = links.filter(l =>
        nodeIds.has(typeof l.source === 'string' ? l.source : l.source) &&
        nodeIds.has(typeof l.target === 'string' ? l.target : l.target)
      );
    }

    // If start entity is selected, show only connected nodes
    if (startEntity) {
      const paths = findPaths(
        { nodes, links },
        startEntity,
        endEntity,
        { maxHops, includeIntermediaries, filterByRelationship: filterRelationships.length > 0 ? filterRelationships : undefined }
      );

      if (paths.length > 0) {
        const pathNodeIds = new Set<string>();
        const pathLinkKeys = new Set<string>();

        paths.forEach(path => {
          path.nodes.forEach(n => pathNodeIds.add(n.id));
          path.links.forEach(l => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source;
            const targetId = typeof l.target === 'string' ? l.target : l.target;
            pathLinkKeys.add(`${sourceId}-${targetId}`);
          });
        });

        nodes = nodes.filter(n => pathNodeIds.has(n.id));
        links = links.filter(l => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source;
          const targetId = typeof l.target === 'string' ? l.target : l.target;
          return pathLinkKeys.has(`${sourceId}-${targetId}`);
        });
      }
    }

    return { nodes, links };
  }, [networkData, startEntity, endEntity, maxHops, includeIntermediaries, filterRelationships, filterNodeTypes]);

  // Use D3 force layout
  const {
    nodes: simulationNodes,
    links: simulationLinks,
    isSimulating,
    restartSimulation,
  } = useForceLayout(displayNetwork.nodes, displayNetwork.links, {
    width: 1000,
    height: 600,
    chargeStrength: -400,
    linkDistance: 150,
    collisionRadius: 35,
  });

  // Get node radius based on funding/net worth
  const getNodeRadius = (node: SimulationNode): number => {
    if (node.netWorth) {
      return Math.min(35, Math.max(18, 12 + Math.sqrt(node.netWorth) * 4));
    }
    if (node.totalFunding) {
      return Math.min(35, Math.max(18, 12 + Math.sqrt(node.totalFunding / 1000000) * 2));
    }
    return node.type === 'donor' ? 22 : 18;
  };

  // Get node color
  const getNodeColor = (node: SimulationNode): string => {
    // Use political lean if available
    if (node.politicalLean && node.politicalLean !== 'unknown') {
      return POLITICAL_LEAN_COLORS[node.politicalLean];
    }
    return NODE_TYPE_INFO[node.type]?.color || '#6b7280';
  };

  // Check if node is in highlighted path
  const isNodeHighlighted = useCallback((node: SimulationNode): boolean => {
    if (!highlightedPath) return true;
    return highlightedPath.nodes.some(n => n.id === node.id);
  }, [highlightedPath]);

  // Check if link is in highlighted path
  const isLinkHighlighted = useCallback((link: SimulationLink): boolean => {
    if (!highlightedPath) return true;
    return highlightedPath.links.some(l => {
      const lSource = typeof l.source === 'string' ? l.source : l.source;
      const lTarget = typeof l.target === 'string' ? l.target : l.target;
      const linkSource = typeof link.source === 'string' ? link.source : (link.source as SimulationNode).id;
      const linkTarget = typeof link.target === 'string' ? link.target : (link.target as SimulationNode).id;
      return (lSource === linkSource && lTarget === linkTarget) ||
             (lSource === linkTarget && lTarget === linkSource);
    });
  }, [highlightedPath]);

  // Handle link click
  const handleLinkClick = useCallback((link: SimulationLink) => {
    const sourceNode = typeof link.source === 'object' ? link.source : nodeMap.get(link.source as string);
    const targetNode = typeof link.target === 'object' ? link.target : nodeMap.get(link.target as string);

    if (sourceNode && targetNode) {
      setSelectedLink({
        link: link as NetworkLink,
        sourceNode: sourceNode as NetworkNode,
        targetNode: targetNode as NetworkNode,
      });
    }
  }, [nodeMap]);

  // Handle node click - set as start entity
  const handleNodeClick = useCallback((node: SimulationNode) => {
    if (!startEntity) {
      setStartEntity(node.id);
    } else if (startEntity === node.id) {
      setStartEntity(null);
      setEndEntity(null);
    } else if (!endEntity) {
      setEndEntity(node.id);
    } else {
      setStartEntity(node.id);
      setEndEntity(null);
    }
  }, [startEntity, endEntity]);

  // Clear all filters
  const clearFilters = () => {
    setStartEntity(null);
    setEndEntity(null);
    setFilterRelationships([]);
    setFilterNodeTypes([]);
    setHighlightedPath(null);
    setSearchQuery('');
  };

  // Empty state
  if (!networkData || networkData.nodes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">MONEY TRAIL EXPLORER</h2>
            <p className="text-sm text-slate-400">Trace funding flows between donors, foundations, and recipients</p>
          </div>
          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Wifi className="h-3.5 w-3.5" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-400">
                <WifiOff className="h-3.5 w-3.5" />
                Configure Supabase
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center h-96 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="text-center max-w-md">
            <Network className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">No Network Data</h3>
            <p className="text-sm text-slate-400">
              {!isSupabaseConfigured
                ? 'Configure Supabase to load donor-media network data.'
                : 'No connections found. Add data to the donors and media_funding tables.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">MONEY TRAIL EXPLORER</h2>
          <p className="text-sm text-slate-400">Click any connection to reveal the full funding chain</p>
        </div>
        <div className="flex items-center gap-2">
          {isSupabaseConfigured && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Wifi className="h-3.5 w-3.5" />
              Live
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Start Entity Selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Start Entity</label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              <select
                value={startEntity || ''}
                onChange={(e) => {
                  setStartEntity(e.target.value || null);
                  if (!e.target.value) setEndEntity(null);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select start entity...</option>
                {filteredNodes.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({NODE_TYPE_INFO[node.type]?.label || node.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* End Entity Selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">End Entity (Optional)</label>
            <div className="relative">
              <Route className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500" />
              <select
                value={endEntity || ''}
                onChange={(e) => setEndEntity(e.target.value || null)}
                disabled={!startEntity}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              >
                <option value="">Any destination...</option>
                {filteredNodes.filter(n => n.id !== startEntity).map(node => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({NODE_TYPE_INFO[node.type]?.label || node.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Max Hops */}
          <div className="w-32">
            <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Max Hops</label>
            <select
              value={maxHops}
              onChange={(e) => setMaxHops(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value={1}>1 hop</option>
              <option value={2}>2 hops</option>
              <option value={3}>3 hops</option>
              <option value={4}>4 hops</option>
              <option value={5}>5 hops</option>
            </select>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showFilters || filterRelationships.length > 0 || filterNodeTypes.length > 0
                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {(filterRelationships.length > 0 || filterNodeTypes.length > 0) && (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                {filterRelationships.length + filterNodeTypes.length}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear */}
          {(startEntity || filterRelationships.length > 0 || filterNodeTypes.length > 0) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg text-sm border border-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700 grid md:grid-cols-2 gap-4">
            {/* Relationship Type Filter */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">Relationship Types</label>
              <div className="flex flex-wrap gap-2">
                {relationshipTypes.map(rel => (
                  <button
                    key={rel}
                    onClick={() => {
                      setFilterRelationships(prev =>
                        prev.includes(rel) ? prev.filter(r => r !== rel) : [...prev, rel]
                      );
                    }}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      filterRelationships.includes(rel)
                        ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {RELATIONSHIP_LABELS[rel] || rel}
                  </button>
                ))}
              </div>
            </div>

            {/* Node Type Filter */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">Entity Types</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(NODE_TYPE_INFO).map(([type, info]) => {
                  const Icon = NODE_ICONS[type] || DollarSign;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setFilterNodeTypes(prev =>
                          prev.includes(type as NetworkNode['type'])
                            ? prev.filter(t => t !== type)
                            : [...prev, type as NetworkNode['type']]
                        );
                      }}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                        filterNodeTypes.includes(type as NetworkNode['type'])
                          ? 'border-opacity-50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                      }`}
                      style={filterNodeTypes.includes(type as NetworkNode['type']) ? {
                        backgroundColor: info.color + '20',
                        color: info.color,
                        borderColor: info.color + '50',
                      } : undefined}
                    >
                      <Icon className="h-3 w-3" />
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Include Intermediaries Toggle */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeIntermediaries}
                  onChange={(e) => setIncludeIntermediaries(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-300">Include intermediary/shell organizations in paths</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Network Visualization */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
        {/* Viz Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Network Graph</span>
            <span className="text-xs text-slate-500">
              {displayNetwork.nodes.length} entities · {displayNetwork.links.length} connections
            </span>
            {isSimulating && (
              <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.25))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={restartSimulation}
              className="p-1 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* SVG Canvas */}
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <svg
            ref={svgRef}
            width="100%"
            height={600}
            viewBox={`0 0 ${1000 / zoom} ${600 / zoom}`}
            className="bg-slate-950"
          >
            <g>
              {/* Links */}
              <g className="links">
                {simulationLinks.map((link, i) => {
                  const source = link.source as SimulationNode;
                  const target = link.target as SimulationNode;
                  if (!source.x || !target.x) return null;

                  const highlighted = isLinkHighlighted(link);
                  const isStart = startEntity && (source.id === startEntity || target.id === startEntity);

                  return (
                    <g key={`link-${i}`}>
                      {/* Clickable wider hitbox */}
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="transparent"
                        strokeWidth={12}
                        className="cursor-pointer"
                        onClick={() => handleLinkClick(link)}
                      />
                      {/* Visible line */}
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={isStart ? '#10b981' : highlighted ? '#06b6d4' : '#334155'}
                        strokeWidth={link.amount ? Math.min(4, 1 + Math.log10(link.amount / 100000)) : 1.5}
                        strokeOpacity={highlighted ? 0.8 : 0.2}
                        strokeDasharray={(link as NetworkLink).confidence === 'low' ? '4 2' : undefined}
                        className="pointer-events-none transition-all duration-200"
                      />
                      {/* Amount label for significant links */}
                      {link.amount && link.amount > 1000000 && highlighted && (
                        <text
                          x={(source.x + target.x) / 2}
                          y={(source.y + target.y) / 2 - 8}
                          textAnchor="middle"
                          className="text-[10px] fill-emerald-400 pointer-events-none"
                        >
                          {formatCurrency(link.amount)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Nodes */}
              <g className="nodes">
                {simulationNodes.map((node) => {
                  const radius = getNodeRadius(node);
                  const color = getNodeColor(node);
                  const highlighted = isNodeHighlighted(node);
                  const isSelected = startEntity === node.id || endEntity === node.id;
                  const isHovered = hoveredNode?.id === node.id;
                  const Icon = NODE_ICONS[node.type] || DollarSign;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => handleNodeClick(node)}
                      className="cursor-pointer"
                      style={{ opacity: highlighted ? 1 : 0.25 }}
                    >
                      {/* Selection ring */}
                      {isSelected && (
                        <circle
                          r={radius + 6}
                          fill="none"
                          stroke={startEntity === node.id ? '#10b981' : '#06b6d4'}
                          strokeWidth={2}
                          strokeDasharray="4 2"
                          className="animate-pulse"
                        />
                      )}
                      {/* Node circle */}
                      <circle
                        r={radius}
                        fill={color}
                        stroke={isHovered ? '#fff' : 'transparent'}
                        strokeWidth={2}
                        className="transition-all duration-150"
                      />
                      {/* Icon */}
                      <Icon
                        x={-radius * 0.4}
                        y={-radius * 0.4}
                        width={radius * 0.8}
                        height={radius * 0.8}
                        className="text-white pointer-events-none"
                        stroke="white"
                        strokeWidth={1.5}
                        fill="none"
                      />
                      {/* Label */}
                      <text
                        y={radius + 14}
                        textAnchor="middle"
                        className="text-[10px] fill-slate-300 pointer-events-none font-medium"
                      >
                        {node.name.length > 18 ? node.name.slice(0, 18) + '...' : node.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        )}

        {/* Tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-slate-800 border border-slate-700 rounded-lg p-3 max-w-xs shadow-xl pointer-events-none">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getNodeColor(hoveredNode) }}
              />
              <span className="font-semibold text-white">{hoveredNode.name}</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Type: {NODE_TYPE_INFO[hoveredNode.type]?.label || hoveredNode.type}</p>
              {hoveredNode.netWorth && <p>Net Worth: ${hoveredNode.netWorth}B</p>}
              {hoveredNode.totalFunding && <p>Total Funding: {formatCurrency(hoveredNode.totalFunding)}</p>}
              {hoveredNode.politicalLean && hoveredNode.politicalLean !== 'unknown' && (
                <p>Political Lean: <span className={
                  hoveredNode.politicalLean === 'left' ? 'text-blue-400' :
                  hoveredNode.politicalLean === 'right' ? 'text-red-400' : 'text-slate-400'
                }>{hoveredNode.politicalLean}</span></p>
              )}
            </div>
            <p className="text-xs text-cyan-400 mt-2">Click to trace from this entity</p>
          </div>
        )}

        {/* Legend */}
        <div className="px-4 py-2 border-t border-slate-800 flex flex-wrap gap-4 text-xs">
          <span className="text-slate-500">Entity Types:</span>
          {Object.entries(NODE_TYPE_INFO).map(([type, info]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
              <span className="text-slate-400">{info.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      {startEntity && networkData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(() => {
            const stats = getNodeStats(networkData, startEntity);
            const startNode = nodeMap.get(startEntity);
            return (
              <>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <span className="text-xs text-slate-400 uppercase">Tracking</span>
                  <p className="text-lg font-bold text-white truncate">{startNode?.name}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <span className="text-xs text-slate-400 uppercase">Outgoing Connections</span>
                  <p className="text-2xl font-bold text-emerald-400">{stats.outgoingCount}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <span className="text-xs text-slate-400 uppercase">Total Given</span>
                  <p className="text-2xl font-bold text-cyan-400">
                    {stats.totalFundingGiven > 0 ? formatCurrency(stats.totalFundingGiven) : 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <span className="text-xs text-slate-400 uppercase">Paths Found</span>
                  <p className="text-2xl font-bold text-purple-400">{displayNetwork.links.length}</p>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Link Detail Panel */}
      {selectedLink && networkData && (
        <LinkDetailPanel
          link={selectedLink.link}
          sourceNode={selectedLink.sourceNode}
          targetNode={selectedLink.targetNode}
          network={networkData}
          onClose={() => setSelectedLink(null)}
          onNodeClick={(nodeId) => {
            setStartEntity(nodeId);
            setEndEntity(null);
            setSelectedLink(null);
          }}
        />
      )}
    </div>
  );
}
