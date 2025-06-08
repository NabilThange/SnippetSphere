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
  private cache = new Map<string, SummarizeResponse>();

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
      console.log("Raw embedding response from Novita AI:", response.data);
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

  async teachCodeCreation(code: string, fileName: string, stepNumber: number, model: string = 'deepseek/deepseek-v3-0324', retries = 3): Promise<SummarizeResponse> {
    const cacheKey = `${fileName}-${code.slice(0, 100)}-${stepNumber}`;

    if (this.cache.has(cacheKey)) {
      console.log(`Cache hit for ${fileName} (Step ${stepNumber})`);
      return this.cache.get(cacheKey)!;
    }

    const teachingPrompt = `
You are a coding teacher explaining to a complete beginner. 
Given this code from file "${fileName}", explain step-by-step how a beginner would CREATE this from scratch.

Rules:
- Start with "STEP ${stepNumber}: [Action]"
- Use simple, child-friendly language
- Explain WHY each part is needed
- Break complex concepts into tiny steps
- Use analogies when helpful
- **Format your response using Markdown (e.g., # for headings, **bold**, *italics*, \`code blocks\`).**

Code to teach:
${code}

Respond as if teaching a 12-year-old how to build this.`;

    const messages = [
      { role: 'system', content: 'You are a patient coding teacher who explains things step-by-step to beginners and uses Markdown for clear formatting.' },
      { role: 'user', content: teachingPrompt }
    ];
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const chatResponse = await this.chatCompletion(messages, model);
        const result = { summary: chatResponse.choices[0]?.message?.content || '' };
        this.cache.set(cacheKey, result);
        console.log(`Cached result for ${fileName} (Step ${stepNumber})`);
        return result;
      } catch (error) {
        console.error(`Error teaching code creation for ${fileName} (Step ${stepNumber}), attempt ${attempt}:`, error);
        if (attempt === retries) {
          if (axios.isAxiosError(error)) {
            throw new Error(`Failed to teach code creation after ${retries} attempts: ${error.response?.data?.message || error.message}`);
          } else {
            throw new Error(`An unexpected error occurred after ${retries} attempts: ${error}`);
          }
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        console.log(`Retrying for ${fileName} (Step ${stepNumber})...`);
      }
    }
    // This part should technically not be reached if retries are handled correctly
    throw new Error("Failed to teach code creation after multiple attempts.");
  }
}

export default NovitaClient; 