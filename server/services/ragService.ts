import { serverLogger } from '../middleware/logger.js';
import { generateEmbedding } from './embeddingService.js';
import { getVectorStore, type SearchResult, type SearchOptions } from './vectorStore.js';

// Configuration from RAG schema
const RAG_CONFIG = {
  topKDefault: 6,
  rerankK: 3,
  minConfidence: 0.1, // Lowered from 0.65 for testing
  // Priority ranking from schema
  categoryPriority: {
    narrative: 1.0,
    portfolio: 0.95,
    experience: 0.9,
    skills: 0.85,
    faq: 0.8,
    funfacts: 0.7,
    metrics: 0.7,
  },
};

export interface RAGQuery {
  query: string;
  topK?: number;
  minConfidence?: number;
  categoryFilter?: string[];
  tagFilter?: string[];
  includeMetadata?: boolean;
}

export interface RAGResult {
  content: string;
  source: string;
  category: string;
  score: number;
  rank: number;
  metadata?: {
    chunkIndex: number;
    totalChunks: number;
    tags: string[];
    priority: number;
  };
}

export interface RAGResponse {
  results: RAGResult[];
  query: string;
  totalResults: number;
  processingTimeMs: number;
  context: string; // Combined context for prompt injection
}

export class RAGServiceError extends Error {
  code = 'RAG_SERVICE_ERROR';
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    if (details) {
      this.details = details;
    }
  }
}

/**
 * Rerank search results based on category priority and relevance
 */
function rerankResults(results: SearchResult[], rerankK: number): SearchResult[] {
  // Apply category priority weighting
  const weightedResults = results.map(result => {
    const categoryWeight = RAG_CONFIG.categoryPriority[result.chunk.metadata.category as keyof typeof RAG_CONFIG.categoryPriority] || 0.5;
    const adjustedScore = result.score * categoryWeight;
    
    return {
      ...result,
      score: adjustedScore,
    };
  });

  // Sort by adjusted score
  weightedResults.sort((a, b) => b.score - a.score);

  // Return top reranked results
  return weightedResults.slice(0, rerankK);
}

/**
 * Build context string from search results for prompt injection
 */
function buildContext(results: RAGResult[]): string {
  if (results.length === 0) {
    return '';
  }

  const contextSections: string[] = [];
  
  // Group results by category for better organization
  const resultsByCategory: Record<string, RAGResult[]> = {};
  for (const result of results) {
    if (!resultsByCategory[result.category]) {
      resultsByCategory[result.category] = [];
    }
    resultsByCategory[result.category].push(result);
  }

  // Build context with category headers
  for (const [category, categoryResults] of Object.entries(resultsByCategory)) {
    const categoryHeader = `## ${category.toUpperCase()} CONTEXT`;
    const categoryContent = categoryResults
      .map(result => `${result.content}\n(Source: ${result.source})`)
      .join('\n\n');
    
    contextSections.push(`${categoryHeader}\n${categoryContent}`);
  }

  return contextSections.join('\n\n---\n\n');
}

/**
 * Perform RAG retrieval for a query
 */
export async function retrieveContext(ragQuery: RAGQuery): Promise<RAGResponse> {
  const startTime = Date.now();
  
  try {
    const vectorStore = getVectorStore();
    
    // Check if vector store is ready
    const isReady = await vectorStore.isReady();
    if (!isReady) {
      throw new RAGServiceError('Vector store is not initialized. Please run corpus ingestion first.');
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(ragQuery.query);

    // Prepare search options
    const searchOptions: SearchOptions = {
      topK: ragQuery.topK || RAG_CONFIG.topKDefault,
      minConfidence: ragQuery.minConfidence || RAG_CONFIG.minConfidence,
      categoryFilter: ragQuery.categoryFilter,
      tagFilter: ragQuery.tagFilter,
    };

    // Perform vector search
    const searchResults = await vectorStore.search(queryEmbedding, searchOptions);

    // Rerank results
    const rerankedResults = rerankResults(searchResults, RAG_CONFIG.rerankK);

    // Convert to RAG results
    const ragResults: RAGResult[] = rerankedResults.map((result, index) => ({
      content: result.chunk.content,
      source: result.chunk.metadata.sourceFile,
      category: result.chunk.metadata.category,
      score: result.score,
      rank: index + 1,
      ...(ragQuery.includeMetadata && {
        metadata: {
          chunkIndex: result.chunk.metadata.chunkIndex,
          totalChunks: result.chunk.metadata.totalChunks,
          tags: result.chunk.metadata.tags,
          priority: result.chunk.metadata.priority,
        },
      }),
    }));

    // Build context for prompt injection
    const context = buildContext(ragResults);

    const processingTimeMs = Date.now() - startTime;

    const response: RAGResponse = {
      results: ragResults,
      query: ragQuery.query,
      totalResults: ragResults.length,
      processingTimeMs,
      context,
    };

    serverLogger.info('RAG retrieval completed', {
      query: ragQuery.query,
      resultsFound: ragResults.length,
      processingTimeMs,
      topScore: ragResults[0]?.score || 0,
    });

    return response;
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    
    serverLogger.error('RAG retrieval failed', error instanceof Error ? error : new Error(String(error)), {
      query: ragQuery.query,
      processingTimeMs,
    });

    if (error instanceof RAGServiceError) {
      throw error;
    }

    throw new RAGServiceError('Failed to retrieve context', {
      query: ragQuery.query,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get RAG service health status
 */
export async function getRAGServiceHealth(): Promise<{
  healthy: boolean;
  vectorStoreReady: boolean;
  totalChunks?: number;
  categories?: Record<string, number>;
}> {
  try {
    const vectorStore = getVectorStore();
    const vectorStoreReady = await vectorStore.isReady();
    
    if (!vectorStoreReady) {
      return {
        healthy: false,
        vectorStoreReady: false,
      };
    }

    const stats = await vectorStore.getStats();
    
    return {
      healthy: true,
      vectorStoreReady: true,
      totalChunks: stats.totalChunks,
      categories: stats.categories,
    };
  } catch (error) {
    serverLogger.warn('RAG service health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return {
      healthy: false,
      vectorStoreReady: false,
    };
  }
}

/**
 * Search for specific categories or tags
 */
export async function searchByCategory(
  query: string,
  category: string,
  options: Partial<RAGQuery> = {}
): Promise<RAGResponse> {
  return retrieveContext({
    query,
    categoryFilter: [category],
    ...options,
  });
}

/**
 * Search for narrative/tone content specifically
 */
export async function retrieveNarrativeContext(query: string): Promise<RAGResponse> {
  return searchByCategory(query, 'narrative', {
    topK: 3, // Fewer results for tone context
    minConfidence: 0.5, // Lower threshold for tone matching
  });
}

/**
 * Search for factual content (portfolio, experience, skills)
 */
export async function retrieveFactualContext(query: string): Promise<RAGResponse> {
  return retrieveContext({
    query,
    categoryFilter: ['portfolio', 'experience', 'skills', 'metrics'],
    topK: 4,
  });
}
