import { EnhancedChunk } from "./types";
import { getAIInsights } from "./novita-ai";

type ChunkType = 'component' | 'api' | 'config' | 'utility' | 'style' | 'test';

function detectFileType(filePath: string, content: string): ChunkType {
  const fileName = filePath.split('/').pop() || '';
  
  // API routes
  if (filePath.includes('/api/') && fileName === 'route.ts') {
    return 'api';
  }
  
  // React components
  if (content.includes('export default function') || 
      (content.includes('export default') && content.includes('return ('))) {
    return 'component';
  }
  
  // Configuration files
  if (fileName.endsWith('.json') || 
      fileName.includes('config') || 
      fileName.includes('.env')) {
    return 'config';
  }
  
  // Style files
  if (fileName.endsWith('.css') || 
      fileName.endsWith('.scss') || 
      content.includes('@apply')) {
    return 'style';
  }
  
  // Default to utility if not caught by more specific types
  return 'utility'; 
}

function generateChunkId(): string {
  // Placeholder for chunk ID generation (e.g., UUID)
  return `chunk-${Math.random().toString(36).substr(2, 9)}`; 
}

function cleanContent(content: string): string {
  // Placeholder for cleaning/normalization logic
  return content.trim();
}

function extractImports(content: string): string[] {
  // Placeholder for import extraction logic
  const imports = content.match(/import\s+.*?from\s+['"](.*?)['"]/g);
  return imports ? imports.map(i => i.split(/from\s+['"]/)[1].replace(/['";]/g, '')) : [];
}

function extractExports(content: string): string[] {
  // Placeholder for export extraction logic
  const exports = content.match(/export\s+(default\s+)?(function|const|class|let|var)?\s*([a-zA-Z0-9_]+)/g);
  return exports ? exports.map(e => e.split(/\s+/).pop() || '') : [];
}

function detectCodePatterns(content: string, fileType: ChunkType): string[] {
  // Placeholder for code pattern detection logic
  const patterns: string[] = [];
  if (fileType === 'component' && content.includes('useState')) patterns.push('react-hook');
  if (fileType === 'api' && content.includes('NextResponse')) patterns.push('nextjs-api-route');
  return patterns;
}

function splitByFunctions(content: string, filePath: string): EnhancedChunk[] {
  // Placeholder for splitting utility files by function boundaries
  // This would involve AST parsing or regex to find function definitions.
  const chunks: EnhancedChunk[] = [];
  const lines = content.split('\n');
  let currentChunkStartLine = 1;
  let functionRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\(.*?\)|(?:export\s+)?(?:const|let|var)?\s*([a-zA-Z0-9_]+)\s*=\s*(?:async\s+)?\(.*?\)\s*=>/; // Basic regex for functions

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(functionRegex) && i + 1 > currentChunkStartLine) {
      // If a new function is detected, create a chunk for the previous content
      chunks.push({
        sessionId: "", // Will be filled later
        chunkId: generateChunkId(),
        filePath,
        fileName: filePath.split('/').pop() || '',
        fileExtension: filePath.split('.').pop() || '',
        originalContent: lines.slice(currentChunkStartLine - 1, i).join('\n'),
        processedContent: cleanContent(lines.slice(currentChunkStartLine - 1, i).join('\n')),
        startLine: currentChunkStartLine,
        endLine: i,
        chunkType: 'utility', // Or infer more specifically
        importance: 'supporting', // Default
        dependencies: [], // Will be filled later
        exports: [], // Will be filled later
        codePatterns: [], // Will be filled later
        explanation: '', // Will be filled later
        purpose: '', // Will be filled later
        complexity: 'simple', // Default
      });
      currentChunkStartLine = i + 1;
    }
  }
  // Add the last chunk
  if (currentChunkStartLine <= lines.length) {
    chunks.push({
      sessionId: "",
      chunkId: generateChunkId(),
      filePath,
      fileName: filePath.split('/').pop() || '',
      fileExtension: filePath.split('.').pop() || '',
      originalContent: lines.slice(currentChunkStartLine - 1, lines.length).join('\n'),
      processedContent: cleanContent(lines.slice(currentChunkStartLine - 1, lines.length).join('\n')),
      startLine: currentChunkStartLine,
      endLine: lines.length,
      chunkType: 'utility',
      importance: 'supporting',
      dependencies: [],
      exports: [],
      codePatterns: [],
      explanation: '',
      purpose: '',
      complexity: 'simple',
    });
  }
  return chunks;
}

function createDefaultChunks(content: string, filePath: string): EnhancedChunk[] {
  // Default chunking strategy if no specific rules apply (e.g., chunk the entire file)
  const lines = content.split('\n');
  return [{
    sessionId: "",
    chunkId: generateChunkId(),
    filePath,
    fileName: filePath.split('/').pop() || '',
    fileExtension: filePath.split('.').pop() || '',
    originalContent: content,
    processedContent: cleanContent(content),
    startLine: 1,
    endLine: lines.length,
    chunkType: 'utility', // Default, can be refined
    importance: 'supporting',
    dependencies: [],
    exports: [],
    codePatterns: [],
    explanation: '',
    purpose: '',
    complexity: 'simple',
  }];
}

export async function createIntelligentChunks(filePath: string, content: string): Promise<EnhancedChunk[]> {
  const fileType = detectFileType(filePath, content);
  const fileName = filePath.split('/').pop() || '';
  const fileExtension = fileName.split('.').pop() || '';
  
  let initialChunks: EnhancedChunk[] = [];

  switch (fileType) {
    case 'component':
    case 'api':
    case 'config':
    case 'style':
      initialChunks.push({
        sessionId: "", // Will be filled later
        chunkId: generateChunkId(),
        filePath,
        fileName,
        fileExtension,
        originalContent: content,
        processedContent: cleanContent(content),
        startLine: 1,
        endLine: content.split('\n').length,
        chunkType: fileType,
        dependencies: extractImports(content),
        exports: extractExports(content),
        codePatterns: detectCodePatterns(content, fileType),
        importance: 'supporting',
        explanation: '',
        purpose: '',
        complexity: 'simple',
      });
      break;
      
    case 'utility':
      initialChunks = splitByFunctions(content, filePath);
      break;
      
    case 'test':
      initialChunks = createDefaultChunks(content, filePath);
      break;

    default:
      initialChunks = createDefaultChunks(content, filePath);
      break;
  }

  // Enrich chunks with AI-generated insights
  const enrichedChunks = await Promise.all(initialChunks.map(async (chunk) => {
    const prompt = `Analyze the following code snippet from ${chunk.filePath} (lines ${chunk.startLine}-${chunk.endLine}):

\`\`\`${chunk.originalContent}\`\`\`

Provide a concise explanation, its main purpose, and its complexity (simple, moderate, or complex) in a JSON object format: { "explanation": "...", "purpose": "...", "complexity": "..." }`;
    try {
      const aiInsights = await getAIInsights(prompt);
      return {
        ...chunk,
        explanation: aiInsights.explanation,
        purpose: aiInsights.purpose,
        complexity: aiInsights.complexity,
      };
    } catch (error) {
      console.error(`Error enriching chunk ${chunk.chunkId} with AI insights:`, error);
      // Fallback in case of AI error
      return {
        ...chunk,
        explanation: chunk.explanation || "Could not generate AI explanation.",
        purpose: chunk.purpose || "Could not determine AI purpose.",
        complexity: chunk.complexity || 'moderate',
      };
    }
  }));

  return enrichedChunks;
} 