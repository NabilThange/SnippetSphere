import OpenAI from 'openai';
import { EnhancedChunk } from './types';

// Ensure NOVITA_API_KEY is set in your environment variables
const novitaApiKey = process.env.NOVITA_API_KEY;

if (!novitaApiKey) {
  throw new Error("NOVITA_API_KEY is not set in environment variables.");
}

// Keep getAIInsights for now, as it's used elsewhere, but new logic will be in NovitaConversationSystem
export async function getAIInsights(prompt: string): Promise<{
  explanation: string;
  purpose: string;
  complexity: 'simple' | 'moderate' | 'complex';
}> {
  try {
    const novitaAI = new OpenAI({
      apiKey: novitaApiKey,
      baseURL: "https://api.novita.ai/v3/openai", // Novita AI's OpenAI-compatible base URL
    });
    const chatCompletion = await novitaAI.chat.completions.create({
      model: "deepseek/deepseek-r1-turbo",
      messages: [
        { role: "system", content: "You are an AI assistant specialized in analyzing code. Provide a concise explanation, purpose, and complexity level for the given code snippet." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const responseContent = chatCompletion.choices[0].message.content;
    console.log("Raw AI insights response from Novita AI:", responseContent);
    if (!responseContent) {
      throw new Error("No content received from Novita AI.");
    }

    return JSON.parse(responseContent);

  } catch (error) {
    console.error("Error getting AI insights from Novita AI:", error);
    return {
      explanation: "Failed to generate explanation.",
      purpose: "Failed to determine purpose.",
      complexity: 'moderate',
    };
  }
}

export class NovitaConversationSystem {
  private client: OpenAI;
  
  constructor() {
    if (!novitaApiKey) {
      throw new Error("NOVITA_API_KEY is not set in environment variables.");
    }
    this.client = new OpenAI({
      apiKey: novitaApiKey,
      baseURL: "https://api.novita.ai/v3/openai",
    });
  }
  
  // Generate project overview insights
  async analyzeProjectOverview(chunks: EnhancedChunk[]): Promise<string> {
    const context = this.buildProjectContext(chunks);
    
    const prompt = `You are a senior software architect analyzing a codebase.\\n    \\nProject Information:\\n- Total files: ${chunks.length}\\n- File types: ${this.getUniqueFileTypes(chunks).join(', ')}\\n- Directory structure: ${this.getDirectoryStructure(chunks)}\\n\\nSample code from key files:\\n${this.getRepresentativeCodeSamples(chunks)}\\n\\nBased on this information, provide a comprehensive project overview that covers:\\n1. What type of application this appears to be\\n2. The main technologies and frameworks being used\\n3. The primary purpose and key features\\n4. The overall architecture pattern\\n\\nKeep your response focused and informative, suitable for a developer who needs to understand this project quickly.`;

    return await this.sendConversationRequest(prompt, 'project-analyst');
  }
  
  // Generate build step explanations
  async explainBuildStep(chunk: EnhancedChunk, projectContext: string): Promise<string> {
    const prompt = `You are a technical instructor explaining how to understand a codebase step by step.\\n\\nProject Context: ${projectContext}\\n\\nCurrent file: ${chunk.fileName} (${chunk.filePath})\\nFile type: ${chunk.chunkType}\\nImportance: ${chunk.importance}\\n\\nCode content:\\n\\\`\\\`\\\`${chunk.fileExtension}\\n${chunk.originalContent}\\\`\\\`\\\`\\n\\nExplain this code step in terms of:\\n1. What this file does in the context of the overall project\\n2. Why this step is important for understanding the system\\n3. What someone should focus on when studying this code\\n4. How it connects to other parts of the system\\n\\nKeep your explanation clear and educational, as if teaching a new team member.`;

    return await this.sendConversationRequest(prompt, 'instructor');
  }
  
  // Generate key file explanations
  async explainKeyFile(chunk: EnhancedChunk, whyImportant: string): Promise<string> {
    const prompt = `You are a senior code reviewer explaining why certain files are critical to a project.\\n\\nFile: ${chunk.fileName} (${chunk.filePath})\\nWhy it\'s considered key: ${whyImportant}\\n\\nCode content:\\n\\\`\\\`\\\`${chunk.fileExtension}\\n${chunk.originalContent}\\\`\\\`\\\`\\n\\nExplain why this file is important by covering:\\n1. Its role in the application architecture\\n2. What would break if this file had issues\\n3. Key concepts or patterns it demonstrates\\n4. What developers should understand about this file\\n\\nFocus on the strategic importance rather than line-by-line details.`;

    return await this.sendConversationRequest(prompt, 'code-reviewer');
  }

  // Helper functions for context building
  private buildProjectContext(chunks: EnhancedChunk[]): string {
    const fileTypes = this.getUniqueFileTypes(chunks);
    const techStack = this.detectTechStack(chunks);
    const structure = this.getDirectoryStructure(chunks);
    
    return `This is a ${techStack.join(' + ')} project with ${chunks.length} files including ${fileTypes.join(', ')} files. The structure suggests ${structure}.`;
  }

  private getUniqueFileTypes(chunks: EnhancedChunk[]): string[] {
    const fileTypes = new Set<string>();
    chunks.forEach(chunk => fileTypes.add(chunk.fileExtension));
    return Array.from(fileTypes);
  }

  private getDirectoryStructure(chunks: EnhancedChunk[]): string {
    // A simplified representation. For a real system, this might involve more complex tree traversal.
    const paths = new Set<string>();
    chunks.forEach(chunk => {
      const dir = chunk.filePath.substring(0, chunk.filePath.lastIndexOf('/'));
      if (dir) paths.add(dir);
    });
    const sortedPaths = Array.from(paths).sort();
    // Return top-level directories for brevity
    return sortedPaths.slice(0, 5).join(', ') + (sortedPaths.length > 5 ? '...' : '');
  }

  private getRepresentativeCodeSamples(chunks: EnhancedChunk[]): string {
    const samples: string[] = [];
    const seenTypes = new Set<string>();
    
    chunks
      .filter(chunk => chunk.importance === 'critical' || chunk.importance === 'important') // Consider important chunks too
      .sort((a, b) => {
        const importanceOrder = { 'critical': 3, 'important': 2, 'supporting': 1 };
        return (importanceOrder[b.importance] || 0) - (importanceOrder[a.importance] || 0);
      })
      .slice(0, 3) // Limit to avoid token limits
      .forEach(chunk => {
        if (!seenTypes.has(chunk.chunkType)) {
          seenTypes.add(chunk.chunkType);
          samples.push(`\\n--- ${chunk.fileName} (${chunk.filePath}) ---\\n\\\`\\\`\\\`${chunk.fileExtension}\\n${chunk.originalContent.substring(0, Math.min(chunk.originalContent.length, 500))}...\\n\\\`\\\`\\\``); // Limit content and add syntax highlighting
        }
      });
    
    return samples.length > 0 ? samples.join('\\n') : "No representative code samples available.";
  }

  private detectTechStack(chunks: EnhancedChunk[]): string[] {
    const techStack = new Set<string>();
    
    chunks.forEach(chunk => {
      const content = chunk.originalContent.toLowerCase();
      
      if (content.includes('next') || chunk.filePath.includes('next.config')) {
        techStack.add('Next.js');
      }
      if (content.includes('react') || content.includes('usestate') || content.includes('useeffect')) {
        techStack.add('React');
      }
      if (chunk.fileExtension === 'ts' || chunk.fileExtension === 'tsx') {
        techStack.add('TypeScript');
      }
      if (content.includes('tailwind') || content.includes('@apply')) {
        techStack.add('Tailwind CSS');
      }
      if (content.includes('fastapi') || chunk.filePath.endsWith('.py') && chunk.filePath.includes('api')) {
        techStack.add('FastAPI (Python)');
      }
      if (content.includes('milvus') || content.includes('zilliz')) {
        techStack.add('Zilliz/Milvus');
      }
      if (content.includes('novita.ai') || content.includes('novitaai')) {
        techStack.add('Novita.AI');
      }
    });
    
    return Array.from(techStack).sort();
  }

  private async sendConversationRequest(prompt: string, role: string): Promise<string> {
    try {
      const chatCompletion = await this.client.chat.completions.create({
        model: 'deepseek/deepseek-r1-turbo', // Use a suitable model from Novita.AI
        messages: [
          {
            role: 'system',
            content: `You are a ${role} with deep expertise in software development and architecture.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000, // Increased max tokens for more detailed explanations
        temperature: 0.3 // Lower temperature for more consistent technical explanations
      });
      
      const explanation = chatCompletion.choices?.[0]?.message?.content;
      console.log(`Raw NovitaConversationSystem response for role ${role}:`, explanation);
      
      if (!explanation) {
        console.warn("Novita AI returned empty explanation content for prompt:", prompt);
        throw new Error("No explanation content received from Novita AI.");
      }
      
      return explanation.trim();
      
    } catch (error: any) {
      console.error(`Error in ${role} conversation:`, error);
      return `Unable to generate AI explanation. Error: ${error.message || "Unknown error"}`; // Graceful fallback
    }
  }
} 