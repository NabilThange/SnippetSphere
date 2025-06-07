import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  console.log('=== UPLOAD API CALLED ===');
  console.log('Content-Type:', request.headers.get('content-type'));
  console.log('Method:', request.method);

  try {
    const contentType = request.headers.get('content-type') || '';
    console.log('Request content type:', contentType);

    if (!contentType.includes('multipart/form-data')) {
      console.log('ERROR: Not multipart/form-data');
      return NextResponse.json({
        error: 'Content-Type must be multipart/form-data',
        received: contentType
      }, { status: 400 });
    }

    const formData = await request.formData();
    console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) => [key, typeof value]));

    const file = formData.get('file') as File;
    console.log('File received:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      exists: !!file
    });

    if (!file) {
      console.log('ERROR: No file in FormData');
      return NextResponse.json({
        error: 'No file uploaded',
        formDataKeys: Array.from(formData.keys())
      }, { status: 400 });
    }

    if (file.size === 0) {
      console.log('ERROR: Empty file');
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const sessionId = uuidv4();
    const tempDir = path.join(os.tmpdir(), `uploads-${sessionId}`);
    await fs.mkdir(tempDir, { recursive: true });

    const uploadedFilePaths: string[] = [];

    if (file.type === 'application/zip') {
      const zip = await JSZip.loadAsync(buffer);
      for (const filename in zip.files) {
        const zipEntry = zip.files[filename];
        if (!zipEntry.dir) {
          const content = await zipEntry.async('nodebuffer');
          const filePath = path.join(tempDir, filename);
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, content);
          uploadedFilePaths.push(filePath);
        }
      }
    } else {
      const filePath = path.join(tempDir, file.name);
      await fs.writeFile(filePath, buffer);
      uploadedFilePaths.push(filePath);
    }

    console.log('File upload successful');
    return NextResponse.json({
      message: 'Files uploaded and processed successfully',
      filename: file.name,
      size: file.size,
      files: uploadedFilePaths,
      sessionId: sessionId,
    }, { status: 200 });

  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 