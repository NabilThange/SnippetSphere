import { NextRequest, NextResponse } from 'next/server';
import NovitaClient from '../../../lib/novita-client';
import { getMilvusClient, COLLECTION_NAME, queryBySessionId } from '../../../lib/milvus';

const novitaClient = new NovitaClient(process.env.NOVITA_API_KEY || '');

// Type definitions for better type safety
interface BuildStep {
  stepNumber: number;
  filePath: string;
  content: string;
  explanation: string;
  fileName?: string;
  fileExtension?: string;
  chunkType?: string;
  startLine?: number;
  endLine?: number;
}

interface SessionChunk {
  content: string;
  file_path: string;
  sessionId: string;
  startLine?: number;
  endLine?: number;
  chunkType?: string;
  [key: string]: any; // Allow for additional properties
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or missing sessionId.', 
        steps: [] 
      }, { status: 400 });
    }

    console.log(`Querying build guide for sessionId: ${sessionId}`);

    // Query session chunks from Milvus
    let sessionChunks: SessionChunk[];
    try {
      sessionChunks = await queryBySessionId(sessionId);
    } catch (queryError) {
      console.error('Error querying session chunks:', queryError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to retrieve session data from database.', 
        steps: [] 
      }, { status: 500 });
    }

    // Check if any chunks were found
    if (!sessionChunks || sessionChunks.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No code indexed for this session ID in Zilliz. Please upload and index code first.', 
        steps: [] 
      }, { status: 404 });
    }

    console.log(`Found ${sessionChunks.length} chunks for session ${sessionId}`);

    const buildSteps: BuildStep[] = [];
    let stepNumber = 1;

    // Process each chunk and generate build steps
    for (const chunk of sessionChunks) {
      try {
        // Ensure chunk has required properties with fallbacks
        const filePath = chunk.file_path || chunk.filePath || 'Unknown file';
        const content = chunk.content || '';
        
        // Skip empty chunks
        if (!content || content.trim() === '') {
          console.warn(`Skipping empty chunk for file: ${filePath}`);
          continue;
        }

        // Extract file information
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown';
        const fileExtension = fileName.includes('.') ? fileName.split('.').pop() || '' : '';

        let explanation = 'No explanation generated.';
        
        // Generate explanation/summary
        try {
          // Check if novitaClient has summarizeText method
          if (novitaClient.summarizeText && typeof novitaClient.summarizeText === 'function') {
            const summarizeResponse = await novitaClient.summarizeText(content);
            explanation = summarizeResponse?.summary || 'Failed to generate summary.';
          } else {
            // Fallback: Create a simple explanation based on content
            explanation = generateSimpleExplanation(content, fileName, fileExtension);
          }
        } catch (summarizeError) {
          console.error(`Error summarizing content for ${filePath}:`, summarizeError);
          explanation = generateSimpleExplanation(content, fileName, fileExtension);
        }

        // Ensure explanation is not empty
        if (!explanation || explanation.trim() === '') {
          explanation = `Code chunk from ${fileName}`;
        }

        buildSteps.push({
          stepNumber,
          filePath: filePath,
          content: content,
          explanation: explanation,
          fileName: fileName,
          fileExtension: fileExtension,
          chunkType: chunk.chunkType || 'code',
          startLine: chunk.startLine,
          endLine: chunk.endLine
        });

        stepNumber++;
      } catch (chunkError) {
        console.error('Error processing chunk:', chunkError);
        // Continue with next chunk instead of failing entire request
        continue;
      }
    }

    // Check if any valid steps were generated
    if (buildSteps.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No valid build steps could be generated from the indexed code.', 
        steps: [] 
      }, { status: 400 });
    }

    console.log(`Generated ${buildSteps.length} build steps`);

    return NextResponse.json({ 
      success: true, 
      message: 'Build guide generated successfully from Zilliz data.', 
      steps: buildSteps,
      totalSteps: buildSteps.length,
      sessionId: sessionId
    }, { status: 200 });

  } catch (error: any) {
    console.error('API error in build-guide route:', error);
    
    // Handle specific error types
    if (error.message?.includes('not available during build')) {
      return NextResponse.json({
        success: false,
        message: 'Vector database not available during build.',
        steps: []
      }, { status: 503 });
    }

    if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed. Please try again later.',
        steps: []
      }, { status: 503 });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'An unexpected error occurred during build guide generation.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      steps: [] 
    }, { status: 500 });
  }
}

// Fallback function to generate simple explanations
function generateSimpleExplanation(content: string, fileName: string, fileExtension: string): string {
  if (!content || content.trim() === '') {
    return `Empty file: ${fileName}`;
  }

  const lines = content.split('\n').filter(line => line.trim() !== '');
  const lineCount = lines.length;
  
  // Try to identify the type of code based on content
  let codeType = 'code';
  if (content.includes('function ') || content.includes('const ') || content.includes('let ')) {
    codeType = 'JavaScript/TypeScript functions and variables';
  } else if (content.includes('class ') && content.includes('def ')) {
    codeType = 'Python class definitions';
  } else if (content.includes('import ') || content.includes('from ')) {
    codeType = 'import statements';
  } else if (content.includes('export ')) {
    codeType = 'export definitions';
  }

  return `File: ${fileName} (${fileExtension.toUpperCase()}) - Contains ${lineCount} lines of ${codeType}`;
}