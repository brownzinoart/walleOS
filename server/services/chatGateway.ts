import { serverLogger } from "../middleware/logger.js";
import envConfig from "../config/env.js";
import type { ChatRequest, ChatStreamEvent } from "../types/index.js";
import { streamGlmChatResponse } from "./glm.js";
import { streamGeminiChatResponse } from "./gemini.js";

export class ChatGatewayError extends Error {
  constructor(
    message: string,
    public readonly providerErrors: Array<{ provider: string; error: string }>,
  ) {
    super(message);
    this.name = "ChatGatewayError";
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function* convertGlmStreamToChatStream(
  glmStream: AsyncGenerator<string>,
): AsyncGenerator<ChatStreamEvent> {
  for await (const token of glmStream) {
    yield {
      token,
      done: false,
    };
  }
  yield { done: true };
}

export async function* streamChatResponse(
  request: ChatRequest,
  requestId?: string,
): AsyncGenerator<ChatStreamEvent> {
  const providers = [
    {
      name: envConfig.llmPrimaryProvider,
      streamFn:
        envConfig.llmPrimaryProvider === "glm"
          ? async (req: ChatRequest) => {
              const messages: ChatMessage[] = [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: req.message },
              ];
              return convertGlmStreamToChatStream(
                streamGlmChatResponse(messages),
              );
            }
          : streamGeminiChatResponse,
    },
    {
      name: envConfig.llmFallbackProvider,
      streamFn:
        envConfig.llmFallbackProvider === "glm"
          ? async (req: ChatRequest) => {
              const messages: ChatMessage[] = [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: req.message },
              ];
              return convertGlmStreamToChatStream(
                streamGlmChatResponse(messages),
              );
            }
          : streamGeminiChatResponse,
    },
  ];

  const errors: Array<{ provider: string; error: string }> = [];

  for (const provider of providers) {
    try {
      serverLogger.info(`Attempting chat with provider: ${provider.name}`, {
        requestId,
      });

      const streamResult = provider.streamFn(request, requestId);
      const stream =
        streamResult instanceof Promise ? await streamResult : streamResult;

      for await (const event of stream) {
        yield event;
      }

      serverLogger.info(
        `Successfully completed chat with provider: ${provider.name}`,
        { requestId },
      );
      return;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push({ provider: provider.name, error: errorMessage });

      serverLogger.warn(`Provider ${provider.name} failed`, {
        requestId,
        error: errorMessage,
        provider: provider.name,
      });

      // Continue to next provider
      continue;
    }
  }

  // All providers failed
  const errorSummary = errors
    .map((e) => `${e.provider}: ${e.error}`)
    .join("; ");
  throw new ChatGatewayError(
    `All chat providers failed. Errors: ${errorSummary}`,
    errors,
  );
}

export async function checkChatProvidersHealth(): Promise<{
  providers: Array<{
    name: string;
    status: "healthy" | "unhealthy";
    error?: string;
  }>;
  overall: "healthy" | "unhealthy";
}> {
  const providers = [
    { name: envConfig.llmPrimaryProvider, type: envConfig.llmPrimaryProvider },
    {
      name: envConfig.llmFallbackProvider,
      type: envConfig.llmFallbackProvider,
    },
  ];

  const results = await Promise.allSettled(
    providers.map(async (provider) => {
      if (provider.type === "glm") {
        const { checkGlmHealth } = await import("./glm.js");
        const health = await checkGlmHealth();
        return {
          name: provider.name,
          ...health,
        };
      } else {
        const { checkGeminiHealth } = await import("./gemini.js");
        const health = await checkGeminiHealth();
        return {
          name: provider.name,
          ...health,
        };
      }
    }),
  );

  const providerResults = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        name: providers[index]?.name || "unknown",
        status: "unhealthy" as const,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : "Unknown error",
      };
    }
  });

  const overall = providerResults.some((p) => p.status === "healthy")
    ? "healthy"
    : "unhealthy";

  return {
    providers: providerResults,
    overall,
  };
}
