import { NextRequest, NextResponse } from 'next/server';
import NovitaClient from '../../../lib/novita-client';
import { getMilvusClient, COLLECTION_NAME, queryBySessionId } from '../../../lib/milvus';

const novitaClient = new NovitaClient(process.env.NOVITA_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid or missing sessionId.', steps: [] }, { status: 400 });
    }

    const sessionChunks = await queryBySessionId(sessionId);

    if (!sessionChunks || sessionChunks.length === 0) {
      return NextResponse.json({ success: false, message: 'No code indexed for this session ID in Zilliz. Please upload and index code first.', steps: [] }, { status: 404 });
    }

    const buildSteps: Array<{ stepNumber: number; filePath: string; content: string; explanation: string }> = [];
    let stepNumber = 1;

    // For a real build guide, this would involve AST parsing and dependency analysis.
    // Here, we are providing a simplified simulation by summarizing each file/chunk.
    for (const chunk of sessionChunks) {
      let explanation = 'No explanation generated.';
      try {
        const summarizeResponse = await novitaClient.summarizeText(chunk.content);
        explanation = summarizeResponse.summary;
      } catch (summarizeError) {
        console.error(`Error summarizing content for ${chunk.filePath}:`, summarizeError);
        explanation = 'Failed to generate explanation for this step.';
      }

      buildSteps.push({
        stepNumber,
        filePath: chunk.filePath,
        content: chunk.content,
        explanation,
      });
      stepNumber++;
    }

    return NextResponse.json({ success: true, message: 'Build guide generated successfully from Zilliz data.', steps: buildSteps }, { status: 200 });
  } catch (error: any) {
    console.error('API error in build-guide route:', error);
    if (error.message.includes('not available during build')) {
      return NextResponse.json({
        success: false,
        message: 'Vector database not available during build.',
        steps: []
      }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: 'An unexpected error occurred during build guide generation.', steps: [] }, { status: 500 });
  }
} 