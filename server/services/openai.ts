import OpenAI from 'openai';
import config from '../config/env.js';
import { serverLogger } from '../middleware/logger.js';
import type { ChatRequest, ChatStreamEvent } from '../types/index.js';
import { buildSystemPrompt, buildUserPromptWithRAG } from './promptBuilder.js';

let openaiClient: OpenAI | null = null;

export class OpenAIServiceError extends Error {
  code = 'OPENAI_SERVICE_ERROR';
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    if (details) {
      this.details = details;
    }
  }
}

const ensureOpenAIClient = (): OpenAI => {
  if (!config.openaiApiKey) {
    throw new OpenAIServiceError('OPENAI_API_KEY is not configured.');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }

  return openaiClient;
};

export const checkOpenAIHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  error?: string;
}> => {
  try {
    const client = ensureOpenAIClient();
    // Simple health check using models endpoint
    await client.models.list();
    return { status: 'healthy' };
  } catch (error) {
    serverLogger.warn('OpenAI health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const streamOpenAIChatResponse = async function* (
  request: ChatRequest,
  requestId?: string,
): AsyncGenerator<ChatStreamEvent> {
  let userPrompt: string;
  let systemPrompt: string;

  try {
    systemPrompt = await buildSystemPrompt();
    userPrompt = await buildUserPromptWithRAG(
      request.message.trim(),
      request.experienceContext?.experienceId,
    );
  } catch (error) {
    throw new OpenAIServiceError('Failed to prepare prompt for OpenAI.', {
      requestId,
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const client = ensureOpenAIClient();

    const stream = await client.chat.completions.create({
      model: config.openaiChatModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    let emittedDone = false;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield {
          token: content,
          done: false,
        };
      }
    }

    emittedDone = true;
    yield { done: true };

    if (!emittedDone) {
      yield { done: true };
    }
  } catch (error) {
    serverLogger.error(
      'OpenAI streaming failure',
      error instanceof Error ? error : new Error(String(error)),
      { requestId },
    );
    throw new OpenAIServiceError('Failed to stream response from OpenAI.', {
      requestId,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
};
