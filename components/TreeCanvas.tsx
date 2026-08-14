import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

const nodeWidth = 250;
const nodeHeight = 100;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

export default function TreeCanvas({ tree, activeNodeId, onNodeSelect }: { tree: any, activeNodeId: string | null, onNodeSelect: (id: string) => void }) {
  
  const initialElements = useMemo(() => {
    if (!tree) return { nodes: [], edges: [] };
    
    const rfNodes: any[] = [];
    const rfEdges: any[] = [];

    // Parse question nodes
    if (tree.nodes) {
      Object.entries(tree.nodes).forEach(([id, node]: [string, any]) => {
        rfNodes.push({
          id,
          data: { 
            label: (
              <div className="text-xs p-2 whitespace-normal break-words h-full flex flex-col items-center justify-center text-center relative">
                {node.flagged && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border border-background shadow-sm" />
                )}
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[8px] font-bold text-primary/60 uppercase tracking-[0.15em]">
                    {node.text.includes(':') ? node.text.split(':')[0] : 'Entscheidung'}
                  </span>
                </div>
                <span className="font-bold text-[10px] text-foreground leading-tight block mb-1">{node.name || id}</span>
                <div className="text-[9px] text-muted-foreground leading-snug line-clamp-2 italic opacity-80">
                  {node.text.includes(':') ? node.text.split(':').slice(1).join(':').trim() : node.text}
                </div>
              </div>
            )
          },
          style: {
            width: nodeWidth,
            height: nodeHeight,
            border: activeNodeId === id ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
            backgroundColor: activeNodeId === id ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
            borderRadius: '12px',
            color: 'hsl(var(--foreground))'
          }
        });

        node.options.forEach((opt: any) => {
          rfEdges.push({
            id: `${id}->${opt.target}`,
            source: id,
            target: opt.target,
            label: opt.label,
            animated: opt.requiresEvaluation,
            style: { stroke: opt.requiresEvaluation ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))', strokeWidth: 2 },
            labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 },
            labelBgStyle: { fill: 'hsl(var(--background))', stroke: 'hsl(var(--border))', strokeWidth: 1, rx: 4, ry: 4 },
            markerEnd: { type: MarkerType.ArrowClosed, color: opt.requiresEvaluation ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))' }
          });
        });
      });
    }

    // Parse result nodes
    if (tree.results) {
      Object.entries(tree.results).forEach(([id, result]: [string, any]) => {
        rfNodes.push({
          id,
          data: { 
            label: (
              <div className="text-xs p-2 h-full flex flex-col items-center justify-center text-center">
                <span className="font-bold text-[10px] text-success uppercase tracking-wider mb-1 block">Result ({id})</span>
                <span className="font-bold text-sm text-foreground">{result.title}</span>
                {result.referenced_requirements && result.referenced_requirements.length > 0 && (
                  <span className="text-[10px] mt-2 bg-success/20 text-success px-2 py-0.5 rounded-full">
                    {result.referenced_requirements.length} Reqs
                  </span>
                )}
              </div>
            )
          },
          style: {
            width: nodeWidth,
            height: nodeHeight,
            border: activeNodeId === id ? '2px solid hsl(var(--success))' : '2px solid hsl(var(--success) / 0.5)',
            backgroundColor: activeNodeId === id ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--card))',
            borderRadius: '12px',
            color: 'hsl(var(--foreground))'
          }
        });
      });
    }

    return getLayoutedElements(rfNodes, rfEdges);
  }, [tree, activeNodeId]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={initialElements.nodes}
        edges={initialElements.edges}
        onNodeClick={(_, node) => onNodeSelect(node.id)}
        fitView
        className="bg-background"
      >
        <Controls />
        <MiniMap zoomable pannable nodeColor={(node) => {
          return node.id.startsWith('end') ? 'hsl(var(--success))' : 'hsl(var(--card))'
        }} />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
