import { EnhancedChunk } from "./types";
import { getAIInsights } from "./novita-ai";
import { v4 as uuidv4 } from 'uuid';
import * as parser from '@babel/parser';
import * as _traverse from '@babel/traverse';
import * as t from '@babel/types';

const traverse = _traverse.default;

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

interface Chunk {
  id: string;
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  sessionId: string;
}

const CHUNK_SIZE_LINES = 20; // Chunk by 20 lines of code
const CHUNK_OVERLAP_LINES = 5; // Overlap by 5 lines

export function chunkCode({ content, filePath, sessionId }: { content: string; filePath: string; sessionId: string }): Chunk[] {
  const lines = content.split('\n');
  const chunks: Chunk[] = [];
  
  if (lines.length <= CHUNK_SIZE_LINES) {
    // If the file is small, treat it as a single chunk
    if (content.trim()) {
        chunks.push({
            id: uuidv4(),
            content: content,
            filePath,
            startLine: 1,
            endLine: lines.length,
            sessionId,
        });
    }
    return chunks;
  }

  for (let i = 0; i < lines.length; i += CHUNK_SIZE_LINES - CHUNK_OVERLAP_LINES) {
    const startLine = i;
    const endLine = Math.min(i + CHUNK_SIZE_LINES, lines.length);
    const chunkContent = lines.slice(startLine, endLine).join('\n');
    
    if (chunkContent.trim()) {
      chunks.push({
        id: uuidv4(),
        content: chunkContent,
        filePath,
        startLine: startLine + 1, // 1-based indexing for display
        endLine,
        sessionId,
      });
    }
  }
  return chunks;
}

export interface CodeChunk {
  id: string;
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  chunkType: 'function' | 'class' | 'import' | 'export' | 'comment' | 'general';
  language: string;
  sessionId: string;
  complexity?: number;
}

const CHUNK_TARGET_TOKENS = 250;
const CHUNK_OVERLAP_TOKENS = 50;

// Language-specific file extensions
const LANGUAGE_EXTENSIONS: { [key: string]: string[] } = {
  javascript: ['.js', '.jsx'],
  typescript: ['.ts', '.tsx'],
  python: ['.py'],
  java: ['.java'],
  rust: ['.rs'],
  go: ['.go'],
  cpp: ['.cpp', '.hpp', '.cc', '.cxx']
};

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  for (const [lang, extensions] of Object.entries(LANGUAGE_EXTENSIONS)) {
    if (extensions.includes(`.${ext}`)) return lang;
  }
  return 'unknown';
}

function estimateTokenCount(text: string): number {
  // Simple token estimation: roughly 4 characters per token
  return Math.ceil(text.length / 4);
}

function parseJavaScriptFile(content: string): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });

  traverse(ast, {
    enter(path: any) {
      let chunk: CodeChunk | null = null;

      // Identify different code structures
      if (t.isFunctionDeclaration(path.node) || t.isArrowFunctionExpression(path.node)) {
        const start = path.node.loc?.start.line || 0;
        const end = path.node.loc?.end.line || 0;
        const functionContent = content.split('\n').slice(start - 1, end).join('\n');

        chunk = {
          id: uuidv4(),
          content: functionContent,
          filePath: '', // Will be set later
          startLine: start,
          endLine: end,
          chunkType: 'function',
          language: 'javascript',
          sessionId: '', // Will be set later
          complexity: estimateTokenCount(functionContent)
        };
      }

      if (t.isClassDeclaration(path.node)) {
        const start = path.node.loc?.start.line || 0;
        const end = path.node.loc?.end.line || 0;
        const classContent = content.split('\n').slice(start - 1, end).join('\n');

        chunk = {
          id: uuidv4(),
          content: classContent,
          filePath: '', // Will be set later
          startLine: start,
          endLine: end,
          chunkType: 'class',
          language: 'javascript',
          sessionId: '', // Will be set later
          complexity: estimateTokenCount(classContent)
        };
      }

      if (chunk) chunks.push(chunk);
    }
  });

  // If no specific structures found, do basic chunking
  if (chunks.length === 0) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i += CHUNK_TARGET_TOKENS) {
      const chunkLines = lines.slice(i, i + CHUNK_TARGET_TOKENS);
      chunks.push({
        id: uuidv4(),
        content: chunkLines.join('\n'),
        filePath: '', // Will be set later
        startLine: i + 1,
        endLine: i + chunkLines.length,
        chunkType: 'general',
        language: 'javascript',
        sessionId: '', // Will be set later
        complexity: estimateTokenCount(chunkLines.join('\n'))
      });
    }
  }

  return chunks;
}

export function chunkCodeFile({ 
  content, 
  filePath, 
  sessionId 
}: { 
  content: string; 
  filePath: string; 
  sessionId: string 
}): CodeChunk[] {
  const language = detectLanguage(filePath);
  
  let chunks: CodeChunk[];
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      chunks = parseJavaScriptFile(content);
      break;
    default:
      // Fallback to basic chunking for unsupported languages
      const lines = content.split('\n');
      chunks = lines.reduce((acc, _, i) => {
        if (i % CHUNK_TARGET_TOKENS === 0) {
          const chunkLines = lines.slice(i, i + CHUNK_TARGET_TOKENS);
          acc.push({
            id: uuidv4(),
            content: chunkLines.join('\n'),
            filePath,
            startLine: i + 1,
            endLine: i + chunkLines.length,
            chunkType: 'general',
            language,
            sessionId,
            complexity: estimateTokenCount(chunkLines.join('\n'))
          });
        }
        return acc;
      }, [] as CodeChunk[]);
  }

  // Set common metadata
  chunks.forEach(chunk => {
    chunk.filePath = filePath;
    chunk.sessionId = sessionId;
    chunk.language = language;
  });

  return chunks;
} 