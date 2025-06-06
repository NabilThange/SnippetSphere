import { NextRequest, NextResponse } from 'next/server';
import NovitaClient from '../../../lib/novita-client';
import { getMilvusClient, COLLECTION_NAME, searchBySessionId } from '../../../lib/milvus';

const novitaClient = new NovitaClient(process.env.NOVITA_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { query, sessionId, limit = 5 } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid or missing search query.', results: [] }, { status: 400 });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid or missing sessionId.', results: [] }, { status: 400 });
    }

    let queryEmbedding: number[];
    try {
      const embeddingResponse = await novitaClient.generateEmbeddings(query);
      if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
        throw new Error('No embedding data returned for the query.');
      }
      queryEmbedding = embeddingResponse.data[0].embedding;
    } catch (error) {
      console.error('Error generating query embedding:', error);
      return NextResponse.json({ success: false, message: 'Failed to generate embedding for the query.', results: [] }, { status: 500 });
    }

    const zillizSearchResults = await searchBySessionId(queryEmbedding, sessionId, limit);

    if (zillizSearchResults.length === 0) {
      return NextResponse.json({ success: true, message: 'No matching results found for this query in Zilliz.', results: [] }, { status: 200 });
    }

    const formattedResults = zillizSearchResults.map(hit => ({
      filePath: hit.file_path,
      content: hit.content,
      similarity: hit.similarity,
    }));

    return NextResponse.json({ success: true, message: 'Search completed successfully from Zilliz.', results: formattedResults }, { status: 200 });
  } catch (error: any) {
    console.error('API error in search route:', error);
    if (error.message.includes('not available during build')) {
      return NextResponse.json({
        success: false,
        message: 'Vector database not available during build.',
        results: []
      }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An unexpected error occurred during search.', results: [] }, { status: 500 });
  }
} 