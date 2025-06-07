export interface SearchResult {
  fileName: string
  functionName?: string
  codeSnippet: string
  summary: string
  linesOfCode?: number
  language?: string
  tags?: string[]
  mode?: SearchMode
  similarity?: number
}

export interface UploadResponse {
  sessionId: string
}

export interface SearchRequest {
  sessionId: string
  queryText: string
  mode?: SearchMode
}

export interface SearchResponse {
  results: SearchResult[]
}

export interface ClearSessionRequest {
  sessionId: string
}

export interface ClearSessionResponse {
  message: string
}

export interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

export interface FileItem {
  path: string
  name: string
  language: string
  functions: string[]
}

export interface GraphNode {
  id: string
  label: string
  type: "file" | "function" | "class"
  language: string
  x: number
  y: number
  connections: string[]
}

export interface BuildStep {
  id: string
  title: string
  description: string
  command?: string
  explanation: string
  status: "pending" | "completed" | "current"
  troubleshooting?: string[]
}

export interface EnhancedChunk {
  // Core identifiers
  sessionId: string;
  chunkId: string;
  
  // File information
  filePath: string;
  fileName: string;
  fileExtension: string;
  
  // Content data
  originalContent: string;
  processedContent: string; // cleaned/normalized version
  
  // Structural metadata
  startLine: number;
  endLine: number;
  chunkType: 'component' | 'api' | 'config' | 'utility' | 'style' | 'test';
  
  // Analysis metadata (filled during processing)
  importance: 'critical' | 'important' | 'supporting';
  dependencies: string[]; // what this chunk imports/uses
  exports: string[]; // what this chunk provides
  codePatterns: string[]; // detected patterns like 'react-hook', 'api-route'
  
  // AI-generated insights (filled by Novita.AI)
  explanation: string;
  purpose: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface ProjectAnalysis {
  sessionId: string;
  
  // Project Overview data
  projectType: string; // 'nextjs-app', 'react-spa', 'api-service'
  techStack: string[];
  architecture: string; // 'mvc', 'component-based', 'microservice'
  mainFeatures: string[];
  
  // Build Steps data
  buildOrder: string[]; // ordered list of chunkIds
  dependencies: Map<string, string[]>; // chunkId -> dependent chunkIds
  categories: Map<string, string[]>; // 'setup' -> [chunkIds], 'core' -> [chunkIds]
  
  // Key Files data
  criticalFiles: string[]; // file paths
  importantFiles: string[];
  supportingFiles: string[];
}

export type SearchMode = "build-understand" | "search" | "summarize" | "chat" | "visualize"
