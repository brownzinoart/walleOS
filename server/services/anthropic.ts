import Anthropic from '@anthropic-ai/sdk';
import config from '../config/env.js';
import { serverLogger } from '../middleware/logger.js';
import type { ChatRequest, ChatStreamEvent } from '../types/index.js';
import { buildSystemPrompt, buildUserPromptWithRAG } from './promptBuilder.js';

let anthropicClient: Anthropic | null = null;

export class AnthropicServiceError extends Error {
  code = 'ANTHROPIC_SERVICE_ERROR';
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    if (details) {
      this.details = details;
    }
  }
}

const ensureAnthropicClient = (): Anthropic => {
  if (!config.anthropicApiKey) {
    throw new AnthropicServiceError('ANTHROPIC_API_KEY is not configured.');
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }

  return anthropicClient;
};

export const checkAnthropicHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  error?: string;
}> => {
  try {
    const client = ensureAnthropicClient();
    // Simple health check - attempt to create a minimal request
    await client.messages.create({
      model: config.anthropicChatModel,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    return { status: 'healthy' };
  } catch (error) {
    serverLogger.warn('Anthropic health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const streamAnthropicChatResponse = async function* (
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
    throw new AnthropicServiceError('Failed to prepare prompt for Anthropic.', {
      requestId,
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const client = ensureAnthropicClient();

    const stream = await client.messages.stream({
      model: config.anthropicChatModel,
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    let emittedDone = false;

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield {
          token: chunk.delta.text,
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
      'Anthropic streaming failure',
      error instanceof Error ? error : new Error(String(error)),
      { requestId },
    );
    throw new AnthropicServiceError('Failed to stream response from Anthropic.', {
      requestId,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
};
