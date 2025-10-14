import { Ollama } from 'ollama';
import config from '../config/env.js';
import { serverLogger } from '../middleware/logger.js';
import type { ChatRequest, ChatStreamEvent, OllamaMessage } from '../types/index.js';
import { buildExperienceContextPrompt, buildSystemPrompt } from './promptBuilder.js';

const ollamaClient = new Ollama({ host: config.ollamaHost });

export class OllamaServiceError extends Error {
  code = 'OLLAMA_SERVICE_ERROR';
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    if (details) {
      this.details = details;
    }
  }
}

export const checkOllamaHealth = async (): Promise<{ healthy: boolean }> => {
  try {
    const models = await ollamaClient.list();
    const modelList = Array.isArray(models.models) ? models.models : [];
    const healthy = modelList.some(model => {
      if (!model || typeof model !== 'object' || !('name' in model)) {
        return false;
      }
      const modelName = (model as { name?: string }).name;
      return modelName === config.ollamaModel;
    });

    return { healthy };
  } catch (error) {
    serverLogger.warn('Failed to reach Ollama during health check', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { healthy: false };
  }
};

const buildUserPrompt = (request: ChatRequest): string => {
  const segments: string[] = [];

  if (request.experienceContext?.experienceId) {
    const experienceContext = buildExperienceContextPrompt(request.experienceContext.experienceId);
    if (experienceContext) {
      segments.push(experienceContext);
    }
  }

  if (request.chipId) {
    segments.push(`Suggestion chip selected: ${request.chipId}`);
  }

  segments.push(`User message:\n${request.message.trim()}`);

  return segments.join('\n\n');
};

export const streamChatResponse = async function* (
  request: ChatRequest,
  requestId?: string,
): AsyncGenerator<ChatStreamEvent> {
  let messages: OllamaMessage[];

  try {
    messages = [
      {
        role: 'system',
        content: buildSystemPrompt(),
      },
      {
        role: 'user',
        content: buildUserPrompt(request),
      },
    ];
  } catch (error) {
    throw new OllamaServiceError('Failed to prepare prompt for Ollama.', {
      requestId,
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const stream = await ollamaClient.chat({
      model: config.ollamaModel,
      messages,
      stream: true,
    });

    let emittedDone = false;

    for await (const chunk of stream) {
      if (chunk.message?.content) {
        yield {
          token: chunk.message.content,
          done: false,
        };
      }

      if (chunk.done) {
        emittedDone = true;
        yield { done: true };
      }
    }

    if (!emittedDone) {
      yield { done: true };
    }
  } catch (error) {
    serverLogger.error('Ollama streaming failure', error instanceof Error ? error : new Error(String(error)), {
      requestId,
    });
    throw new OllamaServiceError('Failed to stream response from Ollama.', {
      requestId,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
};
