import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';
import { serverLogger } from '../middleware/logger.js';
import type { DocumentChunk } from './documentProcessor.js';

const MAX_EMBED_RETRIES = 3;
const RETRY_BACKOFF_MS = 400;
const DEFAULT_EMBED_DIMENSION = 768;

let geminiClient: GoogleGenerativeAI | null = null;
let embeddingModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
let fallbackDimensions = DEFAULT_EMBED_DIMENSION;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export interface EmbeddedChunk extends DocumentChunk {
  embedding: number[];
}

export class EmbeddingServiceError extends Error {
  code = 'EMBEDDING_SERVICE_ERROR';
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    if (details) {
      this.details = details;
    }
  }
}

const ensureEmbeddingModel = () => {
  if (!config.geminiApiKey) {
    throw new EmbeddingServiceError('GEMINI_API_KEY is required for embedding generation.');
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
  }

  if (!embeddingModel) {
    embeddingModel = geminiClient.getGenerativeModel({ model: config.geminiEmbedModel });
    serverLogger.info('Initialized Gemini embedding model', {
      model: config.geminiEmbedModel,
    });
  }

  return embeddingModel;
};

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = ensureEmbeddingModel();
    const response = await model.embedContent(text);
    const embedding = response.embedding?.values;

    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new EmbeddingServiceError('Invalid embedding response from Gemini', {
        response,
      });
    }

    fallbackDimensions = embedding.length;
    return embedding;
  } catch (error) {
    serverLogger.error(
      'Failed to generate embedding with Gemini',
      error instanceof Error ? error : new Error(String(error)),
      {
        textLength: text.length,
        model: config.geminiEmbedModel,
      },
    );

    if (error instanceof EmbeddingServiceError) {
      throw error;
    }

    throw new EmbeddingServiceError('Failed to generate embedding', {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  const total = texts.length;
  let fallbackVector = new Array(fallbackDimensions).fill(0);

  for (let index = 0; index < total; index++) {
    const text = texts[index];
    let embedding: number[] | null = null;

    for (let attempt = 1; attempt <= MAX_EMBED_RETRIES; attempt++) {
      try {
        embedding = await generateEmbedding(text);
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isLastAttempt = attempt === MAX_EMBED_RETRIES;

        serverLogger.warn('Embedding request failed', {
          attempt,
          maxRetries: MAX_EMBED_RETRIES,
          textLength: text.length,
          error: message,
        });

        if (isLastAttempt) {
          serverLogger.warn('Falling back to zero vector for chunk', {
            index,
            textLength: text.length,
          });
          break;
        }

        const backoff = RETRY_BACKOFF_MS * attempt;
        await sleep(backoff);
      }
    }

    if (embedding) {
      if (fallbackVector.length !== embedding.length) {
        fallbackVector = new Array(embedding.length).fill(0);
      }
      embeddings.push(embedding);
    } else {
      embeddings.push(fallbackVector.slice());
    }

    if ((index + 1) % 10 === 0 || index === total - 1) {
      serverLogger.info('Generated embeddings progress', {
        processed: index + 1,
        total,
        progress: `${Math.round(((index + 1) / total) * 100)}%`,
      });
    }
  }

  return embeddings;
}

export async function embedChunks(chunks: DocumentChunk[]): Promise<EmbeddedChunk[]> {
  try {
    serverLogger.info('Starting chunk embedding process', {
      totalChunks: chunks.length,
    });

    const texts = chunks.map(chunk => chunk.content);
    const embeddings = await generateEmbeddings(texts);

    const zeroVector = new Array(fallbackDimensions).fill(0);
    const embeddedChunks: EmbeddedChunk[] = chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index] ?? zeroVector,
    }));

    serverLogger.info('Completed chunk embedding process', {
      totalChunks: embeddedChunks.length,
      embeddingDimensions: embeddedChunks[0]?.embedding.length || 0,
    });

    return embeddedChunks;
  } catch (error) {
    serverLogger.error(
      'Failed to embed chunks',
      error instanceof Error ? error : new Error(String(error)),
      {
        chunkCount: chunks.length,
      },
    );
    throw error;
  }
}

export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return embedding;
  return embedding.map(val => val / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    dotProduct += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export async function checkEmbeddingServiceHealth(): Promise<{ healthy: boolean; model?: string }> {
  try {
    await generateEmbedding('health-check');
    return {
      healthy: true,
      model: config.geminiEmbedModel,
    };
  } catch (error) {
    serverLogger.warn('Embedding service health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { healthy: false };
  }
}
