import { connect, Table, type Connection } from '@lancedb/lancedb';
import { join } from 'node:path';
import { serverLogger } from '../middleware/logger.js';
import type { EmbeddedChunk } from './embeddingService.js';
import { cosineSimilarity, normalizeEmbedding } from './embeddingService.js';

// Configuration from RAG schema
const RETRIEVAL_CONFIG = {
  topKDefault: 6,
  rerankK: 3,
  minConfidence: 0.05, // Lowered to accommodate low similarity scores from current embeddings
};

export interface SearchResult {
  chunk: EmbeddedChunk;
  score: number;
  rank: number;
}

type LanceSearchRow = {
  id: string;
  content: string;
  embedding?: number[];
  _distance?: number;
  sourceFile: string;
  category: string;
  chunkIndex: number;
  totalChunks: number;
  startChar: number;
  endChar: number;
  tags?: string;
  priority: number;
  experienceIds?: string;
};

export interface SearchOptions {
  topK?: number;
  minConfidence?: number;
  categoryFilter?: string[];
  tagFilter?: string[];
  experienceIdFilter?: string;
}

export function matchesExperienceIdFilter(
  rowExperienceIds: string | string[] | undefined,
  experienceIdFilter?: string,
): boolean {
  if (!experienceIdFilter) {
    return true;
  }

  const parsedExperienceIds = Array.isArray(rowExperienceIds)
    ? rowExperienceIds.map(id => id.trim()).filter(Boolean)
    : rowExperienceIds
      ? rowExperienceIds.split(',').map(id => id.trim()).filter(Boolean)
      : [];

  if (parsedExperienceIds.length === 0) {
    return true;
  }

  return parsedExperienceIds.includes(experienceIdFilter);
}

export class VectorStoreError extends Error {
  code = 'VECTOR_STORE_ERROR';
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    if (details) {
      this.details = details;
    }
  }
}

export class VectorStore {
  private db: Connection | null = null;
  private table: Table | null = null;
  private readonly dbPath: string;
  private readonly tableName = 'wallymo_chunks';

  constructor(dbPath?: string) {
    // Ensure we're using the server directory for data
    const serverDir = process.cwd().endsWith('server') ? process.cwd() : join(process.cwd(), 'server');
    this.dbPath = dbPath || join(serverDir, 'data', 'vectordb');
  }

  /**
   * Initialize the vector database
   */
  async initialize(): Promise<void> {
    try {
      this.db = await connect(this.dbPath);
      serverLogger.info('Connected to LanceDB', { dbPath: this.dbPath });
    } catch (error) {
      serverLogger.error('Failed to connect to LanceDB', error instanceof Error ? error : new Error(String(error)), {
        dbPath: this.dbPath,
      });
      throw new VectorStoreError('Failed to initialize vector database', {
        dbPath: this.dbPath,
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create or get the chunks table
   */
  private async getTable(): Promise<Table> {
    if (this.table) {
      return this.table;
    }

    const db = this.db;

    if (!db) {
      throw new VectorStoreError('Vector database is not initialized');
    }

    try {
      // Check if table exists
      const tableNames = await db.tableNames();
      if (tableNames.includes(this.tableName)) {
        this.table = await db.openTable(this.tableName);
        serverLogger.info('Opened existing table', { tableName: this.tableName });
      } else {
        // Create table with first chunk to establish schema
        throw new VectorStoreError('Table does not exist. Call createTable() first.');
      }

      return this.table;
    } catch (error) {
      serverLogger.error('Failed to get table', error instanceof Error ? error : new Error(String(error)), {
        tableName: this.tableName,
      });
      throw error;
    }
  }

  /**
   * Create the chunks table with embedded chunks
   */
  async createTable(chunks: EmbeddedChunk[]): Promise<void> {
    if (chunks.length === 0) {
      throw new VectorStoreError('Cannot create table with empty chunks array');
    }

    const db = this.db;

    if (!db) {
      throw new VectorStoreError('Vector database is not initialized');
    }

    try {
      // Prepare data for LanceDB
      const tableData = chunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        embedding: normalizeEmbedding(chunk.embedding),
        sourceFile: chunk.metadata.sourceFile,
        category: chunk.metadata.category,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
        startChar: chunk.metadata.startChar,
        endChar: chunk.metadata.endChar,
        tags: chunk.metadata.tags.join(','), // Store as comma-separated string
        priority: chunk.metadata.priority,
        experienceIds: chunk.metadata.experienceIds?.join(',') || '', // Store as comma-separated string
      }));

      // Drop existing table if it exists
      const tableNames = await db.tableNames();
      if (tableNames.includes(this.tableName)) {
        await db.dropTable(this.tableName);
        serverLogger.info('Dropped existing table', { tableName: this.tableName });
      }

      // Create new table
      this.table = await db.createTable(this.tableName, tableData);
      
      serverLogger.info('Created vector table', {
        tableName: this.tableName,
        chunkCount: chunks.length,
        embeddingDimensions: chunks[0]?.embedding.length ?? 0,
      });
    } catch (error) {
      serverLogger.error('Failed to create table', error instanceof Error ? error : new Error(String(error)), {
        tableName: this.tableName,
        chunkCount: chunks.length,
      });
      throw new VectorStoreError('Failed to create vector table', {
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Search for similar chunks
   */
  async search(queryEmbedding: number[], options: SearchOptions = {}): Promise<SearchResult[]> {
    try {
      const table = await this.getTable();
      const topK = options.topK || RETRIEVAL_CONFIG.topKDefault;
      const minConfidence = options.minConfidence || RETRIEVAL_CONFIG.minConfidence;

      // Note: Gemini API returns normalized embeddings, so we skip normalization
      // to save computation time. If using a different embedding provider that doesn't
      // normalize, uncomment the line below:
      // const normalizedQuery = normalizeEmbedding(queryEmbedding);

      // Perform vector search (using query embedding directly)
      const results = (await table
        .search(queryEmbedding)
        .limit(Math.ceil(topK * 1.3)) // Get slightly more results for filtering (reduced from 2x)
        .toArray()) as LanceSearchRow[];

      // Convert results and apply filters
      const searchResults: SearchResult[] = [];

      serverLogger.info('Raw LanceDB search results', {
        totalResults: results.length,
        sampleResult: results[0] ? {
          hasDistance: '_distance' in results[0],
          distance: results[0]._distance,
          hasEmbedding: 'embedding' in results[0],
          category: results[0].category,
        } : null,
      });

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const parsedExperienceIds = result.experienceIds
          ? result.experienceIds.split(',').map(id => id.trim()).filter(Boolean)
          : [];

        // Apply category filter
        if (options.categoryFilter && options.categoryFilter.length > 0) {
          if (!options.categoryFilter.includes(result.category)) {
            continue;
          }
        }

        // Apply tag filter
        if (options.tagFilter && options.tagFilter.length > 0) {
          const resultTags = result.tags ? result.tags.split(',') : [];
          const hasMatchingTag = options.tagFilter.some(tag =>
            resultTags.some((resultTag: string) => resultTag.toLowerCase().includes(tag.toLowerCase()))
          );
          if (!hasMatchingTag) {
            continue;
          }
        }

        // Apply experienceId filter
        if (!matchesExperienceIdFilter(parsedExperienceIds, options.experienceIdFilter)) {
          continue;
        }

        // Calculate similarity score with improved calculation
        let score = 0;
        if (result._distance !== undefined) {
          // Improved similarity calculation: normalize distance and apply scaling
          // LanceDB distance ranges from 0 to 2, normalize to 0-1 range
          const normalizedDistance = Math.max(0, Math.min(1, result._distance / 2));
          // Apply exponential scaling to boost moderate similarities
          score = Math.max(0, Math.min(1, Math.exp(-normalizedDistance * 2) * (1 - normalizedDistance * 0.3)));
        } else if (result.embedding) {
          // Fallback to cosine similarity if embedding is available
          score = cosineSimilarity(queryEmbedding, result.embedding);
        }

        // Apply confidence threshold
        if (score < minConfidence) {
          continue;
        }

        // Reconstruct chunk object
        const chunk: EmbeddedChunk = {
          id: result.id,
          content: result.content,
          embedding: result.embedding || [], // Embedding might not be returned in search results
          metadata: {
            sourceFile: result.sourceFile,
            category: result.category,
            chunkIndex: result.chunkIndex,
            totalChunks: result.totalChunks,
            startChar: result.startChar,
            endChar: result.endChar,
            tags: result.tags ? result.tags.split(',') : [],
            priority: result.priority,
            experienceIds: parsedExperienceIds.length > 0 ? parsedExperienceIds : undefined,
          },
        };

        searchResults.push({
          chunk,
          score,
          rank: i + 1,
        });

        // Stop when we have enough results
        if (searchResults.length >= topK) {
          break;
        }
      }

      // Sort by score (highest first)
      searchResults.sort((a, b) => b.score - a.score);

      serverLogger.info('Vector search completed', {
        queryLength: queryEmbedding.length,
        resultsFound: searchResults.length,
        topScore: searchResults[0]?.score || 0,
        minConfidence,
      });

      return searchResults;
    } catch (error) {
      serverLogger.error('Vector search failed', error instanceof Error ? error : new Error(String(error)), {
        queryDimensions: queryEmbedding.length,
        options,
      });
      throw new VectorStoreError('Failed to perform vector search', {
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get table statistics
   */
  async getStats(): Promise<{ totalChunks: number; categories: Record<string, number> }> {
    try {
      const table = await this.getTable();

      // Use countRows() for total count
      const totalChunks = await table.countRows();

      let rows: Array<{ category?: string }> = [];

      if (typeof table.query === 'function') {
        const queryResults = await table
          .query()
          .select(['category'])
          .toArray();
        rows = queryResults as Array<{ category?: string }>;
      }

      if (rows.length === 0) {
        const tableWithToArray = table as Table & {
          toArray?: () => Promise<Array<Record<string, unknown>>>;
        };

        if (typeof tableWithToArray.toArray === 'function') {
          rows = (await tableWithToArray.toArray()) as Array<{ category?: string }>;
        }
      }

      const categories: Record<string, number> = {};

      for (const row of rows) {
        const category = (row?.category as string | undefined) || 'unknown';
        categories[category] = (categories[category] || 0) + 1;
      }

      return { totalChunks, categories };
    } catch (error) {
      serverLogger.error('Failed to get vector store stats', error instanceof Error ? error : new Error(String(error)));

      // Return basic stats if detailed stats fail
      return {
        totalChunks: 0,
        categories: {},
      };
    }
  }

  /**
   * Check if vector store is ready
   */
  async isReady(): Promise<boolean> {
    try {
      let db = this.db;
      if (!db) {
        await this.initialize();
        db = this.db;
      }

      if (!db) {
        return false;
      }

      const tableNames = await db.tableNames();
      const ready = tableNames.includes(this.tableName);

      serverLogger.info('Vector store ready check', {
        dbPath: this.dbPath,
        dbConnected: !!db,
        tableExists: ready,
        availableTables: tableNames,
      });

      return ready;
    } catch (error) {
      serverLogger.error('Vector store ready check failed', error instanceof Error ? error : new Error(String(error)), {
        dbPath: this.dbPath,
      });
      return false;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    try {
      if (this.db) {
        // LanceDB doesn't require explicit closing in the current version
        this.db = null;
        this.table = null;
        serverLogger.info('Closed vector database connection');
      }
    } catch (error) {
      serverLogger.warn('Error closing vector database', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Singleton instance
let vectorStoreInstance: VectorStore | null = null;

/**
 * Get the singleton vector store instance
 */
export function getVectorStore(): VectorStore {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStore();
  }
  return vectorStoreInstance;
}
