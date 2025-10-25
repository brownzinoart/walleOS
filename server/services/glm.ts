import { ZhipuAI } from "zhipuai";
import envConfig from "../config/env.js";

export class GlmServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "GlmServiceError";
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function* streamGlmChatResponse(
  messages: ChatMessage[],
  model: string = envConfig.glmChatModel,
): AsyncGenerator<string, void, unknown> {
  if (!envConfig.glmApiKey) {
    throw new GlmServiceError("GLM API key not configured");
  }

  const client = new ZhipuAI({
    apiKey: envConfig.glmApiKey,
  });

  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    for await (const chunk of stream as any) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    throw new GlmServiceError(
      `GLM API error: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined,
    );
  }
}

export async function checkGlmHealth(): Promise<{
  status: "healthy" | "unhealthy";
  error?: string;
}> {
  if (!envConfig.glmApiKey) {
    return { status: "unhealthy", error: "GLM API key not configured" };
  }

  try {
    const client = new ZhipuAI({
      apiKey: envConfig.glmApiKey,
    });

    // Simple health check with a minimal request - try non-streaming first
    await client.chat.completions.create({
      model: envConfig.glmChatModel,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
      stream: false,
    });

    return { status: "healthy" };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
