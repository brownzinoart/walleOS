export interface ChatRequest {
  message: string;
  experienceContext?: {
    experienceId: string;
  };
  chipId?: string;
}

export interface ChatStreamEvent {
  token?: string;
  done: boolean;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  services: {
    ollama: {
      status: 'up' | 'down';
      model: string;
    };
  };
  requestId?: string;
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type Context7DocumentState = 'initial' | 'finalized' | 'error' | 'delete';

export interface Context7SearchResult {
  id: string;
  title: string;
  description: string;
  branch: string;
  lastUpdateDate: string;
  state: Context7DocumentState;
  totalTokens: number;
  totalSnippets: number;
  totalPages: number;
  stars?: number;
  trustScore?: number;
  versions?: string[];
}

export interface Context7SearchResponse {
  results: Context7SearchResult[];
  error?: string;
}

export interface Context7DocumentationResult {
  libraryId: string;
  content: string | null;
}
