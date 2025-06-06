import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import NovitaClient from '../../../lib/novita-client';
import { getMilvusClient, COLLECTION_NAME } from '../../../lib/milvus';

const novitaClient = new NovitaClient(process.env.NOVITA_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { sessionId, filePaths } = await req.json();

    if (!sessionId || !filePaths || !Array.isArray(filePaths)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const codeChunksToEmbed: Array<{ content: string; filePath: string; sessionId: string }> = [];

    for (const filePath of filePaths) {
      const fullPath = filePath;
      let fileContent;
      try {
        fileContent = fs.readFileSync(fullPath, 'utf-8');
      } catch (readError) {
        console.warn(`Could not read file ${fullPath}:`, readError);
        continue;
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

    const milvusClient = await getMilvusClient();

    const embeddingsToInsert: Array<{ 
      id?: number; 
      content: string; 
      file_path: string; 
      embedding: number[]; 
      sessionId: string 
    }> = [];
    let processedChunksCount = 0;

    for (const chunk of codeChunksToEmbed) {
      try {
        const embeddingResponse = await novitaClient.generateEmbeddings(chunk.content);
        if (embeddingResponse.data && embeddingResponse.data.length > 0) {
          embeddingsToInsert.push({
            content: chunk.content,
            file_path: chunk.filePath,
            embedding: embeddingResponse.data[0].embedding,
            sessionId: chunk.sessionId,
          });
          processedChunksCount++;
        }
      } catch (embeddingError) {
        console.error(`Failed to generate embedding for a chunk in ${chunk.filePath}:`, embeddingError);
      }
    }

    if (embeddingsToInsert.length > 0) {
      await milvusClient.insert({
        collection_name: COLLECTION_NAME,
        data: embeddingsToInsert
      });
    }

    return NextResponse.json({ 
      message: 'Code indexed and embeddings generated successfully in Zilliz', 
      chunksProcessed: processedChunksCount 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Milvus connection error:', error);
    
    return NextResponse.json({ 
      error: 'Database error: ' + error.message 
    }, { status: 500 });
  }
} 