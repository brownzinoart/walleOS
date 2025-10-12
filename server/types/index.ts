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
