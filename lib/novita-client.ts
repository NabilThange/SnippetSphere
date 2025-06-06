import axios, { AxiosInstance } from 'axios';

interface EmbeddingResponse {
  data: {
    embedding: number[];
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

interface ChatCompletionResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface SummarizeResponse {
  summary: string;
}

class NovitaClient {
  private apiKey: string;
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.novita.ai/v3/openai',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async generateEmbeddings(text: string | string[]): Promise<EmbeddingResponse> {
    try {
      const input = Array.isArray(text) ? text : [text];
      const response = await this.client.post<EmbeddingResponse>('/embeddings', {
        model: 'baai/bge-m3',
        input: input,
        encoding_format: "float",
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error generating embeddings:', error.response?.data || error.message);
        throw new Error(`Failed to generate embeddings: ${error.response?.data?.message || error.message}`);
      } else {
        console.error('Unexpected error:', error);
        throw new Error(`An unexpected error occurred: ${error}`);
      }
    }
  }

  async chatCompletion(messages: Array<{ role: string; content: string }>, model: string = 'deepseek/deepseek-v3-0324'): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.post<ChatCompletionResponse>('/chat/completions', {
        model: model,
        messages: messages,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error during chat completion:', error.response?.data || error.message);
        throw new Error(`Failed to get chat completion: ${error.response?.data?.message || error.message}`);
      } else {
        console.error('Unexpected error:', error);
        throw new Error(`An unexpected error occurred: ${error}`);
      }
    }
  }

  async summarizeText(text: string, model: string = 'deepseek/deepseek-v3-0324'): Promise<SummarizeResponse> {
    try {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant that summarizes text.' },
        { role: 'user', content: `Summarize the following text: ${text}` },
      ];
      const chatResponse = await this.chatCompletion(messages, model);
      return { summary: chatResponse.choices[0]?.message?.content || '' };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error summarizing text:', error.response?.data || error.message);
        throw new Error(`Failed to summarize text: ${error.response?.data?.message || error.message}`);
      } else {
        console.error('Unexpected error:', error);
        throw new Error(`An unexpected error occurred: ${error}`);
      }
    }
  }
}

export default NovitaClient; 