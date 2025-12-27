// TimeSeriesAnimation - Animated network evolution over time
// Shows how political funding networks evolve with particle effects and temporal controls

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Calendar,
  TrendingUp,
  Zap,
  Layers,
  Clock,
  DollarSign,
  Target,
  Network,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { useForceLayout, type SimulationNode } from './d3/useForceLayout';
import type { DonorMediaNetwork as NetworkData, NetworkNode, NetworkLink } from '../types/supabase';
import { formatCurrency, NODE_TYPE_INFO, POLITICAL_LEAN_COLORS } from '../utils/pathFinder';

interface TimeSeriesAnimationProps {
  networkData: NetworkData | null;
  isLoading: boolean;
}

interface TimeSlicedNetwork {
  date: Date;
  nodes: NetworkNode[];
  links: NetworkLink[];
  totalFunding: number;
  activeTransactions: number;
}

interface Particle {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  progress: number;
  amount: number;
  color: string;
  size: number;
}

interface PoliticalEvent {
  date: Date;
  label: string;
  type: 'election' | 'scandal' | 'legislation' | 'campaign';
  icon: typeof Award;
  color: string;
}

// Notable political events to mark on timeline
const POLITICAL_EVENTS: PoliticalEvent[] = [
  { date: new Date('2020-11-03'), label: '2020 Election', type: 'election', icon: Award, color: '#3b82f6' },
  { date: new Date('2021-01-06'), label: 'Capitol Events', type: 'scandal', icon: AlertTriangle, color: '#ef4444' },
  { date: new Date('2022-11-08'), label: '2022 Midterms', type: 'election', icon: Award, color: '#3b82f6' },
  { date: new Date('2024-11-05'), label: '2024 Election', type: 'election', icon: Award, color: '#3b82f6' },
];

export function TimeSeriesAnimation({ networkData, isLoading }: TimeSeriesAnimationProps) {
  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [viewMode, setViewMode] = useState<'cumulative' | 'snapshot'>('cumulative');
  const [showParticles, setShowParticles] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [selectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  const animationRef = useRef<number | undefined>(undefined);
  const lastFrameTime = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // Create time-sliced network data
  const timeSlices = useMemo((): TimeSlicedNetwork[] => {
    if (!networkData || !networkData.links.length) return [];

    // Extract all unique years from transactions
    const years = new Set<number>();
    networkData.links.forEach(link => {
      if (link.startYear) {
        years.add(link.startYear);
      }
      if (link.endYear && link.endYear !== link.startYear) {
        years.add(link.endYear);
      }
    });

    const sortedYears = Array.from(years).sort((a, b) => a - b);
    if (sortedYears.length === 0) {
      // No years available, create synthetic timeline (current year)
      const currentYear = new Date().getFullYear();
      const year = currentYear;
      return [{
        date: new Date(year, 0, 1),
        nodes: networkData.nodes,
        links: networkData.links,
        totalFunding: networkData.links.reduce((sum, link) => sum + (link.amount || 0), 0),
        activeTransactions: networkData.links.length,
      }];
    }

    // Create time slices by year
    return sortedYears.map(year => {
      const date = new Date(year, 0, 1);

      // For cumulative: all links up to and including this year
      // For snapshot: only links active in this exact year
      const relevantLinks = networkData.links.filter(link => {
        if (!link.startYear) return false;
        const linkStart = link.startYear;
        const linkEnd = link.endYear || linkStart;

        return viewMode === 'cumulative'
          ? linkStart <= year
          : (linkStart <= year && linkEnd >= year);
      });

      // Get all nodes involved in relevant links
      const nodeIds = new Set<string>();
      relevantLinks.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source;
        const targetId = typeof link.target === 'string' ? link.target : link.target;
        nodeIds.add(sourceId);
        nodeIds.add(targetId);
      });

      const relevantNodes = networkData.nodes.filter(n => nodeIds.has(n.id));

      const totalFunding = relevantLinks.reduce((sum, link) => sum + (link.amount || 0), 0);

      return {
        date,
        nodes: relevantNodes,
        links: relevantLinks,
        totalFunding,
        activeTransactions: relevantLinks.length,
      };
    });
  }, [networkData, viewMode]);

  // Filter by date range if selected
  const filteredTimeSlices = useMemo(() => {
    if (!selectedDateRange) return timeSlices;
    return timeSlices.filter(
      slice => slice.date >= selectedDateRange.start && slice.date <= selectedDateRange.end
    );
  }, [timeSlices, selectedDateRange]);

  // Current network state
  const currentNetwork = useMemo(() => {
    if (filteredTimeSlices.length === 0) return { nodes: [], links: [] };
    const slice = filteredTimeSlices[Math.min(currentTimeIndex, filteredTimeSlices.length - 1)];
    return { nodes: slice.nodes, links: slice.links };
  }, [filteredTimeSlices, currentTimeIndex]);

  // Use D3 force layout for positioning
  const {
    nodes: simulationNodes,
    links: simulationLinks,
  } = useForceLayout(currentNetwork.nodes, currentNetwork.links, {
    width: 1200,
    height: 700,
    chargeStrength: -600,
    linkDistance: 180,
    collisionRadius: 40,
  });

  // Playback animation loop
  useEffect(() => {
    if (!isPlaying || filteredTimeSlices.length === 0) return;

    const animate = (timestamp: number) => {
      if (lastFrameTime.current === 0) {
        lastFrameTime.current = timestamp;
      }

      const deltaTime = timestamp - lastFrameTime.current;
      const frameDelay = 1000 / playbackSpeed; // Frames per second based on speed

      if (deltaTime >= frameDelay) {
        setCurrentTimeIndex(prev => {
          const next = prev + 1;
          if (next >= filteredTimeSlices.length) {
            setIsPlaying(false);
            return prev;
          }
          return next;
        });
        lastFrameTime.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, filteredTimeSlices.length]);

  // Generate particles for current time slice
  const generatedParticles = useMemo(() => {
    if (!showParticles || !simulationLinks.length) {
      return [];
    }

    return simulationLinks
      .filter((_, i) => i % 3 === 0) // Show particles on every 3rd link
      .map((link, i) => {
        const source = link.source as SimulationNode;
        const target = link.target as SimulationNode;

        return {
          id: `particle-${i}-${currentTimeIndex}`,
          sourceX: source.x || 0,
          sourceY: source.y || 0,
          targetX: target.x || 0,
          targetY: target.y || 0,
          progress: 0,
          amount: link.amount || 0,
          color: link.amount && link.amount > 1000000 ? '#10b981' : '#06b6d4',
          size: link.amount ? Math.min(8, 3 + Math.log10(link.amount / 100000)) : 3,
        };
      });
  }, [currentTimeIndex, showParticles, simulationLinks]);

  // Animate particles over time
  useEffect(() => {
    if (generatedParticles.length === 0) return;

    let particleAnimFrame: number;
    let localParticles = [...generatedParticles];

    const animateParticles = () => {
      localParticles = localParticles
        .map(p => ({
          ...p,
          progress: Math.min(1, p.progress + 0.02),
        }))
        .filter(p => p.progress < 1);

      setParticles(localParticles);

      if (localParticles.length > 0) {
        particleAnimFrame = requestAnimationFrame(animateParticles);
      }
    };

    // Start animation after a brief delay to allow layout to settle
    const timeoutId = setTimeout(() => {
      particleAnimFrame = requestAnimationFrame(animateParticles);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (particleAnimFrame) cancelAnimationFrame(particleAnimFrame);
    };
  }, [generatedParticles]);

  // Node radius with animation based on cumulative funding
  const getNodeRadius = useCallback((node: SimulationNode): number => {
    if (!currentNetwork.links.length) return 20;

    // Calculate total funding through this node
    const nodeFunding = currentNetwork.links
      .filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as SimulationNode).id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as SimulationNode).id;
        return sourceId === node.id || targetId === node.id;
      })
      .reduce((sum, link) => sum + (link.amount || 0), 0);

    const baseRadius = 15;
    const maxRadius = 45;
    const scaledRadius = nodeFunding > 0
      ? baseRadius + Math.sqrt(nodeFunding / 1000000) * 3
      : baseRadius;

    return Math.min(maxRadius, scaledRadius);
  }, [currentNetwork.links]);

  // Get node color
  const getNodeColor = (node: SimulationNode): string => {
    if (node.politicalLean && node.politicalLean !== 'unknown') {
      return POLITICAL_LEAN_COLORS[node.politicalLean];
    }
    return NODE_TYPE_INFO[node.type]?.color || '#6b7280';
  };

  // Control functions
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleReset = () => {
    setCurrentTimeIndex(0);
    setIsPlaying(false);
    lastFrameTime.current = 0;
  };
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    lastFrameTime.current = 0;
  };
  const handlePrevious = () => setCurrentTimeIndex(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentTimeIndex(prev => Math.min(filteredTimeSlices.length - 1, prev + 1));

  // Current slice data
  const currentSlice = filteredTimeSlices[Math.min(currentTimeIndex, filteredTimeSlices.length - 1)];

  // Political events visible in current time window
  const visibleEvents = useMemo(() => {
    if (!showEvents || !currentSlice) return [];
    return POLITICAL_EVENTS.filter(event => event.date <= currentSlice.date);
  }, [currentSlice, showEvents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[700px] bg-slate-900/50 border border-slate-800 rounded-lg">
        <div className="text-center">
          <Clock className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading timeline data...</p>
        </div>
      </div>
    );
  }

  if (!networkData || filteredTimeSlices.length === 0) {
    return (
      <div className="flex items-center justify-center h-[700px] bg-slate-900/50 border border-slate-800 rounded-lg">
        <div className="text-center max-w-md">
          <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No Timeline Data</h3>
          <p className="text-sm text-slate-400">
            No temporal data available. Ensure your network links have dateRange information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">TIME-SERIES ANIMATION</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Watch how political funding networks evolved over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {filteredTimeSlices.length} time slices
          </span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Left: Playback Controls */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">
              Playback Controls
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
                title="Reset to start"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={handlePrevious}
                disabled={currentTimeIndex === 0}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous frame"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handlePlayPause}
                className={`p-3 rounded-lg transition-all ${
                  isPlaying
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              <button
                onClick={handleNext}
                disabled={currentTimeIndex >= filteredTimeSlices.length - 1}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next frame"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Speed Controls */}
              <div className="flex items-center gap-1 ml-4">
                <Zap className="h-4 w-4 text-slate-400" />
                {[0.5, 1, 2, 4].map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: View Options */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">
              View Options
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {/* Cumulative vs Snapshot */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cumulative')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    viewMode === 'cumulative'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="h-3 w-3 inline mr-1" />
                  Cumulative
                </button>
                <button
                  onClick={() => setViewMode('snapshot')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    viewMode === 'snapshot'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Target className="h-3 w-3 inline mr-1" />
                  Snapshot
                </button>
              </div>

              {/* Toggle Particles */}
              <button
                onClick={() => setShowParticles(!showParticles)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  showParticles
                    ? 'bg-purple-900/30 text-purple-400 border border-purple-800/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {showParticles ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Particles
              </button>

              {/* Toggle Stats */}
              <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  showStats
                    ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                Stats
              </button>

              {/* Toggle Events */}
              <button
                onClick={() => setShowEvents(!showEvents)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  showEvents
                    ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <Award className="h-3 w-3" />
                Events
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div className="flex-1 relative">
              <input
                type="range"
                min={0}
                max={filteredTimeSlices.length - 1}
                value={currentTimeIndex}
                onChange={(e) => setCurrentTimeIndex(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer timeline-slider"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${
                    (currentTimeIndex / (filteredTimeSlices.length - 1)) * 100
                  }%, #334155 ${(currentTimeIndex / (filteredTimeSlices.length - 1)) * 100}%, #334155 100%)`,
                }}
              />
              {/* Political Event Markers */}
              {showEvents && visibleEvents.map((event, i) => {
                const eventIndex = filteredTimeSlices.findIndex(
                  slice => slice.date >= event.date
                );
                if (eventIndex === -1) return null;
                const position = (eventIndex / (filteredTimeSlices.length - 1)) * 100;
                const EventIcon = event.icon;
                return (
                  <div
                    key={i}
                    className="absolute top-0 -translate-y-6 -translate-x-1/2 pointer-events-none"
                    style={{ left: `${position}%` }}
                    title={event.label}
                  >
                    <div className="flex flex-col items-center">
                      <EventIcon
                        className="h-3 w-3 animate-pulse"
                        style={{ color: event.color }}
                      />
                      <div className="w-0.5 h-3" style={{ backgroundColor: event.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <span className="text-xs text-slate-400 font-mono w-24 text-right flex-shrink-0">
              {currentSlice?.date.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              }) || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {showStats && currentSlice && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 border border-cyan-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Network className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-cyan-400 uppercase tracking-wide">Active Nodes</span>
            </div>
            <p className="text-2xl font-bold text-white">{currentNetwork.nodes.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-purple-400 uppercase tracking-wide">Connections</span>
            </div>
            <p className="text-2xl font-bold text-white">{currentNetwork.links.length}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border border-emerald-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 uppercase tracking-wide">Total Funding</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatCurrency(currentSlice.totalFunding)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-900/20 to-amber-900/5 border border-amber-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-amber-400 uppercase tracking-wide">Transactions</span>
            </div>
            <p className="text-2xl font-bold text-white">{currentSlice.activeTransactions}</p>
          </div>
        </div>
      )}

      {/* Network Visualization */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height={700}
          viewBox="0 0 1200 700"
          className="bg-slate-950"
        >
          <defs>
            {/* Gradient definitions for particles */}
            <radialGradient id="particleGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g>
            {/* Links */}
            <g className="links">
              {simulationLinks.map((link, i) => {
                const source = link.source as SimulationNode;
                const target = link.target as SimulationNode;
                if (!source.x || !target.x) return null;

                const strokeWidth = link.amount
                  ? Math.min(6, 1.5 + Math.log10(link.amount / 100000))
                  : 2;

                return (
                  <line
                    key={`link-${i}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#06b6d4"
                    strokeWidth={strokeWidth}
                    strokeOpacity={0.4}
                    className="transition-all duration-300"
                  />
                );
              })}
            </g>

            {/* Particles (money flow animation) */}
            {showParticles && (
              <g className="particles">
                {particles
                  .filter(p => p.progress <= 1)
                  .map(particle => {
                    const x =
                      particle.sourceX + (particle.targetX - particle.sourceX) * particle.progress;
                    const y =
                      particle.sourceY + (particle.targetY - particle.sourceY) * particle.progress;
                    return (
                      <circle
                        key={particle.id}
                        cx={x}
                        cy={y}
                        r={particle.size}
                        fill={particle.color}
                        filter="url(#glow)"
                        opacity={0.9}
                        className="transition-all duration-100"
                      >
                        <animate
                          attributeName="r"
                          values={`${particle.size};${particle.size * 1.5};${particle.size}`}
                          dur="0.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    );
                  })}
              </g>
            )}

            {/* Nodes */}
            <g className="nodes">
              {simulationNodes.map((node) => {
                const radius = getNodeRadius(node);
                const color = getNodeColor(node);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="transition-all duration-500"
                  >
                    {/* Glow effect */}
                    <circle
                      r={radius + 4}
                      fill={color}
                      opacity={0.2}
                      filter="url(#glow)"
                    />
                    {/* Node circle */}
                    <circle r={radius} fill={color} stroke="#1e293b" strokeWidth={2} />
                    {/* Label */}
                    <text
                      y={radius + 16}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-300 font-medium pointer-events-none"
                    >
                      {node.name.length > 15 ? node.name.slice(0, 15) + '...' : node.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Political Events Timeline */}
      {showEvents && visibleEvents.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Recent Political Events</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {visibleEvents.slice(-4).map((event, i) => {
              const EventIcon = event.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 bg-slate-800/50 border border-slate-700 rounded"
                >
                  <EventIcon className="h-4 w-4 flex-shrink-0" style={{ color: event.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{event.label}</p>
                    <p className="text-xs text-slate-500">
                      {event.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-slate-500 font-semibold">Legend:</span>
          {Object.entries(NODE_TYPE_INFO).map(([type, info]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }} />
              <span className="text-slate-400">{info.label}</span>
            </div>
          ))}
          {showParticles && (
            <div className="flex items-center gap-1.5 ml-4">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Money Flow</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
