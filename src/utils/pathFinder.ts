// Path-finding utilities for Money Trail Explorer
// Traces money flows between entities across the network graph

import type {
  NetworkNode,
  NetworkLink,
  MoneyPath,
  PathFinderOptions,
  DonorMediaNetwork,
} from '../types/supabase';

/**
 * Find all paths between two nodes in the network
 * Uses BFS to find shortest paths up to maxHops
 */
export function findPaths(
  network: DonorMediaNetwork,
  startId: string,
  endId: string | null,
  options: PathFinderOptions
): MoneyPath[] {
  const { maxHops, filterByRelationship, filterByNodeType } = options;
  const paths: MoneyPath[] = [];

  // Build adjacency list for faster lookups
  const adjacencyMap = buildAdjacencyMap(network, filterByRelationship);
  const nodeMap = new Map(network.nodes.map(n => [n.id, n]));

  // BFS queue: [currentNodeId, path of node IDs, path of links]
  const queue: Array<{
    nodeId: string;
    nodePath: string[];
    linkPath: NetworkLink[];
    totalAmount: number;
  }> = [{
    nodeId: startId,
    nodePath: [startId],
    linkPath: [],
    totalAmount: 0,
  }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // If we've reached max hops, skip
    if (current.nodePath.length > maxHops + 1) continue;

    // If endId is specified and we've reached it, add to paths
    if (endId && current.nodeId === endId && current.nodePath.length > 1) {
      const nodes = current.nodePath.map(id => nodeMap.get(id)!).filter(Boolean);
      paths.push({
        nodes,
        links: current.linkPath,
        totalAmount: current.totalAmount,
        hopCount: current.linkPath.length,
      });
      continue;
    }

    // If no endId specified, collect all reachable paths
    if (!endId && current.nodePath.length > 1) {
      const nodes = current.nodePath.map(id => nodeMap.get(id)!).filter(Boolean);
      paths.push({
        nodes,
        links: current.linkPath,
        totalAmount: current.totalAmount,
        hopCount: current.linkPath.length,
      });
    }

    // Get adjacent nodes
    const adjacent = adjacencyMap.get(current.nodeId) || [];

    for (const { targetId, link } of adjacent) {
      // Skip if already in path (avoid cycles)
      if (current.nodePath.includes(targetId)) continue;

      // Apply node type filter if specified
      const targetNode = nodeMap.get(targetId);
      if (filterByNodeType && targetNode && !filterByNodeType.includes(targetNode.type)) {
        continue;
      }

      queue.push({
        nodeId: targetId,
        nodePath: [...current.nodePath, targetId],
        linkPath: [...current.linkPath, link],
        totalAmount: current.totalAmount + (link.amount || 0),
      });
    }
  }

  // Sort by total amount descending
  return paths.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Build adjacency map for faster graph traversal
 */
function buildAdjacencyMap(
  network: DonorMediaNetwork,
  filterByRelationship?: string[]
): Map<string, Array<{ targetId: string; link: NetworkLink }>> {
  const map = new Map<string, Array<{ targetId: string; link: NetworkLink }>>();

  for (const link of network.links) {
    // Apply relationship filter
    if (filterByRelationship && !filterByRelationship.includes(link.relationship)) {
      continue;
    }

    const sourceId = typeof link.source === 'string' ? link.source : link.source;
    const targetId = typeof link.target === 'string' ? link.target : link.target;

    // Add forward edge
    if (!map.has(sourceId)) map.set(sourceId, []);
    map.get(sourceId)!.push({ targetId, link });

    // Add reverse edge (for bidirectional traversal)
    if (!map.has(targetId)) map.set(targetId, []);
    map.get(targetId)!.push({ targetId: sourceId, link });
  }

  return map;
}

/**
 * Get all direct connections for a node
 */
export function getDirectConnections(
  network: DonorMediaNetwork,
  nodeId: string
): { incoming: NetworkLink[]; outgoing: NetworkLink[] } {
  const incoming: NetworkLink[] = [];
  const outgoing: NetworkLink[] = [];

  for (const link of network.links) {
    const sourceId = typeof link.source === 'string' ? link.source : link.source;
    const targetId = typeof link.target === 'string' ? link.target : link.target;

    if (sourceId === nodeId) outgoing.push(link);
    if (targetId === nodeId) incoming.push(link);
  }

  return { incoming, outgoing };
}

/**
 * Find shared board members between organizations
 */
export function findSharedBoardMembers(
  nodeA: NetworkNode,
  nodeB: NetworkNode
): string[] {
  if (!nodeA.boardMembers || !nodeB.boardMembers) return [];

  const setA = new Set(nodeA.boardMembers);
  return nodeB.boardMembers.filter(member => setA.has(member));
}

/**
 * Calculate network statistics for a node
 */
export function getNodeStats(
  network: DonorMediaNetwork,
  nodeId: string
): {
  incomingCount: number;
  outgoingCount: number;
  totalFundingReceived: number;
  totalFundingGiven: number;
  connectedNodeTypes: Record<string, number>;
} {
  const { incoming, outgoing } = getDirectConnections(network, nodeId);
  const nodeMap = new Map(network.nodes.map(n => [n.id, n]));

  const connectedNodeTypes: Record<string, number> = {};

  // Count incoming connections by type
  for (const link of incoming) {
    const sourceId = typeof link.source === 'string' ? link.source : link.source;
    const sourceNode = nodeMap.get(sourceId);
    if (sourceNode) {
      connectedNodeTypes[sourceNode.type] = (connectedNodeTypes[sourceNode.type] || 0) + 1;
    }
  }

  // Count outgoing connections by type
  for (const link of outgoing) {
    const targetId = typeof link.target === 'string' ? link.target : link.target;
    const targetNode = nodeMap.get(targetId);
    if (targetNode) {
      connectedNodeTypes[targetNode.type] = (connectedNodeTypes[targetNode.type] || 0) + 1;
    }
  }

  return {
    incomingCount: incoming.length,
    outgoingCount: outgoing.length,
    totalFundingReceived: incoming.reduce((sum, l) => sum + (l.amount || 0), 0),
    totalFundingGiven: outgoing.reduce((sum, l) => sum + (l.amount || 0), 0),
    connectedNodeTypes,
  };
}

/**
 * Find all intermediary organizations between two nodes
 */
export function findIntermediaries(
  network: DonorMediaNetwork,
  startId: string,
  endId: string,
  maxHops: number = 3
): NetworkNode[] {
  const paths = findPaths(network, startId, endId, {
    maxHops,
    includeIntermediaries: true,
  });

  const intermediaryIds = new Set<string>();

  for (const path of paths) {
    // Skip first and last node (they are start/end)
    for (let i = 1; i < path.nodes.length - 1; i++) {
      intermediaryIds.add(path.nodes[i].id);
    }
  }

  return network.nodes.filter(n => intermediaryIds.has(n.id));
}

/**
 * Identify potential shell organizations (high pass-through, low activity)
 */
export function identifyShellOrgs(
  network: DonorMediaNetwork
): NetworkNode[] {
  return network.nodes.filter(node => {
    if (node.type !== 'foundation' && node.type !== 'shell_org') return false;

    const stats = getNodeStats(network, node.id);

    // Shell org indicators:
    // - Multiple incoming and outgoing connections
    // - Similar amounts in and out
    // - No clear primary activity
    const isPassThrough =
      stats.incomingCount >= 1 &&
      stats.outgoingCount >= 2 &&
      Math.abs(stats.totalFundingReceived - stats.totalFundingGiven) < stats.totalFundingReceived * 0.2;

    return isPassThrough;
  });
}

/**
 * Get downstream recipients from a source node
 */
export function getDownstreamRecipients(
  network: DonorMediaNetwork,
  sourceId: string,
  maxHops: number = 3
): Array<{ node: NetworkNode; totalAmount: number; pathCount: number }> {
  const paths = findPaths(network, sourceId, null, {
    maxHops,
    includeIntermediaries: true,
  });

  const recipientMap = new Map<string, { node: NetworkNode; totalAmount: number; pathCount: number }>();

  for (const path of paths) {
    const endNode = path.nodes[path.nodes.length - 1];
    if (endNode.id === sourceId) continue;

    const existing = recipientMap.get(endNode.id);
    if (existing) {
      existing.totalAmount += path.totalAmount;
      existing.pathCount += 1;
    } else {
      recipientMap.set(endNode.id, {
        node: endNode,
        totalAmount: path.totalAmount,
        pathCount: 1,
      });
    }
  }

  return Array.from(recipientMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

/**
 * Get relationship label for display
 */
export const RELATIONSHIP_LABELS: Record<string, string> = {
  owner: 'Owns',
  owns: 'Owns',
  founder: 'Founded',
  founded: 'Founded',
  investor: 'Invested in',
  board: 'Board member',
  board_member: 'Board member',
  advertiser: 'Advertises on',
  advertises_on: 'Advertises on',
  grant: 'Granted to',
  funder: 'Funds',
  funds: 'Funds',
  fiscal_sponsor: 'Fiscal sponsor',
  subsidiary: 'Subsidiary of',
  pass_through: 'Pass-through to',
  donates_to: 'Donates to',
  contracts_with: 'Contracts with',
  lobbies_for: 'Lobbies for',
  endorses: 'Endorses',
  employs: 'Employs',
  bundler: 'Bundler for',
};

/**
 * Get node type display info
 */
export const NODE_TYPE_INFO: Record<string, { label: string; color: string; icon: string }> = {
  donor: { label: 'Donor', color: '#10b981', icon: 'DollarSign' },
  media: { label: 'Media Outlet', color: '#ef4444', icon: 'Tv' },
  foundation: { label: 'Foundation/Lobby', color: '#8b5cf6', icon: 'Building2' },
  pac: { label: 'PAC', color: '#f59e0b', icon: 'Flag' },
  shell_org: { label: 'Shell Organization', color: '#6b7280', icon: 'AlertTriangle' },
  politician: { label: 'Politician', color: '#3b82f6', icon: 'User' },
  foreign_nation: { label: 'Foreign Nation', color: '#dc2626', icon: 'Globe' },
  lobbying_firm: { label: 'Lobbying Firm', color: '#7c3aed', icon: 'Briefcase' },
  think_tank: { label: 'Think Tank', color: '#0891b2', icon: 'BookOpen' },
  super_pac: { label: 'Super PAC', color: '#ea580c', icon: 'Zap' },
};

/**
 * Political lean colors
 */
export const POLITICAL_LEAN_COLORS: Record<string, string> = {
  left: '#3b82f6',    // blue
  right: '#ef4444',   // red
  neutral: '#6b7280', // gray
  unknown: '#9ca3af', // light gray
};
