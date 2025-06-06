import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import NovitaClient from '../../../lib/novita-client';
import { getMilvusClient } from '../../../lib/milvus';

const novitaClient = new NovitaClient(process.env.NOVITA_API_KEY || '');

const COLLECTION_NAME = 'code_embeddings'; // Define a consistent collection name

export async function POST(req: NextRequest) {
  try {
    const { sessionId, filePaths } = await req.json();

    if (!sessionId || !filePaths || !Array.isArray(filePaths)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const codeChunksToEmbed: Array<{ content: string; filePath: string; sessionId: string }> = [];

    for (const filePath of filePaths) {
      const fullPath = path.join(os.tmpdir(), filePath); // Assuming files are in temp directory
      let fileContent;
      try {
        fileContent = fs.readFileSync(fullPath, 'utf-8');
      } catch (readError) {
        console.warn(`Could not read file ${fullPath}:`, readError);
        continue; // Skip to the next file if read fails
      }

      // Simple chunking logic
      const chunkSize = 1000;
      for (let i = 0; i < fileContent.length; i += chunkSize) {
        const chunkContent = fileContent.substring(i, i + chunkSize);
        codeChunksToEmbed.push({
          content: chunkContent,
          filePath: filePath,
          sessionId: sessionId,
        });
      }
    }

    const zillizClient = await getMilvusClient();
    // Create collection if it doesn't exist. Assuming embedding dimension 1536 for 'text-embedding-ada-002'.
    // You might need to adjust this dimension based on the actual model used.
    const EMBEDDING_DIMENSION = 1536; 
    await zillizClient.createCollection(COLLECTION_NAME, EMBEDDING_DIMENSION);

    const embeddingsToInsert: Array<{ content: string; filePath: string; sessionId: string; embedding: number[] }> = [];
    let processedChunksCount = 0;

    for (const chunk of codeChunksToEmbed) {
      try {
        const embeddingResponse = await novitaClient.generateEmbeddings(chunk.content);
        if (embeddingResponse.data && embeddingResponse.data.length > 0) {
          embeddingsToInsert.push({
            ...chunk,
            embedding: embeddingResponse.data[0].embedding,
          });
          processedChunksCount++;
        }
      } catch (embeddingError) {
        console.error(`Failed to generate embedding for a chunk in ${chunk.filePath}:`, embeddingError);
        // Continue processing other chunks even if one fails
      }
    }

    if (embeddingsToInsert.length > 0) {
      await zillizClient.insertVectors(embeddingsToInsert);
    }

    return NextResponse.json({ message: 'Code indexed and embeddings generated successfully in Zilliz', chunksProcessed: processedChunksCount }, { status: 200 });
  } catch (error: any) {
    console.error('API error:', error);
    if (error.message.includes('not available during build')) {
      return NextResponse.json({
        error: 'Vector database not available during build.'
      }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to process files for indexing' }, { status: 500 });
  }
} 