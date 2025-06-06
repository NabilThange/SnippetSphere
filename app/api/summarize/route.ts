import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import NovitaClient from '../../../lib/novita-client';

const novitaClient = new NovitaClient(process.env.NOVITA_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { sessionId, filePath } = await req.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid or missing sessionId.', summary: '' }, { status: 400 });
    }

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid or missing filePath.', summary: '' }, { status: 400 });
    }

    const fullPath = filePath;
    let fileContent: string;

    try {
      fileContent = fs.readFileSync(fullPath, 'utf-8');
    } catch (readError) {
      console.error(`Could not read file ${fullPath}:`, readError);
      return NextResponse.json({ success: false, message: 'File not found or unreadable.', summary: '' }, { status: 404 });
    }

    if (fileContent.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'File content is empty, cannot summarize.', summary: '' }, { status: 400 });
    }

    let summary: string;
    try {
      const summarizeResponse = await novitaClient.summarizeText(fileContent);
      summary = summarizeResponse.summary;
    } catch (summarizeError) {
      console.error('Error during text summarization:', summarizeError);
      return NextResponse.json({ success: false, message: 'Failed to generate summary.', summary: '' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Text summarized successfully.', summary: summary }, { status: 200 });
  } catch (error) {
    console.error('API error in summarize route:', error);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred during summarization.', summary: '' }, { status: 500 });
  }
} 