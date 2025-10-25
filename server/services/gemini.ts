import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/env.js";
import { serverLogger } from "../middleware/logger.js";
import type { ChatRequest, ChatStreamEvent } from "../types/index.js";
import { buildSystemPrompt, buildUserPromptWithRAG } from "./promptBuilder.js";

let geminiClient: GoogleGenerativeAI | null = null;

export class GeminiServiceError extends Error {
  code = "GEMINI_SERVICE_ERROR";
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    if (details) {
      this.details = details;
    }
  }
}

const ensureGeminiClient = (): GoogleGenerativeAI => {
  if (!config.geminiApiKey) {
    throw new GeminiServiceError("GEMINI_API_KEY is not configured.");
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
  }

  return geminiClient;
};

export const checkGeminiHealth = async (): Promise<{
  status: "healthy" | "unhealthy";
  error?: string;
}> => {
  try {
    const client = ensureGeminiClient();
    const model = client.getGenerativeModel({ model: config.geminiChatModel });
    await model.countTokens({
      contents: [
        {
          role: "user",
          parts: [{ text: "healthcheck" }],
        },
      ],
    });
    return { status: "healthy" };
  } catch (error) {
    serverLogger.warn("Gemini health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const streamGeminiChatResponse = async function* (
  request: ChatRequest,
  requestId?: string,
): AsyncGenerator<ChatStreamEvent> {
  let userPrompt: string;
  let combinedSystemPrompt: string;

  try {
    combinedSystemPrompt = await buildSystemPrompt();
    userPrompt = await buildUserPromptWithRAG(
      request.message.trim(),
      request.experienceContext?.experienceId,
    );
  } catch (error) {
    throw new GeminiServiceError("Failed to prepare prompt for Gemini.", {
      requestId,
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const client = ensureGeminiClient();
    const model = client.getGenerativeModel({
      model: config.geminiChatModel,
      systemInstruction: combinedSystemPrompt,
    });

    const streamResult = await model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
    });

    let emittedDone = false;

    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) {
        yield {
          token: text,
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
      "Gemini streaming failure",
      error instanceof Error ? error : new Error(String(error)),
      { requestId },
    );
    throw new GeminiServiceError("Failed to stream response from Gemini.", {
      requestId,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
};
