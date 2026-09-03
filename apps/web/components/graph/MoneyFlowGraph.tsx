"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Focus,
  Network,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react";
import { getFindingGraph } from "../../lib/api/findings";
import { GraphPayload, GraphNodeData, GraphEdgeData } from "../../lib/types/api";
import { RoundTripInvestigation } from "./RoundTripInvestigation";
import { formatINR } from "../../lib/utils/formatters";
import { useUiStore } from "../../stores/useUiStore";
import { ErrorEnvelopeAlert } from "../system/ErrorEnvelopeAlert";

// Dynamically import CytoscapeComponent with SSR disabled
const CytoscapeComponent = dynamic<any>(() => import("react-cytoscapejs"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-slate-900 text-slate-400 font-mono text-xs">
      Loading Cytoscape Canvas...
    </div>
  ),
});

interface MoneyFlowGraphProps {
  findingId: string;
  vendorName: string;
}

export const MoneyFlowGraph: React.FC<MoneyFlowGraphProps> = ({ findingId, vendorName }) => {
  const cyRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["finding-graph", findingId],
    queryFn: () => getFindingGraph(findingId),
    enabled: Boolean(findingId),
  });

  const elements = React.useMemo(() => {
    if (!data) return [];
    const nodeElements = data.nodes.map((n) => ({
      data: {
        ...n.data,
        id: n.data.id,
        label: n.data.label,
      },
    }));
    const edgeElements = data.edges.map((e) => ({
      data: {
        ...e.data,
        id: e.data.id,
        source: e.data.source,
        target: e.data.target,
        label: e.data.label,
      },
    }));
    return [...nodeElements, ...edgeElements];
  }, [data]);

  const stylesheet: any = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: "#F8FAFC",
        "font-size": "11px",
        "font-weight": 600,
        "text-valign": "bottom",
        "text-margin-y": 8,
        "background-color": "#3B82F6",
        width: 44,
        height: 44,
        "border-width": 2,
        "border-color": "#1E3A8A",
      },
    },
    {
      selector: 'node[type = "company"]',
      style: {
        "background-color": "#4F46E5",
        "border-color": "#C7D2FE",
        "border-width": 3,
        width: 52,
        height: 52,
      },
    },
    {
      selector: 'node[type = "vendor"]',
      style: {
        "background-color": "#EF4444",
        "border-color": "#FCA5A5",
        "border-width": 3,
        width: 48,
        height: 48,
      },
    },
    {
      selector: 'node[type = "account"]',
      style: {
        "background-color": "#10B981",
        "border-color": "#A7F3D0",
        width: 40,
        height: 40,
      },
    },
    {
      selector: "edge",
      style: {
        width: 2.5,
        "line-color": "#64748B",
        "target-arrow-color": "#64748B",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        label: "data(label)",
        color: "#E2E8F0",
        "font-size": "10px",
        "font-weight": 500,
        "text-background-color": "#0F172A",
        "text-background-opacity": 0.85,
        "text-background-padding": 3,
        "text-background-shape": "roundrectangle",
      },
    },
    {
      selector: "edge[?is_cycle]",
      style: {
        width: 3.5,
        "line-color": "#F87171",
        "target-arrow-color": "#F87171",
        "line-style": "solid",
        color: "#FCA5A5",
      },
    },
    {
      selector: ":selected",
      style: {
        "border-width": 4,
        "border-color": "#FBBF24",
        "line-color": "#FBBF24",
        "target-arrow-color": "#FBBF24",
      },
    },
  ];

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 30);
    }
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.25);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.reset();
      cyRef.current.fit(undefined, 30);
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  };

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.on("tap", "node", (evt: any) => {
        setSelectedNode(evt.target.data());
        setSelectedEdge(null);
      });

      cyRef.current.on("tap", "edge", (evt: any) => {
        setSelectedEdge(evt.target.data());
        setSelectedNode(null);
      });

      cyRef.current.on("tap", (evt: any) => {
        if (evt.target === cyRef.current) {
          setSelectedNode(null);
          setSelectedEdge(null);
        }
      });
    }
  }, [elements]);

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto" : ""}`}>
      {/* Round-Trip Hackathon Callout */}
      {data?.cycle_info?.has_cycle && (
        <RoundTripInvestigation cycleInfo={data.cycle_info} vendorName={vendorName} />
      )}

      {/* Graph Visualizer Panel */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative">
        {/* Header toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Network className="w-4 h-4 text-brand-400" />
            <span>Interactive Money-Flow Graph</span>
            {data?.cycle_info?.has_cycle && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                Circular Path Detected
              </span>
            )}
          </div>

          {/* Graph Controls */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Fit to Screen"
            >
              <Focus className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Reset Graph View"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Envelope */}
        {isError && (
          <div className="p-4">
            <ErrorEnvelopeAlert error={error} onRetry={() => refetch()} />
          </div>
        )}

        {/* Cytoscape Canvas */}
        <div className="w-full h-[450px] relative bg-slate-950">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono text-xs">
              Calculating transaction graph topology...
            </div>
          ) : (
            <CytoscapeComponent
              elements={elements}
              style={{ width: "100%", height: "100%" }}
              stylesheet={stylesheet}
              layout={{
                name: "circle",
                padding: 50,
                animate: true,
                animationDuration: 500,
              }}
              cy={(cy: any) => {
                cyRef.current = cy;
              }}
            />
          )}

          {/* Floating Inspection Card: Node or Edge */}
          {selectedNode && (
            <div className="absolute top-4 left-4 z-10 bg-slate-900/95 border border-slate-700 text-white rounded-lg p-3 shadow-xl max-w-xs text-xs space-y-1 backdrop-blur-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-brand-300">Entity Details</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedNode.type}
                </span>
              </div>
              <p className="font-bold text-sm text-slate-100 mt-1">{selectedNode.label}</p>
              {selectedNode.gstin && (
                <p className="font-mono text-[11px] text-slate-400">GSTIN: {selectedNode.gstin}</p>
              )}
              <p className="text-slate-400">Risk Profile Score: <strong className="text-amber-400 font-mono">{selectedNode.risk_score}</strong></p>
            </div>
          )}

          {selectedEdge && (
            <div className="absolute top-4 left-4 z-10 bg-slate-900/95 border border-slate-700 text-white rounded-lg p-3 shadow-xl max-w-xs text-xs space-y-1 backdrop-blur-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-red-400">Transaction Edge</span>
                {selectedEdge.is_cycle && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-900 text-red-200">
                    Cycle Link
                  </span>
                )}
              </div>
              <p className="font-bold text-sm text-white mt-1">{formatINR(selectedEdge.amount)}</p>
              <p className="font-mono text-[11px] text-slate-300">Voucher: {selectedEdge.transaction_id}</p>
              <p className="text-slate-400 text-[11px]">Timestamp: {selectedEdge.timestamp}</p>
            </div>
          )}
        </div>

        {/* Legend Footer */}
        <div className="px-5 py-2.5 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Company Target
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Flagged Counterparty
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Ledger Account
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-400" />
              Circular Edge
            </span>
          </div>
          <span className="italic text-[10px]">Click any node or edge to inspect metadata</span>
        </div>
      </div>
    </div>
  );
};
