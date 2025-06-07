import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getZillizClient } from '@/lib/zilliz-client';
import { getNovitaClient } from '@/lib/novita-client';
import { chunkCodeFile, CodeChunk } from '@/lib/code-chunker';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import NovitaClient from 'novita-sdk';

// Define the structure of the data we expect from the frontend
const indexRequestSchema = z.object({
  sessionId: z.string().uuid(),
  // We'll pass the file content as a base64 string from the upload route
  fileContentBase64: z.string(), 
});

// Define which file extensions we care about
const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.tsx', '.py', '.java', '.md', '.go', '.rs', '.html', '.css'];
const BATCH_SIZE = 50; // How many chunks to embed and insert at once

export async function POST(req: NextRequest) {
  console.log('[API][index] Received request to index codebase.');

  try {
    // 1. --- VALIDATE INPUT ---
    const body = await req.json();
    const parsedBody = indexRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error('[API][index] Invalid request body:', parsedBody.error.errors);
      return NextResponse.json({ error: 'Invalid request body', details: parsedBody.error.errors }, { status: 400 });
    }
    const { sessionId, fileContentBase64 } = parsedBody.data;
    console.log(`[API][index] Processing session ID: ${sessionId}`);
    
    // 2. --- INITIALIZE SERVICES ---
    const zillizClient = getZillizClient();
    const novitaClient = getNovitaClient();
    const collectionName = `codebase_${sessionId.replace(/-/g, '_')}`; // Sanitize for Zilliz

    // 3. --- EXTRACT & FILTER FILES ---
    console.log('[API][index] Decompressing ZIP file...');
    const fileBuffer = Buffer.from(fileContentBase64, 'base64');
    const zip = new AdmZip(fileBuffer);
    const zipEntries = zip.getEntries();

    const codeFiles = zipEntries
      .filter((entry: AdmZip.IZipEntry) => !entry.isDirectory && SUPPORTED_EXTENSIONS.some(ext => entry.entryName.endsWith(ext)))
      .map((entry: AdmZip.IZipEntry) => ({
        path: entry.entryName,
        content: entry.getData().toString('utf-8'),
      }));

    if (codeFiles.length === 0) {
      console.warn('[API][index] No supported code files found in the ZIP.');
      return NextResponse.json({ error: 'No supported code files found in the ZIP.' }, { status: 400 });
    }
    console.log(`[API][index] Found ${codeFiles.length} supported files to process.`);

    // 4. --- CHUNK ALL FILES ---
    console.log('[API][index] Chunking all files...');
    const allChunks = codeFiles.flatMap((file: { path: string, content: string }) => 
      chunkCodeFile({ content: file.content, filePath: file.path, sessionId })
    );
    console.log(`[API][index] Generated ${allChunks.length} total chunks.`);

    if (allChunks.length === 0) {
        console.warn('[API][index] No chunks were generated from the files.');
        return NextResponse.json({ message: 'Code processed, but no content was large enough to be indexed.' }, { status: 200 });
    }

    // 5. --- CREATE ZILLIZ COLLECTION ---
    // Ensure the collection exists before we try to insert data
    try {
        await zillizClient.createCollection({
            collection_name: collectionName,
            dimension: 1024, // For baai/bge-m3 model
            metric_type: "COSINE",
            description: `Code snippets for session ${sessionId}`
        });
        console.log(`[API][index] Created new Zilliz collection: ${collectionName}`);
    } catch (e: any) {
        // It's normal for this to fail if the collection already exists.
        // A production system would check first, but for this MVP, we'll just log it.
        if (e.message.includes('already exists')) {
            console.log(`[API][index] Zilliz collection '${collectionName}' already exists. Proceeding.`);
        } else {
            console.error('[API][index] Critical error creating Zilliz collection:', e);
            throw new Error(`Failed to create Zilliz collection: ${e.message}`);
        }
    }


    // 6. --- PROCESS IN BATCHES (EMBED & INSERT) ---
    console.log(`[API][index] Starting batch processing of ${allChunks.length} chunks...`);
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      console.log(`[API][index] Processing batch ${i / BATCH_SIZE + 1}...`);

      // 6a. Generate Embeddings for the batch
      const batchContent = batch.map(chunk => chunk.content);
      const embeddings = await (novitaClient as any).embeddings({
        model: 'baai/bge-m3',
        input: batchContent,
      });

      if (!embeddings || embeddings.data.length !== batch.length) {
        throw new Error('Embedding generation failed or returned mismatched count.');
      }
      
      const vectors = embeddings.data.map((emb: any) => emb.embedding);

      // 6b. Prepare data for Zilliz
      const dataToInsert = batch.map((chunk: CodeChunk, index: number) => ({
        id: chunk.id,
        vector: vectors[index],
        content: chunk.content,
        file_path: chunk.filePath,
        start_line: chunk.startLine,
        end_line: chunk.endLine,
        chunk_type: chunk.chunkType,
        language: chunk.language,
        complexity: chunk.complexity
      }));

      // 6c. Insert the batch into Zilliz
      await zillizClient.insert({
        collection_name: collectionName,
        data: dataToInsert,
      });
      console.log(`[API][index] Successfully inserted batch ${i / BATCH_SIZE + 1} into Zilliz.`);
    }

    // 7. --- FLUSH AND FINALIZE ---
    // Ensure all data is written to disk in Zilliz
    await zillizClient.flush({ collection_names: [collectionName] });
    console.log(`[API][index] Flushed collection ${collectionName}. Indexing complete.`);
    
    return NextResponse.json({ 
      message: 'Codebase indexed successfully.',
      sessionId,
      collectionName,
      fileCount: codeFiles.length,
      chunkCount: allChunks.length,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API][index] A critical error occurred during the indexing process:', error);
    return NextResponse.json({ error: 'Failed to index codebase.', details: error.message }, { status: 500 });
  }
}