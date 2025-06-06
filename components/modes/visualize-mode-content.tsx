"use client"

import { useState } from "react"
import { ZoomIn, ZoomOut, Download, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VisualizeModeContentProps {
  sessionId: string
  isSearching: boolean
}

interface GraphNode {
  id: string
  label: string
  type: "file" | "function" | "class"
  language: string
  x: number
  y: number
  connections: string[]
}

export default function VisualizeModeContent({ sessionId, isSearching }: VisualizeModeContentProps) {
  const [zoomLevel, setZoomLevel] = useState(100)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

  // Mock graph data
  const nodes: GraphNode[] = [
    {
      id: "utils.py",
      label: "utils.py",
      type: "file",
      language: "python",
      x: 200,
      y: 150,
      connections: ["handlers.js", "user.py"],
    },
    {
      id: "handlers.js",
      label: "handlers.js",
      type: "file",
      language: "javascript",
      x: 400,
      y: 100,
      connections: ["auth.tsx", "user.py"],
    },
    {
      id: "user.py",
      label: "user.py",
      type: "file",
      language: "python",
      x: 300,
      y: 250,
      connections: ["auth.tsx"],
    },
    {
      id: "auth.tsx",
      label: "auth.tsx",
      type: "file",
      language: "typescript",
      x: 500,
      y: 200,
      connections: [],
    },
    {
      id: "parse_json",
      label: "parse_json()",
      type: "function",
      language: "python",
      x: 150,
      y: 100,
      connections: ["utils.py"],
    },
    {
      id: "processData",
      label: "processData()",
      type: "function",
      language: "javascript",
      x: 450,
      y: 50,
      connections: ["handlers.js"],
    },
  ]

  const getNodeColor = (node: GraphNode) => {
    if (node.type === "file") {
      switch (node.language) {
        case "python":
          return "#3776ab"
        case "javascript":
          return "#f7df1e"
        case "typescript":
          return "#3178c6"
        default:
          return "#000000"
      }
    }
    return "#00ff88"
  }

  const getNodeSize = (node: GraphNode) => {
    return node.type === "file" ? 40 : 30
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50))
  }

  const handleReset = () => {
    setZoomLevel(100)
  }

  const handleExport = () => {
    // In a real implementation, this would export the SVG
    alert("EXPORT FUNCTIONALITY WOULD BE IMPLEMENTED HERE")
  }

  const filteredNodes = nodes.filter((node) => {
    if (selectedFilter === "all") return true
    if (selectedFilter === "files") return node.type === "file"
    if (selectedFilter === "functions") return node.type === "function"
    return node.language === selectedFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-black font-mono tracking-tight">CODEBASE VISUALIZATION</h2>
        <div className="bg-[#00ff88] border-2 border-black px-3 py-1 text-black font-black text-sm uppercase">
          {filteredNodes.length} NODES
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000000]">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomOut}
            className="bg-white border-2 border-black text-black font-black uppercase px-3 py-2 h-auto hover:bg-[#e0e0e0] hover:transform hover:translate-y-1 transition-all duration-300 shadow-[2px_2px_0px_#000000] hover:shadow-[1px_1px_0px_#000000]"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="font-black text-black font-mono px-3">{zoomLevel}%</span>
          <Button
            onClick={handleZoomIn}
            className="bg-white border-2 border-black text-black font-black uppercase px-3 py-2 h-auto hover:bg-[#e0e0e0] hover:transform hover:translate-y-1 transition-all duration-300 shadow-[2px_2px_0px_#000000] hover:shadow-[1px_1px_0px_#000000]"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleReset}
            className="bg-white border-2 border-black text-black font-black uppercase px-3 py-2 h-auto hover:bg-[#e0e0e0] hover:transform hover:translate-y-1 transition-all duration-300 shadow-[2px_2px_0px_#000000] hover:shadow-[1px_1px_0px_#000000]"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            RESET
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-white border-2 border-black text-black font-black uppercase px-3 py-2 focus:outline-none focus:border-[#ff3f3f]"
          >
            <option value="all">ALL NODES</option>
            <option value="files">FILES ONLY</option>
            <option value="functions">FUNCTIONS ONLY</option>
            <option value="python">PYTHON</option>
            <option value="javascript">JAVASCRIPT</option>
            <option value="typescript">TYPESCRIPT</option>
          </select>
          <Button
            onClick={handleExport}
            className="bg-[#00ff88] border-2 border-black text-black font-black uppercase px-3 py-2 h-auto hover:bg-[#00e077] hover:transform hover:translate-y-1 transition-all duration-300 shadow-[2px_2px_0px_#000000] hover:shadow-[1px_1px_0px_#000000]"
          >
            <Download className="w-4 h-4 mr-1" />
            EXPORT
          </Button>
        </div>
      </div>

      {/* Visualization Canvas */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0px_#000000] overflow-hidden">
        <div className="relative h-[500px] overflow-auto">
          <svg
            width="600"
            height="400"
            viewBox="0 0 600 400"
            className="w-full h-full"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* Draw connections */}
            {filteredNodes.map((node) =>
              node.connections.map((connectionId) => {
                const targetNode = filteredNodes.find((n) => n.id === connectionId)
                if (!targetNode) return null
                return (
                  <line
                    key={`${node.id}-${connectionId}`}
                    x1={node.x}
                    y1={node.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="#000000"
                    strokeWidth="3"
                  />
                )
              }),
            )}

            {/* Draw nodes */}
            {filteredNodes.map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={getNodeSize(node)}
                  fill={getNodeColor(node)}
                  stroke="#000000"
                  strokeWidth="3"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
                <text
                  x={node.x}
                  y={node.y + getNodeSize(node) + 15}
                  textAnchor="middle"
                  className="font-black text-xs uppercase fill-black font-mono"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000000]">
        <h3 className="font-black uppercase text-black mb-3 font-mono">LEGEND</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-[#3776ab] border-2 border-black mr-2"></div>
            <span className="font-bold text-black text-sm uppercase">PYTHON</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-[#f7df1e] border-2 border-black mr-2"></div>
            <span className="font-bold text-black text-sm uppercase">JAVASCRIPT</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-[#3178c6] border-2 border-black mr-2"></div>
            <span className="font-bold text-black text-sm uppercase">TYPESCRIPT</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-[#00ff88] border-2 border-black mr-2"></div>
            <span className="font-bold text-black text-sm uppercase">FUNCTIONS</span>
          </div>
        </div>
      </div>
    </div>
  )
}
