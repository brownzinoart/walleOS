import type {
  Context7DocumentationResult,
  Context7SearchResponse,
} from "../types/index.js";

// Frontend API Service Types (aligned with backend)
export interface ChatRequest {
  message: string;
  experienceContext?: {
    experienceId: string;
    experienceTitle?: string;
  };
  chipId?: string;
}

export interface ChatStreamEvent {
  token?: string;
  done: boolean;
  error?: string;
}

export interface HealthCheckResponse {
  status: "healthy" | "degraded";
  timestamp: string;
  services: {
    chat: {
      providers: Array<{
        name: string;
        status: "healthy" | "unhealthy";
        error?: string;
      }>;
      overall: "healthy" | "unhealthy";
    };
    embedding: {
      provider: string;
      model: string;
      status: "healthy" | "unhealthy";
      error?: string;
    };
  };
  requestId?: string;
}

// API Service Error Classes
export class ApiServiceError extends Error {
  code = "API_SERVICE_ERROR";
  status?: number | undefined;
  details?: Record<string, unknown> | undefined;

  constructor(
    message: string,
    status?: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class ApiTimeoutError extends ApiServiceError {
  override code = "API_TIMEOUT_ERROR";
}

export class ApiNetworkError extends ApiServiceError {
  override code = "API_NETWORK_ERROR";
}

export class ApiAbortError extends ApiServiceError {
  override code = "API_ABORT_ERROR";
}

// Configuration
type ImportMetaWithEnv = {
  env?: {
    MODE?: string;
  };
};

const nodeEnv =
  typeof process !== "undefined" ? process.env?.["NODE_ENV"] : undefined;
const viteMode =
  typeof import.meta !== "undefined"
    ? (import.meta as unknown as ImportMetaWithEnv).env?.MODE
    : undefined;
const runtimeMode = nodeEnv ?? viteMode;
const API_BASE_URL =
  runtimeMode === "development" ? "http://localhost:3001/api" : "/api";
const REQUEST_TIMEOUT = 60000; // 60 seconds - increased for first request model loading
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Types for API service
interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  shouldRetry?: (error: ApiServiceError) => boolean;
}

interface RequestOptions extends RetryOptions {
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// Default retry logic
const defaultShouldRetry = (error: ApiServiceError): boolean => {
  // Retry on network errors, timeouts, and 5xx status codes
  return (
    error instanceof ApiNetworkError ||
    error instanceof ApiTimeoutError ||
    (error.status !== undefined && error.status >= 500)
  );
};

// Sleep utility for retry delays
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff calculation
const calculateRetryDelay = (attempt: number, baseDelay: number): number =>
  baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;

// Core HTTP client with retry logic and timeout
async function requestWithRetry<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    baseDelay = RETRY_DELAY,
    shouldRetry = defaultShouldRetry,
    timeout = REQUEST_TIMEOUT,
    headers = {},
  } = options;

  let lastError: ApiServiceError;
  let timeoutId: NodeJS.Timeout | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        signal: controller.signal,
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        let errorDetails: Record<string, unknown> = {};

        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = { responseText: errorText };
        }

        throw new ApiServiceError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorDetails,
        );
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      // Handle different error types
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          lastError = new ApiTimeoutError(`Request timeout after ${timeout}ms`);
        } else if (error instanceof ApiServiceError) {
          lastError = error;
        } else {
          // Generic fetch errors (e.g., network issues) often manifest as TypeError
          lastError = new ApiNetworkError(error.message, undefined, {
            originalError: error,
          });
        }
      } else {
        lastError = new ApiServiceError("Unknown error occurred");
      }

      // Don't retry if it's the last attempt or error shouldn't be retried
      if (attempt > maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Wait before retry
      if (attempt <= maxRetries) {
        const delay = calculateRetryDelay(attempt, baseDelay);
        await sleep(delay);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  throw lastError!;
}

// Health check API
export const checkHealth = async (): Promise<HealthCheckResponse> => {
  return requestWithRetry<HealthCheckResponse>(`${API_BASE_URL}/health`, {
    maxRetries: 1, // Health checks shouldn't retry
    timeout: 5000, // Shorter timeout for health checks
  });
};

export const searchContext7Libraries = async (
  query: string,
): Promise<Context7SearchResponse> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    throw new ApiServiceError(
      "Search query must be at least two characters long.",
    );
  }

  const url = `${API_BASE_URL}/context7/search?q=${encodeURIComponent(trimmed)}`;

  return requestWithRetry<Context7SearchResponse>(url, {
    maxRetries: 2,
    timeout: 10000,
  });
};

export interface Context7DocumentationRequest {
  id: string;
  tokens?: number;
  topic?: string;
}

export const fetchContext7Documentation = async (
  params: Context7DocumentationRequest,
): Promise<Context7DocumentationResult> => {
  if (!params.id || params.id.trim().length === 0) {
    throw new ApiServiceError(
      "Library ID is required to load Context7 documentation.",
    );
  }

  const searchParams = new URLSearchParams({
    id: params.id.trim(),
  });

  if (typeof params.tokens === "number") {
    if (!Number.isFinite(params.tokens) || params.tokens <= 0) {
      throw new ApiServiceError(
        "Tokens must be a positive number when provided.",
      );
    }
    searchParams.set("tokens", Math.round(params.tokens).toString());
  }

  if (params.topic) {
    searchParams.set("topic", params.topic);
  }

  const url = `${API_BASE_URL}/context7/docs?${searchParams.toString()}`;

  return requestWithRetry<Context7DocumentationResult>(url, {
    maxRetries: 2,
    timeout: 15000,
  });
};

// Streaming chat API with Server-Sent Events support
export async function* streamChatResponse(
  request: ChatRequest,
  options: RequestOptions = {},
): AsyncGenerator<ChatStreamEvent> {
  const { timeout = REQUEST_TIMEOUT, headers = {}, signal } = options;
  // Create AbortController for timeout and cancellation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let externalAbort = false;
  let externalAbortListener: (() => void) | undefined;

  if (signal) {
    if (signal.aborted) {
      externalAbort = true;
      controller.abort();
    } else {
      externalAbortListener = () => {
        externalAbort = true;
        controller.abort();
      };
      signal.addEventListener("abort", externalAbortListener, { once: true });
    }
  }

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(request),
    signal: controller.signal,
  });

  try {
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      let errorDetails: Record<string, unknown> = {};

      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { responseText: errorText };
      }

      throw new ApiServiceError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorDetails,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new ApiServiceError("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Handle any remaining data in buffer
          if (buffer.trim()) {
            const finalEvent = parseStreamData(buffer.trim());
            if (finalEvent) {
              yield finalEvent;
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const event = parseStreamData(trimmedLine.slice(6));
            if (event !== null) {
              yield event;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      if (externalAbortListener && signal) {
        signal.removeEventListener("abort", externalAbortListener);
      }
      controller.abort();
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        if (externalAbort) {
          throw new ApiAbortError("Request aborted by caller.");
        }
        throw new ApiTimeoutError(`Stream timeout after ${timeout}ms`);
      }
      // Re-throw existing ApiServiceErrors, otherwise wrap
      if (error instanceof ApiServiceError) {
        throw error;
      }
      throw new ApiServiceError(error.message);
    }
    throw new ApiServiceError("Unknown streaming error");
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Parse Server-Sent Events data
function parseStreamData(data: string): ChatStreamEvent | null {
  if (!data.trim()) {
    return null;
  }

  try {
    return JSON.parse(data) as ChatStreamEvent;
  } catch (error) {
    // Log malformed data but don't fail the stream
    console.warn("Failed to parse stream data:", data, error);
    return null;
  }
}

// Input sanitization utilities
export const sanitizeInput = (input: string): string => {
  if (typeof input !== "string") {
    throw new ApiServiceError("Input must be a string");
  }

  return input
    .trim()
    .slice(0, 2000) // Match backend validation limit
    .replace(/[<>]/g, ""); // Basic HTML tag removal
};

// Error message sanitization for user display
export const sanitizeErrorMessage = (error: ApiServiceError): string => {
  // Don't expose internal server details to users
  if (error.status && error.status >= 500) {
    return "Server temporarily unavailable. Please try again.";
  }

  if (error instanceof ApiNetworkError) {
    return "Network connection issue. Please check your connection and try again.";
  }

  if (error instanceof ApiTimeoutError) {
    return "Request timed out. Please try again.";
  }

  // For client errors (4xx), show the message but sanitized
  return error.message.length > 100
    ? error.message.slice(0, 100) + "..."
    : error.message;
};

type RequestQueueItem = {
  id: string;
  request: ChatRequest;
  resolve: (value: AsyncGenerator<ChatStreamEvent>) => void;
  reject: (error: ApiServiceError) => void;
  priority: number;
  options?: RequestOptions;
};

// Request queuing system for scalability
class RequestQueue {
  private queue: RequestQueueItem[] = [];
  private maxConcurrent = 3;
  private processing = false;
  private activeCount = 0;

  async enqueue(
    request: ChatRequest,
    priority = 0,
    options?: RequestOptions,
  ): Promise<AsyncGenerator<ChatStreamEvent>> {
    return new Promise((resolve, reject) => {
      const id = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // Add to queue
      const queueItem: RequestQueueItem = {
        id,
        request,
        resolve,
        reject,
        priority,
        ...(options !== undefined ? { options } : {}),
      };

      this.queue.push(queueItem);

      // Sort by priority (higher number = higher priority)
      this.queue.sort((a, b) => b.priority - a.priority);

      this.tryProcess();
    });
  }

  private startItem(item: RequestQueueItem): void {
    let stream: AsyncGenerator<ChatStreamEvent>;

    try {
      stream = streamChatResponse(item.request, item.options ?? {});
    } catch (error) {
      item.reject(
        error instanceof ApiServiceError
          ? error
          : new ApiServiceError("Queue processing failed"),
      );
      return;
    }

    this.activeCount += 1;
    const cleanup = () => {
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.tryProcess();
    };

    const wrapped = (async function* () {
      try {
        for await (const event of stream) {
          yield event;
        }
      } finally {
        cleanup();
      }
    })();

    item.resolve(wrapped);
  }

  private async tryProcess(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
        const next = this.queue.shift();
        if (!next) {
          break;
        }
        this.startItem(next);
        if (this.activeCount >= this.maxConcurrent) {
          break;
        }
      }
    } finally {
      this.processing = false;
    }
  }
}

// Global request queue instance
const requestQueue = new RequestQueue();

// Queued chat API with priority support
export const queuedChatRequest = (
  request: ChatRequest,
  priority = 0,
  options?: RequestOptions,
): Promise<AsyncGenerator<ChatStreamEvent>> => {
  return requestQueue.enqueue(request, priority, options);
};

// Direct chat API (bypasses queue for immediate processing)
export const directChatRequest = streamChatResponse;

// Export queue management for advanced usage
export const apiQueue = {
  setMaxConcurrent: (max: number) => {
    requestQueue["maxConcurrent"] = max;
  },
  getQueueLength: () => requestQueue["queue"].length,
  clearQueue: () => {
    requestQueue["queue"].length = 0;
  },
};
