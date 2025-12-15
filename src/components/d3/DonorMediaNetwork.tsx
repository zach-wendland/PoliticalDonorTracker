// D3 Force-Directed Network Graph: Donors ↔ Media Outlets
// Shows funding/ownership relationships between wealthy donors and media companies

import { useRef, useState, useCallback, useMemo } from 'react';
import { Network, DollarSign, Tv, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useForceLayout, type SimulationNode, type SimulationLink } from './useForceLayout';
import type { DonorMediaNetwork as NetworkData } from '../../types/supabase';

interface DonorMediaNetworkProps {
  data: NetworkData;
  width?: number;
  height?: number;
  onNodeClick?: (node: SimulationNode) => void;
}

// Color schemes
const DONOR_COLORS: Record<string, string> = {
  individual: '#10b981', // emerald-500
  foundation: '#8b5cf6', // violet-500
  pac: '#f59e0b',        // amber-500
  corporation: '#3b82f6', // blue-500
};

const MEDIA_COLORS: Record<string, string> = {
  TV: '#ef4444',       // red-500
  Print: '#6366f1',    // indigo-500
  Digital: '#06b6d4',  // cyan-500
  Radio: '#f97316',    // orange-500
  Podcast: '#a855f7',  // purple-500
  Other: '#64748b',    // slate-500
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  owner: 'Owns',
  founder: 'Founded',
  investor: 'Invested in',
  board: 'Board member',
  advertiser: 'Advertises on',
  grant: 'Granted to',
  funder: 'Funds',
};

export function DonorMediaNetwork({
  data,
  width = 800,
  height = 600,
  onNodeClick,
}: DonorMediaNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<SimulationNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<SimulationLink | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimulationNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [filterRelationship, setFilterRelationship] = useState<string | null>(null);

  // Filter links by relationship type
  const filteredLinks = useMemo(() => {
    if (!filterRelationship) return data.links;
    return data.links.filter(l => l.relationship === filterRelationship);
  }, [data.links, filterRelationship]);

  // Get nodes that have connections in filtered links
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    filteredLinks.forEach(l => {
      ids.add(l.source as string);
      ids.add(l.target as string);
    });
    return ids;
  }, [filteredLinks]);

  const filteredNodes = useMemo(() => {
    if (!filterRelationship) return data.nodes;
    return data.nodes.filter(n => activeNodeIds.has(n.id));
  }, [data.nodes, filterRelationship, activeNodeIds]);

  // Use D3 force layout
  const {
    nodes,
    links,
    isSimulating,
    restartSimulation,
    setNodePosition,
    releaseNode,
  } = useForceLayout(filteredNodes, filteredLinks, {
    width,
    height,
    chargeStrength: -300,
    linkDistance: 120,
    collisionRadius: 25,
  });

  // Drag handlers
  const handleDragStart = useCallback((node: SimulationNode) => {
    setNodePosition(node.id, node.x, node.y, true);
  }, [setNodePosition]);

  const handleDrag = useCallback((node: SimulationNode, dx: number, dy: number) => {
    setNodePosition(node.id, node.x + dx, node.y + dy, true);
  }, [setNodePosition]);

  const handleDragEnd = useCallback((node: SimulationNode) => {
    releaseNode(node.id);
  }, [releaseNode]);

  // Node click handler
  const handleNodeClick = useCallback((node: SimulationNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
    onNodeClick?.(node);
  }, [onNodeClick]);

  // Get node radius based on type and net worth
  const getNodeRadius = (node: SimulationNode): number => {
    if (node.type === 'donor' && node.netWorth) {
      return Math.min(30, Math.max(15, 10 + Math.sqrt(node.netWorth) * 3));
    }
    return node.type === 'donor' ? 20 : 15;
  };

  // Get node color
  const getNodeColor = (node: SimulationNode): string => {
    if (node.type === 'donor') {
      return DONOR_COLORS[node.donorType || 'individual'] || DONOR_COLORS.individual;
    }
    return MEDIA_COLORS[node.outletType || 'Other'] || MEDIA_COLORS.Other;
  };

  // Check if node/link is highlighted
  const isHighlighted = (node: SimulationNode): boolean => {
    if (!selectedNode && !hoveredNode) return true;
    const activeNode = selectedNode || hoveredNode;
    if (!activeNode) return true;
    if (node.id === activeNode.id) return true;
    return links.some(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      return (sourceId === activeNode.id && targetId === node.id) ||
             (targetId === activeNode.id && sourceId === node.id);
    });
  };

  // Get unique relationship types for filter
  const relationshipTypes = useMemo(() => {
    return [...new Set(data.links.map(l => l.relationship))];
  }, [data.links]);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<SimulationNode | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, node: SimulationNode) => {
    e.preventDefault();
    setIsDragging(true);
    setDragNode(node);
    setDragStart({ x: e.clientX, y: e.clientY });
    handleDragStart(node);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragNode) return;
    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;
    handleDrag(dragNode, dx, dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (dragNode) {
      handleDragEnd(dragNode);
    }
    setIsDragging(false);
    setDragNode(null);
  };

  if (data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900/50 border border-slate-800 rounded-lg">
        <div className="text-center text-slate-400">
          <Network className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No network data available</p>
          <p className="text-sm">Configure Supabase to load donor-media relationships</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Donor-Media Network</h3>
          <span className="text-xs text-slate-500">
            {filteredNodes.length} nodes · {filteredLinks.length} connections
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Relationship filter */}
          <select
            value={filterRelationship || ''}
            onChange={(e) => setFilterRelationship(e.target.value || null)}
            className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300"
          >
            <option value="">All relationships</option>
            {relationshipTypes.map(rel => (
              <option key={rel} value={rel}>{RELATIONSHIP_LABELS[rel] || rel}</option>
            ))}
          </select>
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-1 text-slate-400 hover:text-white"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-500">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.25))}
            className="p-1 text-slate-400 hover:text-white"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          {/* Restart simulation */}
          <button
            onClick={restartSimulation}
            className={`p-1 text-slate-400 hover:text-white ${isSimulating ? 'animate-spin' : ''}`}
            title="Restart simulation"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-slate-950"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`scale(${zoom})`}>
          {/* Links */}
          <g className="links">
            {links.map((link, i) => {
              const source = link.source as SimulationNode;
              const target = link.target as SimulationNode;
              if (!source.x || !target.x) return null;

              const isActive = hoveredLink === link ||
                (selectedNode && (source.id === selectedNode.id || target.id === selectedNode.id));

              return (
                <line
                  key={`link-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isActive ? '#06b6d4' : '#334155'}
                  strokeWidth={isActive ? 2 : 1}
                  strokeOpacity={isHighlighted(source) && isHighlighted(target) ? 0.8 : 0.2}
                  onMouseEnter={() => setHoveredLink(link)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className="cursor-pointer"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {nodes.map((node) => {
              const radius = getNodeRadius(node);
              const color = getNodeColor(node);
              const highlighted = isHighlighted(node);
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onMouseDown={(e) => handleMouseDown(e, node)}
                  onClick={() => handleNodeClick(node)}
                  className="cursor-pointer"
                  style={{ opacity: highlighted ? 1 : 0.3 }}
                >
                  {/* Node circle */}
                  <circle
                    r={radius}
                    fill={color}
                    stroke={isSelected ? '#fff' : isHovered ? '#94a3b8' : 'transparent'}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-150"
                  />
                  {/* Icon */}
                  {node.type === 'donor' ? (
                    <DollarSign
                      x={-radius * 0.5}
                      y={-radius * 0.5}
                      width={radius}
                      height={radius}
                      className="text-white pointer-events-none"
                    />
                  ) : (
                    <Tv
                      x={-radius * 0.4}
                      y={-radius * 0.4}
                      width={radius * 0.8}
                      height={radius * 0.8}
                      className="text-white pointer-events-none"
                    />
                  )}
                  {/* Label */}
                  <text
                    y={radius + 12}
                    textAnchor="middle"
                    className="text-xs fill-slate-300 pointer-events-none"
                    style={{ fontSize: '10px' }}
                  >
                    {node.name.length > 15 ? node.name.slice(0, 15) + '...' : node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Tooltip */}
      {(hoveredNode || hoveredLink) && (
        <div className="absolute bottom-4 left-4 bg-slate-800 border border-slate-700 rounded-lg p-3 max-w-xs shadow-xl">
          {hoveredNode && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getNodeColor(hoveredNode) }}
                />
                <span className="font-semibold text-white">{hoveredNode.name}</span>
              </div>
              <div className="text-xs text-slate-400">
                {hoveredNode.type === 'donor' ? (
                  <>
                    <p>Type: {hoveredNode.donorType}</p>
                    {hoveredNode.netWorth && <p>Net Worth: ${hoveredNode.netWorth}B</p>}
                  </>
                ) : (
                  <>
                    <p>Type: {hoveredNode.outletType}</p>
                    {hoveredNode.domain && <p>Domain: {hoveredNode.domain}</p>}
                  </>
                )}
              </div>
            </>
          )}
          {hoveredLink && !hoveredNode && (
            <>
              <div className="text-sm text-white mb-1">
                {RELATIONSHIP_LABELS[hoveredLink.relationship] || hoveredLink.relationship}
              </div>
              <div className="text-xs text-slate-400">
                {typeof hoveredLink.source === 'object' ? hoveredLink.source.name : hoveredLink.source}
                {' → '}
                {typeof hoveredLink.target === 'object' ? hoveredLink.target.name : hoveredLink.target}
                {hoveredLink.startYear && <p>Since: {hoveredLink.startYear}</p>}
              </div>
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-2 border-t border-slate-800 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Donors:</span>
          {Object.entries(DONOR_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-400 capitalize">{type}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Media:</span>
          {Object.entries(MEDIA_COLORS).slice(0, 4).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-400">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
