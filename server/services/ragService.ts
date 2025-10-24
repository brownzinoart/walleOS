import { serverLogger } from '../middleware/logger.js';
import {
  getCategoryPriorityMapFromHint,
  type CategoryHint,
  type CategoryPriorityMap,
} from '../config/ragSchema.js';
import { generateEmbedding } from './embeddingService.js';
import { getVectorStore, type SearchResult, type SearchOptions } from './vectorStore.js';

// Configuration from RAG schema
const RAG_CONFIG = {
  topKDefault: 6,
  rerankK: 3,
  minConfidence: 0.05, // Lowered to accommodate low similarity scores from current embeddings
};

export type { CategoryHint } from '../config/ragSchema.js';

export function getCategoryPriorityMap(hint?: CategoryHint): CategoryPriorityMap {
  return getCategoryPriorityMapFromHint(hint);
}

export interface RAGQuery {
  query: string;
  topK?: number;
  minConfidence?: number;
  categoryFilter?: string[];
  tagFilter?: string[];
  includeMetadata?: boolean;
  categoryHint?: CategoryHint;
  experienceId?: string; // used for boosting
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
 * Preprocess query to improve semantic matching
 */
export function preprocessQuery(query: string): string {
  const trimmed = query.trim().toLowerCase();

  // Expand common abbreviations and add relevant keywords
  const expansions: Record<string, string[]> = {
    'ai': ['artificial intelligence', 'machine learning', 'neural networks'],
    'ml': ['machine learning', 'artificial intelligence', 'data science'],
    'ux': ['user experience', 'user interface', 'design', 'usability'],
    'ui': ['user interface', 'design', 'frontend', 'interaction'],
    'dev': ['development', 'programming', 'coding', 'software'],
    'experience': ['background', 'history', 'career', 'work'],
    'skills': ['abilities', 'competencies', 'expertise', 'technologies'],
    'projects': ['portfolio', 'work', 'achievements', 'accomplishments'],
    'leadership': ['management', 'team', 'supervision', 'direction'],
    // domain/project synonyms
    'weready': ['startup intelligence', 'readiness score', 'investment readiness', 'bailey engine', 'evidence-based'],
    'listingpal': ['real estate marketing', 'agentselect', 'mls', 'ad copy', 'campaign generator'],
    'dxa': ['digital audit experience', 'analytics platform', 'audit canvas', 'prescriptive insights'],
    'splash': ['design system', 'atomic design', 'tokens', 'component library'],
    'kinesso': ['indigo awards', 'ux systems', 'media intelligence', 'ipg'],
    'one block away': ['weready', 'listingpal', 'mvp', 'llm orchestration'],
    // chips
    'portfolio-awards': ['awards', 'indigo', 'red dot', 'recognition', 'dxa', 'splash'],
    'current-ventures': ['weready', 'listingpal', 'one block away', 'mvp', 'startup'],
    'design-systems-leadership': ['splash', 'design system', 'governance', 'tokens', 'components'],
    'ai-implementation': ['orchestration', 'function calling', 'rag', 'lancedb', 'embedding'],
  };

  let expanded = trimmed;

  // Apply expansions
  for (const [key, values] of Object.entries(expansions)) {
    if (trimmed.includes(key)) {
      expanded += ' ' + values.join(' ');
    }
  }

  // Add contextual keywords based on query content
  if (trimmed.includes('experience') || trimmed.includes('background')) {
    expanded += ' career work history professional';
  }

  if (trimmed.includes('technical') || trimmed.includes('technology')) {
    expanded += ' programming development software engineering';
  }

  if (trimmed.includes('design') || trimmed.includes('creative')) {
    expanded += ' user experience user interface visual';
  }

  return expanded.trim();
}

/**
 * Rerank search results based on category priority and relevance
 */
function rerankResults(
  results: SearchResult[],
  rerankK: number,
  categoryPriorityMap: CategoryPriorityMap,
  tagBoostTerms: string[] = [],
  experienceId?: string,
): SearchResult[] {
  const boostSet = new Set(tagBoostTerms.map(t => t.toLowerCase()));

  // Apply category priority weighting + optional tag boosts + experienceIds metadata boost
  const weightedResults = results.map(result => {
    const category = result.chunk.metadata.category;
    const categoryWeight = categoryPriorityMap[category] ?? 0.5;
    let adjustedScore = result.score * categoryWeight;

    // Metadata-based experience boosting (strongest signal)
    if (experienceId && result.chunk.metadata.experienceIds?.includes(experienceId)) {
      adjustedScore *= 1.25; // Strong boost for exact experience match
    }

    // Tag/content-based boost for experience context (fallback)
    if (boostSet.size > 0) {
      const tags = (result.chunk.metadata.tags || []).map(t => t.toLowerCase());
      const content = result.chunk.content.toLowerCase();
      const hasBoostMatch = Array.from(boostSet).some(term =>
        tags.some(t => t.includes(term)) || content.includes(term)
      );

      if (hasBoostMatch) {
        adjustedScore *= 1.15; // modest boost
      }
    }

    return { ...result, score: adjustedScore };
  });

  weightedResults.sort((a, b) => b.score - a.score);
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
    (resultsByCategory[result.category] ?? (resultsByCategory[result.category] = [])).push(result);
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

    // Preprocess query for better semantic matching
    const processedQuery = preprocessQuery(ragQuery.query);

    // Generate embedding for the processed query
    const queryEmbedding = await generateEmbedding(processedQuery);

    // Prepare search options
    const searchOptions: SearchOptions = {
      topK: ragQuery.topK ?? RAG_CONFIG.topKDefault,
      minConfidence: ragQuery.minConfidence ?? RAG_CONFIG.minConfidence,
      ...(ragQuery.categoryFilter ? { categoryFilter: ragQuery.categoryFilter } : {}),
      ...(ragQuery.tagFilter ? { tagFilter: ragQuery.tagFilter } : {}),
    };

    // Perform vector search
    const searchResults = await vectorStore.search(queryEmbedding, searchOptions);

    // Decide category priority & tag boosts
    const categoryPriority = getCategoryPriorityMap(ragQuery.categoryHint);

    // Light mapping of experienceId -> boost terms (updated with Resume content)
    const experienceBoostTerms: Record<string, string[]> = {
      'founder-one-block-away': ['weready', 'listingpal', 'agentselect', 'one block away', 'mvp', 'orchestration'],
      'director-kinesso': ['splash', 'dxa', 'kinesso', 'design system', 'indigo', 'red dot'],
      'sr-ux-designer-heartbeat': ['heartbeat', 'healthcare', 'compliance', 'ux'],
      'sr-freelance-ux-pharma': ['heartbeat', 'tripscout', 'freelance', 'ux transition'],
      'account-supervisor-scout': ['scout marketing', 'xyrem', 'unbranded', 'awareness'],
      'sr-account-exec-fcb': ['fcb', 'linzess', 'preclearance', 'tv spot'],
      'barker-dzp': ['tough mudder', 'pdi healthcare', 'consumer marketing', 'mentorship'],
      'cdm-ny': ['zoloft', 'pfizer', 'digital loyalty', 'waiting room'],
      'account-exec-fcb': ['nuvigil', 'digital platform', 'rebranding'],
      'account-coordinator-rosetta': ['prevnar', 'kol', 'dubai', 'workshop'],
    };

    const tagBoostTerms = ragQuery.experienceId ? (experienceBoostTerms[ragQuery.experienceId] || []) : [];

    // Rerank results with hint + boosts + experienceId metadata matching
    const rerankedResults = rerankResults(searchResults, RAG_CONFIG.rerankK, categoryPriority, tagBoostTerms, ragQuery.experienceId);

    const experienceIdForLogging = ragQuery.experienceId;
    const metadataMatches = experienceIdForLogging
      ? rerankedResults.filter(result => result.chunk.metadata.experienceIds?.includes(experienceIdForLogging)).length
      : 0;
    const generalMatches = rerankedResults.length - metadataMatches;

    serverLogger.info('RAG rerank mix', {
      experienceId: experienceIdForLogging ?? null,
      metadataMatches,
      generalMatches,
      tagBoostTerms: tagBoostTerms.length,
    });

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
      originalQuery: ragQuery.query,
      processedQuery: processedQuery,
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
    topK: 2, // tighter tone context
    minConfidence: 0.15,
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
