"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import ForceGraph2D from "react-force-graph-2d";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color?: string;
  type: "space" | "note" | "source" | "chunk";
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface KnowledgeGraphProps {
  spaceId?: string;
}

export function KnowledgeGraph({ spaceId }: KnowledgeGraphProps) {
  const graphRef = useRef<any>();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { theme } = useTheme();

  // Generate mock data for the graph
  useEffect(() => {
    const mockData: GraphData = {
      nodes: [
        { id: "space-1", name: "Machine Learning", val: 20, type: "space", color: "#ff6b6b" },
        { id: "note-1", name: "Neural Networks", val: 10, type: "note", color: "#4ecdc4" },
        { id: "note-2", name: "Deep Learning", val: 10, type: "note", color: "#4ecdc4" },
        { id: "note-3", name: "Reinforcement Learning", val: 10, type: "note", color: "#4ecdc4" },
        { id: "source-1", name: "ML Textbook", val: 15, type: "source", color: "#ffe66d" },
        { id: "source-2", name: "Research Paper", val: 15, type: "source", color: "#ffe66d" },
        { id: "chunk-1", name: "Neural Network Architecture", val: 5, type: "chunk", color: "#1a535c" },
        { id: "chunk-2", name: "Backpropagation", val: 5, type: "chunk", color: "#1a535c" },
        { id: "chunk-3", name: "Activation Functions", val: 5, type: "chunk", color: "#1a535c" },
      ],
      links: [
        { source: "space-1", target: "note-1", value: 1 },
        { source: "space-1", target: "note-2", value: 1 },
        { source: "space-1", target: "note-3", value: 1 },
        { source: "space-1", target: "source-1", value: 1 },
        { source: "space-1", target: "source-2", value: 1 },
        { source: "note-1", target: "chunk-1", value: 1 },
        { source: "note-1", target: "chunk-2", value: 1 },
        { source: "note-2", target: "chunk-2", value: 1 },
        { source: "note-2", target: "chunk-3", value: 1 },
        { source: "source-1", target: "chunk-1", value: 1 },
        { source: "source-2", target: "chunk-3", value: 1 },
      ],
    };

    setGraphData(mockData);
  }, [spaceId]);

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setDimensions({
          width: window.innerWidth > 1200 ? 1000 : window.innerWidth - 100,
          height: 600,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Adjust graph on theme change
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge").strength(-120);
      graphRef.current.d3Force("link").distance(70);
      graphRef.current.d3Force("center", null);
    }
  }, [graphRef, theme]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Knowledge Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] w-full">
            {typeof window !== "undefined" && (
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                width={dimensions.width}
                height={dimensions.height}
                nodeLabel="name"
                nodeColor={(node: any) => node.color}
                nodeRelSize={6}
                linkWidth={1}
                linkColor={() => theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
                backgroundColor="transparent"
                nodeCanvasObjectMode={() => "after"}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 12/globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillStyle = theme === "dark" ? "white" : "black";
                  
                  if (globalScale >= 0.8) {
                    ctx.fillText(label, node.x, node.y + 10);
                  }
                }}
                cooldownTicks={100}
                onEngineStop={() => {
                  if (graphRef.current) {
                    graphRef.current.zoomToFit(400);
                  }
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 