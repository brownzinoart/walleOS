import { Ollama } from 'ollama';
import config from '../config/env.js';
import { serverLogger } from '../middleware/logger.js';
import type { DocumentChunk } from './documentProcessor.js';

const ollamaClient = new Ollama({ host: config.ollamaHost });

// Embedding model from RAG schema
const EMBEDDING_MODEL = 'nomic-embed-text';

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

/**
 * Generate embedding for a single text using Ollama
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await ollamaClient.embeddings({
      model: EMBEDDING_MODEL,
      prompt: text,
    });

    if (!response.embedding || !Array.isArray(response.embedding)) {
      throw new EmbeddingServiceError('Invalid embedding response from Ollama', {
        response,
      });
    }

    return response.embedding;
  } catch (error) {
    serverLogger.error('Failed to generate embedding', error instanceof Error ? error : new Error(String(error)), {
      textLength: text.length,
      model: EMBEDDING_MODEL,
    });
    
    if (error instanceof EmbeddingServiceError) {
      throw error;
    }
    
    throw new EmbeddingServiceError('Failed to generate embedding', {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Generate embeddings for multiple texts with batching and rate limiting
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  const batchSize = 10; // Process in small batches to avoid overwhelming Ollama
  const delayMs = 100; // Small delay between requests

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(async (text, index) => {
      try {
        // Add small delay to avoid overwhelming the service
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        return await generateEmbedding(text);
      } catch (error) {
        serverLogger.warn('Failed to generate embedding for text in batch', {
          batchIndex: i + index,
          textLength: text.length,
          error: error instanceof Error ? error.message : String(error),
        });
        // Return zero vector as fallback
        return new Array(384).fill(0); // nomic-embed-text has 384 dimensions
      }
    });

    const batchEmbeddings = await Promise.all(batchPromises);
    embeddings.push(...batchEmbeddings);

    // Log progress
    serverLogger.info('Generated embeddings batch', {
      processed: Math.min(i + batchSize, texts.length),
      total: texts.length,
      progress: `${Math.round((Math.min(i + batchSize, texts.length) / texts.length) * 100)}%`,
    });
  }

  return embeddings;
}

/**
 * Embed document chunks
 */
export async function embedChunks(chunks: DocumentChunk[]): Promise<EmbeddedChunk[]> {
  try {
    serverLogger.info('Starting chunk embedding process', {
      totalChunks: chunks.length,
    });

    const texts = chunks.map(chunk => chunk.content);
    const embeddings = await generateEmbeddings(texts);

    const embeddedChunks: EmbeddedChunk[] = chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }));

    serverLogger.info('Completed chunk embedding process', {
      totalChunks: embeddedChunks.length,
      embeddingDimensions: embeddedChunks[0]?.embedding.length || 0,
    });

    return embeddedChunks;
  } catch (error) {
    serverLogger.error('Failed to embed chunks', error instanceof Error ? error : new Error(String(error)), {
      chunkCount: chunks.length,
    });
    throw error;
  }
}

/**
 * Normalize embedding vector (as specified in RAG schema)
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return embedding;
  return embedding.map(val => val / magnitude);
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Check if embedding service is available
 */
export async function checkEmbeddingServiceHealth(): Promise<{ healthy: boolean; model?: string }> {
  try {
    // Try to generate a small test embedding
    const testEmbedding = await generateEmbedding('test');
    return {
      healthy: testEmbedding.length > 0,
      model: EMBEDDING_MODEL,
    };
  } catch (error) {
    serverLogger.warn('Embedding service health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { healthy: false };
  }
}
