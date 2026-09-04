"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape, { type Core } from "cytoscape";
import dagre from "cytoscape-dagre";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Network, Info } from "lucide-react";
import type { FindingGraphResponse, GraphNode, GraphEdge } from "@/lib/types";
import { formatINR } from "@/lib/utils";

// Register layout extension safely
if (typeof window !== "undefined") {
  try {
    cytoscape.use(dagre);
  } catch {
    // Already registered
  }
}

interface GraphViewerProps {
  graphData: FindingGraphResponse | null;
  isLoading: boolean;
}

export function GraphViewer({ graphData, isLoading }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<{
    id: string;
    label: string;
    type: string;
    data: Record<string, unknown>;
  } | null>(null);

  useEffect(() => {
    setSelectedElement(null);
    setGraphError(null);
    if (!containerRef.current || !graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return;
    }

    const elements: cytoscape.ElementDefinition[] = [];

    // Map Nodes (support both { data: { id, label } } and flat { id, label })
    (graphData.nodes || []).forEach((node: any) => {
      const data = node.data || node;
      const id = String(data.id || "");
      if (!id) return;
      elements.push({
        group: "nodes",
        data: {
          id,
          label: String(data.label || id),
          type: String(data.kind || data.type || "entity"),
          isSuspicious: Boolean(data.is_suspicious || data.kind === "vendor"),
          exposure: Number(data.total_exposure || 0),
        },
      });
    });

    // Map Edges (support both { data: { source, target, amount_inr } } and flat { source, target, weight })
    (graphData.edges || []).forEach((edge: any, idx: number) => {
      const data = edge.data || edge;
      const source = String(data.source || "");
      const target = String(data.target || "");
      if (!source || !target) return;
      const id = String(data.id || `edge-${idx}-${source}-${target}`);
      const weight = Number(data.amount_inr ?? data.amount ?? data.weight ?? 0);
      elements.push({
        group: "edges",
        data: {
          id,
          source,
          target,
          weight,
          label: weight > 0 ? formatINR(weight) : "",
          isCycle: Boolean(data.is_cycle ?? true),
        },
      });
    });

    let cy: Core;
    try {
    cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#101317",
            "border-width": 2,
            "border-color": "#2E6B72",
            color: "#EDE7DC",
            label: "data(label)",
            "font-size": "11px",
            "font-family": "var(--font-mono, monospace)",
            "text-valign": "bottom",
            "text-margin-y": 6,
            width: 42,
            height: 42,
          },
        },
        {
          selector: "node[?isSuspicious]",
          style: {
            "border-color": "#E8913C",
            "background-color": "#161A1F",
            "border-width": 2.5,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#475569",
            "target-arrow-color": "#475569",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "10px",
            "font-family": "var(--font-mono, monospace)",
            color: "#EDE7DC",
            "text-rotation": "autorotate",
            "text-background-color": "#0A0C0E",
            "text-background-opacity": 0.9,
            "text-background-padding": "3px",
          },
        },
        {
          selector: "edge[?isCycle]",
          style: {
            "line-color": "#E8913C",
            "target-arrow-color": "#E8913C",
            width: 3,
            "line-style": "solid",
          },
        },
        {
          selector: ":selected",
          style: {
            "border-color": "#E8913C",
            "border-width": 4,
            "line-color": "#E8913C",
            "target-arrow-color": "#E8913C",
          },
        },
      ],
      layout: {
        name: "circle",
        padding: 50,
      },
    });

    } catch {
      setGraphError("Money-flow graph could not be displayed. Other investigation evidence remains available.");
      return;
    }
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      setSelectedElement({
        id: node.id(),
        label: node.data("label"),
        type: "Entity Node",
        data: node.data(),
      });
    });

    cy.on("tap", "edge", (evt) => {
      const edge = evt.target;
      setSelectedElement({
        id: edge.id(),
        label: `${edge.source().data("label")} → ${edge.target().data("label")}`,
        type: "Transaction Flow",
        data: edge.data(),
      });
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedElement(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [graphData]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 30);
  const handleReset = () => {
    cyRef.current?.reset();
    cyRef.current?.fit(undefined, 30);
  };

  const hasNodes = graphData && graphData.nodes && graphData.nodes.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col my-6">
      {graphError && <p role="alert" className="p-4 text-xs text-amber-500">{graphError}</p>}
      {/* Graph Toolbar */}
      <div className="p-4 border-b border-border/70 flex items-center justify-between gap-3 bg-secondary/30">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-foreground">Relational Money Flow Graph</h3>
          {hasNodes && (
            <span className="text-xs text-muted-foreground font-mono">
              ({graphData.nodes.length} nodes, {graphData.edges.length} edges)
            </span>
          )}
        </div>

        {hasNodes && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
              title="Fit to Screen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
              title="Reset View"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="relative h-[420px] w-full bg-background/80">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing directed relational graph...</span>
            </div>
          </div>
        ) : !hasNodes ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
            <Info className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="font-medium text-foreground">No circular money-flow evidence for this investigation.</p>
            <p className="max-w-sm mt-1">
              This investigation case does not contain directed multi-party circular fund transfers.
            </p>
          </div>
        ) : (
          <div ref={containerRef} className="h-full w-full" />
        )}

        {/* Element Inspector Overlay */}
        {selectedElement && (
          <div className="absolute bottom-4 left-4 max-w-xs rounded-xl border border-border bg-card/95 p-3.5 shadow-xl text-xs backdrop-blur font-mono">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
              <span className="font-semibold text-emerald-400">{selectedElement.type}</span>
              <button
                onClick={() => setSelectedElement(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <div className="text-foreground font-bold truncate">{selectedElement.label}</div>
              <div className="text-muted-foreground text-[10px]">ID: {selectedElement.id}</div>
              {selectedElement.data.weight !== undefined && (
                <div className="text-emerald-400 font-semibold">
                  Flow: {formatINR(selectedElement.data.weight as number)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
