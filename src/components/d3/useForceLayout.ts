// D3 Force Simulation Hook for Network Graphs
// Uses D3 for physics calculations, React for rendering

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { NetworkNode, NetworkLink } from '../../types/supabase';

export interface SimulationNode extends NetworkNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface SimulationLink extends NetworkLink {
  source: SimulationNode | string;
  target: SimulationNode | string;
}

interface UseForceLayoutOptions {
  width: number;
  height: number;
  chargeStrength?: number;
  linkDistance?: number;
  collisionRadius?: number;
}

interface UseForceLayoutReturn {
  nodes: SimulationNode[];
  links: SimulationLink[];
  isSimulating: boolean;
  restartSimulation: () => void;
  stopSimulation: () => void;
  setNodePosition: (nodeId: string, x: number, y: number, fixed?: boolean) => void;
  releaseNode: (nodeId: string) => void;
}

export function useForceLayout(
  inputNodes: NetworkNode[],
  inputLinks: NetworkLink[],
  options: UseForceLayoutOptions
): UseForceLayoutReturn {
  const {
    width,
    height,
    chargeStrength = -400,
    linkDistance = 100,
    collisionRadius = 30,
  } = options;

  const [nodes, setNodes] = useState<SimulationNode[]>([]);
  const [links, setLinks] = useState<SimulationLink[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);

  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);

  // Initialize simulation
  useEffect(() => {
    if (inputNodes.length === 0) {
      setNodes([]);
      setLinks([]);
      return;
    }

    // Create node copies with initial positions
    const simNodes: SimulationNode[] = inputNodes.map((node, i) => ({
      ...node,
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
    }));

    // Create link copies
    const simLinks: SimulationLink[] = inputLinks.map(link => ({
      ...link,
    }));

    // Create simulation
    const simulation = d3.forceSimulation<SimulationNode, SimulationLink>(simNodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(simLinks)
        .id(d => d.id)
        .distance(linkDistance)
      )
      .force('charge', d3.forceManyBody<SimulationNode>()
        .strength(chargeStrength)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimulationNode>()
        .radius(d => d.type === 'donor' ? collisionRadius * 1.5 : collisionRadius)
      )
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    // Update state on each tick
    simulation.on('tick', () => {
      setNodes([...simulation.nodes()]);
      const linkForce = simulation.force<d3.ForceLink<SimulationNode, SimulationLink>>('link');
      if (linkForce) {
        setLinks([...linkForce.links()]);
      }
    });

    // Track when simulation ends
    simulation.on('end', () => {
      setIsSimulating(false);
    });

    simulationRef.current = simulation;

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [inputNodes, inputLinks, width, height, chargeStrength, linkDistance, collisionRadius]);

  // Restart simulation
  const restartSimulation = useCallback(() => {
    if (simulationRef.current) {
      setIsSimulating(true);
      simulationRef.current.alpha(1).restart();
    }
  }, []);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.stop();
      setIsSimulating(false);
    }
  }, []);

  // Set node position (for dragging)
  const setNodePosition = useCallback((nodeId: string, x: number, y: number, fixed = true) => {
    if (simulationRef.current) {
      const node = simulationRef.current.nodes().find(n => n.id === nodeId);
      if (node) {
        node.fx = fixed ? x : null;
        node.fy = fixed ? y : null;
        node.x = x;
        node.y = y;
        simulationRef.current.alpha(0.3).restart();
      }
    }
  }, []);

  // Release node (stop fixing position)
  const releaseNode = useCallback((nodeId: string) => {
    if (simulationRef.current) {
      const node = simulationRef.current.nodes().find(n => n.id === nodeId);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
    }
  }, []);

  return {
    nodes,
    links,
    isSimulating,
    restartSimulation,
    stopSimulation,
    setNodePosition,
    releaseNode,
  };
}
