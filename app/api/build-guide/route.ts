import { NextRequest, NextResponse } from 'next/server';
import { querySessionChunksWithMetadata } from '@/lib/milvus';
import { NovitaConversationSystem } from '@/lib/novita-ai';
import { EnhancedChunk, ProjectAnalysis, BuildStep } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ success: false, message: 'Missing sessionId query parameter.' }, { status: 400 });
  }

  try {
    console.log(`Received sessionId: ${sessionId}`);
    // 5.1 Fetch All Relevant Chunks
    const chunks: EnhancedChunk[] = await querySessionChunksWithMetadata(sessionId, 'importance');
    console.log(`Found ${chunks.length} chunks for session ${sessionId}`);
    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No chunks found for this session. Please ensure your code was uploaded and indexed correctly."
      }, { status: 404 });
    }

    const novitaConversations = new NovitaConversationSystem();

    // 5.2 Generate the Project Overview
    const projectOverview = await novitaConversations.analyzeProjectOverview(chunks);

    // 5.3 Generate Build Steps
    // For simplicity, let's sort by importance and then by file path for now.
    // A more advanced dependency-based sorting would be part of a richer ProjectAnalysis.
    const sortedChunksForBuildGuide = [...chunks].sort((a, b) => {
      const importanceOrder = { 'critical': 3, 'important': 2, 'supporting': 1 };
      const aImportance = importanceOrder[a.importance] || 0;
      const bImportance = importanceOrder[b.importance] || 0;
      if (aImportance !== bImportance) {
        return bImportance - aImportance; // Descending by importance
      }
      return a.filePath.localeCompare(b.filePath); // Secondary sort by file path
    });

    const buildSteps: BuildStep[] = await Promise.all(sortedChunksForBuildGuide.map(async (chunk, index) => {
      const explanation = await novitaConversations.explainBuildStep(chunk, projectOverview);
      return {
        id: chunk.chunkId,
        title: `Step ${index + 1}: ${chunk.fileName} (${chunk.chunkType})`,
        description: explanation,
        explanation: explanation, // Duplicated for now, can refine if schema changes
        status: "pending", // Default status
        // Provide a snippet of code (e.g., top 10 lines or a relevant portion)
        command: `CODE_SNIPPET_FOR_${chunk.fileName.toUpperCase().replace(/\./g, '_')}`, // Placeholder for a runnable command/snippet
        troubleshooting: [],
      };
    }));

    // 5.4 Generate Key Files Summary
    const keyFilesSummaries: { filePath: string; explanation: string; }[] = [];
    const criticalAndImportantChunks = chunks.filter(chunk => chunk.importance === 'critical' || chunk.importance === 'important');

    await Promise.all(criticalAndImportantChunks.map(async (chunk) => {
      // Determine a reason for importance, could be based on chunk.importance, or derived from its role
      const whyImportant = `This file is categorized as ${chunk.importance} due to its role as a ${chunk.chunkType}.`;
      const explanation = await novitaConversations.explainKeyFile(chunk, whyImportant);
      keyFilesSummaries.push({ filePath: chunk.filePath, explanation: explanation });
    }));

    // 5.5 Compile the Final Guide
    return NextResponse.json({
      success: true,
      projectOverview: projectOverview,
      buildSteps: buildSteps,
      keyFiles: keyFilesSummaries,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error generating build guide:", error);
    let errorMessage = error.message || 'Failed to generate build guide.';
    // Check if the error suggests an invalid JSON response from Novita AI
    if (error.message && (error.message.includes("Unexpected token '<'") || error.message.includes("invalid JSON"))) {
      errorMessage = "AI returned invalid JSON. Please check Novita AI API key and model.";
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}