// lib/milvus.ts
import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import { EnhancedChunk, SearchResult } from './types';

const COLLECTION_NAME = 'code_chunks';

const COLLECTION_SCHEMA = {
  name: COLLECTION_NAME,
  fields: [
    // Vector field for semantic search (if needed later)
    {
      name: 'embedding',
      data_type: DataType.FloatVector,
      dim: 384 // or whatever dimension your embedding model uses
    },
    
    // Primary key
    {
      name: 'chunk_id',
      data_type: DataType.VarChar,
      max_length: 100,
      is_primary_key: true
    },
    
    // Session grouping
    {
      name: 'session_id',
      data_type: DataType.VarChar,
      max_length: 100
    },
    
    // File information
    {
      name: 'file_path',
      data_type: DataType.VarChar,
      max_length: 500
    },
    {
      name: 'file_name',
      data_type: DataType.VarChar,
      max_length: 200
    },
    { // Added to schema, crucial for sorting and understanding code
      name: 'file_extension',
      data_type: DataType.VarChar,
      max_length: 20
    },
    
    // Content (stored as JSON string for complex data)
    {
      name: 'content_data',
      data_type: DataType.VarChar,
      max_length: 65535 // max for text content
    },
    
    // Metadata for intelligent querying
    {
      name: 'chunk_type',
      data_type: DataType.VarChar,
      max_length: 50
    },
    {
      name: 'importance_level',
      data_type: DataType.VarChar,
      max_length: 20
    },
    {
      name: 'line_start',
      data_type: DataType.Int64
    },
    {
      name: 'line_end',
      data_type: DataType.Int64
    }
  ]
};

const getMilvusClient = async () => {
  const config: any = {
    address: process.env.MILVUS_HOST || 'localhost',
    port: process.env.MILVUS_PORT ? parseInt(process.env.MILVUS_PORT) : 19530,
    ssl: true, // Always true for Zilliz Cloud
  };

  // Add token if available
  if (process.env.MILVUS_TOKEN) {
    config.token = process.env.MILVUS_TOKEN;
  }

  const client = new MilvusClient(config);

  // Ensure collection exists
  try {
    console.log(`Checking if collection '${COLLECTION_NAME}' exists...`);
    const hasCollection = await client.hasCollection({ collection_name: COLLECTION_NAME });
    console.log(`Collection '${COLLECTION_NAME}' exists: ${hasCollection.value}`);
    
    if (!hasCollection.value) {
      console.log(`Collection '${COLLECTION_NAME}' not found, creating it...`);
      // Create collection with explicit fields from the new schema
      await client.createCollection({
        collection_name: COLLECTION_SCHEMA.name,
        fields: COLLECTION_SCHEMA.fields,
        enable_dynamic_field: true // Keep dynamic fields enabled for flexibility
      });
    }
    // Ensure collection is loaded (important for searches/queries)
    const loadState = await client.getLoadState({ collection_name: COLLECTION_NAME });
    if (loadState.state !== 'LoadStateLoaded') {
      console.log(`Loading collection '${COLLECTION_NAME}'...`);
      await client.loadCollection({ collection_name: COLLECTION_NAME });
      console.log(`Collection '${COLLECTION_NAME}' loaded.`);
    }
  } catch (error) {
    console.error('Error creating/checking/loading collection:', error);
    throw error;
  }

  return client;
};

async function storeEnhancedChunk(chunk: EnhancedChunk): Promise<boolean> {
  try {
    const client = await getMilvusClient();
    
    // Prepare the data for storage
    const vectorData = {
      chunk_id: chunk.chunkId,
      session_id: chunk.sessionId,
      file_path: chunk.filePath,
      file_name: chunk.fileName,
      file_extension: chunk.fileExtension,
      
      // Store complex data as JSON strings
      content_data: JSON.stringify({
        originalContent: chunk.originalContent,
        processedContent: chunk.processedContent,
        dependencies: chunk.dependencies,
        exports: chunk.exports,
        codePatterns: chunk.codePatterns,
        explanation: chunk.explanation || '',
        purpose: chunk.purpose || ''
      }),
      
      chunk_type: chunk.chunkType,
      importance_level: chunk.importance,
      line_start: chunk.startLine,
      line_end: chunk.endLine,
      
      // Generate a dummy embedding for now (we'll improve this later)
      embedding: new Array(384).fill(0).map(() => Math.random()) // Dummy embedding
    };
    
    // Insert into Zilliz
    const insertResult = await client.insert({
      collection_name: COLLECTION_NAME,
      data: [vectorData]
    });
    
    console.log(`Stored chunk ${chunk.chunkId} successfully`);
    return insertResult.status.error_code === 'Success';
    
  } catch (error) {
    console.error('Error storing chunk:', error);
    return false;
  }
}

function sortChunks(chunks: EnhancedChunk[], sortBy: 'importance' | 'file_path' | 'chunk_type'): EnhancedChunk[] {
  switch (sortBy) {
    case 'importance':
      // Define an order for importance levels
      const importanceOrder = { 'critical': 3, 'important': 2, 'supporting': 1 };
      return [...chunks].sort((a, b) => {
        const aImportance = importanceOrder[a.importance as keyof typeof importanceOrder] || 0;
        const bImportance = importanceOrder[b.importance as keyof typeof importanceOrder] || 0;
        if (aImportance !== bImportance) {
          return bImportance - aImportance; // Descending by importance
        }
        return a.filePath.localeCompare(b.filePath); // Secondary sort by file path
      });
    case 'file_path':
      return [...chunks].sort((a, b) => a.filePath.localeCompare(b.filePath));
    case 'chunk_type':
      return [...chunks].sort((a, b) => a.chunkType.localeCompare(b.chunkType));
    default:
      return chunks;
  }
}

async function querySessionChunksWithMetadata(
  sessionId: string,
  sortBy: 'importance' | 'file_path' | 'chunk_type' = 'importance'
): Promise<EnhancedChunk[]> {
  try {
    const client = await getMilvusClient();
    
    // Query with filtering and sorting
    const queryResult = await client.query({
      collection_name: COLLECTION_NAME,
      filter: `session_id == "${sessionId}"`,
      output_fields: [
        'chunk_id', 'session_id', 'file_path', 'file_name',
        'file_extension', 'content_data', 'chunk_type',
        'importance_level', 'line_start', 'line_end'
      ],
      limit: 1000 // adjust based on your needs
    });
    
    if (!queryResult.data || queryResult.data.length === 0) {
      return [];
    }
    
    // Convert back to EnhancedChunk objects
    const chunks: EnhancedChunk[] = queryResult.data.map((row: any) => {
      const contentData = JSON.parse(row.content_data);
      
      return {
        chunkId: row.chunk_id,
        sessionId: row.session_id,
        filePath: row.file_path,
        fileName: row.file_name,
        fileExtension: row.file_extension,
        originalContent: contentData.originalContent,
        processedContent: contentData.processedContent,
        startLine: row.line_start,
        endLine: row.line_end,
        chunkType: row.chunk_type,
        importance: row.importance_level,
        dependencies: contentData.dependencies || [],
        exports: contentData.exports || [],
        codePatterns: contentData.codePatterns || [],
        explanation: contentData.explanation || '',
        purpose: contentData.purpose || '',
        complexity: contentData.complexity || 'moderate' // Default or infer if not stored
      } as EnhancedChunk; // Type assertion
    });
    
    // Sort based on the requested criteria
    return sortChunks(chunks, sortBy);
    
  } catch (error) {
    console.error('Error querying session chunks:', error);
    throw error;
  }
}

async function searchVectors(
  queryEmbedding: number[],
  sessionId: string,
  limit: number = 5
): Promise<SearchResult[]> {
  const client = await getMilvusClient();
  try {
    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vectors: [queryEmbedding],
      limit: limit,
      filter: `session_id == "${sessionId}"`,
      // Request all fields necessary to construct a SearchResult
      output_fields: [
        'chunk_id', 'file_path', 'file_name', 'content_data',
        'chunk_type', 'importance_level', 'line_start', 'line_end',
        'explanation', 'purpose', 'complexity' // Include AI-generated insights
      ],
    });

    const results: SearchResult[] = [];
    if (searchResult.results && searchResult.results[0]) {
      searchResult.results[0].forEach((hit: any) => {
        const contentData = JSON.parse(hit.content_data);
        results.push({
          fileName: hit.file_name,
          codeSnippet: contentData.originalContent,
          // Summary can be derived from explanation or a simple similarity score for now
          summary: contentData.explanation || `Similarity: ${hit.score.toFixed(4)}`,
          similarity: hit.score,
          // Optional fields from EnhancedChunk that might be useful for search results
          // Mapping them if they exist in the Milvus hit or parsed contentData
          functionName: contentData.exports[0] || undefined, // Example: taking the first export as functionName
          linesOfCode: hit.line_end - hit.line_start + 1,
          language: hit.file_extension, // Using fileExtension as language
          tags: contentData.codePatterns || [],
        });
      });
    }
    return results;
  } catch (error) {
    console.error(`Error searching data for session ${sessionId}:`, error);
    throw new Error(`Failed to search session data: ${error}`);
  }
}

export { getMilvusClient, COLLECTION_NAME, storeEnhancedChunk, querySessionChunksWithMetadata, searchVectors }; 