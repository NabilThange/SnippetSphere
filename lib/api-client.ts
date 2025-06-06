import { NextRequest, NextResponse } from 'next/server';

export interface UploadResponse {
  message: string;
  files: string[];
}

export interface IndexResponse {
  message: string;
  chunksProcessed: number;
}

export interface SearchResultItem {
  filePath: string;
  content: string;
  similarity: number;
  startLine?: number; // Optional, as it's not directly returned by Zilliz in my current schema
}

export interface SearchResponse {
  success: boolean;
  message: string;
  results: SearchResultItem[];
}

export interface SummarizeResponse {
  success: boolean;
  message: string;
  summary: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  response: string;
}

export interface BuildStep {
  stepNumber: number;
  filePath: string;
  content: string;
  explanation: string;
}

export interface BuildGuideResponse {
  success: boolean;
  message: string;
  steps: BuildStep[];
}

export interface VisualizeNode {
  id: string;
  label: string;
}

export interface VisualizeEdge {
  from: string;
  to: string;
  label?: string;
}

export interface VisualizeResponse {
  success: boolean;
  message: string;
  graph: {
    nodes: VisualizeNode[];
    edges: VisualizeEdge[];
  };
}

interface ApiClientOptions {
  baseUrl?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(options?: ApiClientOptions) {
    this.baseUrl = options?.baseUrl || '/api';
  }

  private async request<T>(endpoint: string, method: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error(`API Client Error (${method} ${url}):`, error);
      throw error;
    }
  }

  async uploadFiles(formData: FormData): Promise<UploadResponse> {
    // For multipart/form-data, fetch handles Content-Type and boundary automatically
    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `File upload failed with status ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error('API Client Error (uploadFiles):', error);
      throw error;
    }
  }

  async indexCode(sessionId: string, filePaths: string[]): Promise<IndexResponse> {
    return this.request<IndexResponse>('/index', 'POST', { sessionId, filePaths });
  }

  async searchCode(query: string, sessionId: string, limit?: number): Promise<SearchResponse> {
    return this.request<SearchResponse>('/search', 'POST', { query, sessionId, limit });
  }

  async summarizeText(sessionId: string, filePath: string): Promise<SummarizeResponse> {
    return this.request<SummarizeResponse>('/summarize', 'POST', { sessionId, filePath });
  }

  async chatWithCode(message: string, sessionId: string, limit?: number): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', 'POST', { message, sessionId, limit });
  }

  async getBuildGuide(sessionId: string): Promise<BuildGuideResponse> {
    return this.request<BuildGuideResponse>('/build-guide', 'POST', { sessionId });
  }

  async getVisualizationData(sessionId: string): Promise<VisualizeResponse> {
    return this.request<VisualizeResponse>('/visualize', 'POST', { sessionId });
  }
}

export const apiClient = new ApiClient(); 