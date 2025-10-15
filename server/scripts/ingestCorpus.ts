#!/usr/bin/env tsx

import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { processCorpusDirectory, getAllChunks } from '../services/documentProcessor.js';
import { embedChunks, checkEmbeddingServiceHealth } from '../services/embeddingService.js';
import { getVectorStore } from '../services/vectorStore.js';
import { serverLogger } from '../middleware/logger.js';

// Default corpus path relative to project root
const DEFAULT_CORPUS_PATH = join(process.cwd(), '..', 'wallymo_llm_corpus');
const DATA_DIR = join(process.cwd(), 'server', 'data');

interface IngestionOptions {
  corpusPath?: string;
  force?: boolean; // Force re-ingestion even if vector store exists
  dryRun?: boolean; // Process documents but don't create vector store
}

/**
 * Ensure data directory exists
 */
function ensureDataDirectory(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    serverLogger.info('Created data directory', { path: DATA_DIR });
  }
}

/**
 * Validate corpus directory
 */
async function validateCorpusPath(corpusPath: string): Promise<void> {
  if (!existsSync(corpusPath)) {
    throw new Error(`Corpus directory does not exist: ${corpusPath}`);
  }

  // Check for markdown files
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(corpusPath);
  const markdownFiles = files.filter((file: string) => file.endsWith('.md'));
  
  if (markdownFiles.length === 0) {
    throw new Error(`No markdown files found in corpus directory: ${corpusPath}`);
  }

  serverLogger.info('Validated corpus directory', {
    path: corpusPath,
    markdownFiles: markdownFiles.length,
    files: markdownFiles,
  });
}

/**
 * Main ingestion function
 */
async function ingestCorpus(options: IngestionOptions = {}): Promise<void> {
  const startTime = Date.now();
  const corpusPath = options.corpusPath || DEFAULT_CORPUS_PATH;

  try {
    serverLogger.info('Starting corpus ingestion', {
      corpusPath,
      options,
    });

    // Validate inputs
    await validateCorpusPath(corpusPath);
    ensureDataDirectory();

    // Check embedding service health
    serverLogger.info('Checking embedding service health...');
    const embeddingHealth = await checkEmbeddingServiceHealth();
    if (!embeddingHealth.healthy) {
      throw new Error('Embedding service is not available. Please ensure Ollama is running with nomic-embed-text model.');
    }
    serverLogger.info('Embedding service is healthy', { model: embeddingHealth.model });

    // Initialize vector store
    const vectorStore = getVectorStore();
    await vectorStore.initialize();

    // Check if vector store already exists
    const isReady = await vectorStore.isReady();
    if (isReady && !options.force) {
      const stats = await vectorStore.getStats();
      serverLogger.info('Vector store already exists', stats);
      
      if (!options.dryRun) {
        console.log('Vector store already exists. Use --force to re-ingest.');
        return;
      }
    }

    // Step 1: Process documents into chunks
    serverLogger.info('Processing documents...');
    const documents = processCorpusDirectory(corpusPath);
    const allChunks = getAllChunks(documents);

    serverLogger.info('Document processing completed', {
      documentsProcessed: documents.length,
      totalChunks: allChunks.length,
      totalTokens: documents.reduce((sum, doc) => sum + doc.totalTokens, 0),
    });

    // Log document summary
    for (const doc of documents) {
      serverLogger.info('Document processed', {
        filename: doc.filename,
        category: doc.category,
        chunks: doc.chunks.length,
        tokens: doc.totalTokens,
        tags: doc.tags,
      });
    }

    if (options.dryRun) {
      serverLogger.info('Dry run completed - no vector store created');
      return;
    }

    // Step 2: Generate embeddings
    serverLogger.info('Generating embeddings...');
    const embeddedChunks = await embedChunks(allChunks);

    serverLogger.info('Embedding generation completed', {
      chunksEmbedded: embeddedChunks.length,
      embeddingDimensions: embeddedChunks[0]?.embedding.length || 0,
    });

    // Step 3: Create vector store
    serverLogger.info('Creating vector store...');
    await vectorStore.createTable(embeddedChunks);

    // Verify vector store
    const finalStats = await vectorStore.getStats();
    serverLogger.info('Vector store created successfully', finalStats);

    const totalTime = Date.now() - startTime;
    serverLogger.info('Corpus ingestion completed', {
      totalTimeMs: totalTime,
      totalTimeSec: Math.round(totalTime / 1000),
      documentsProcessed: documents.length,
      chunksIndexed: embeddedChunks.length,
    });

    console.log('\n✅ Corpus ingestion completed successfully!');
    console.log(`📊 Processed ${documents.length} documents into ${embeddedChunks.length} chunks`);
    console.log(`⏱️  Total time: ${Math.round(totalTime / 1000)}s`);
    console.log(`📁 Vector store location: ${vectorStore['dbPath']}`);

  } catch (error) {
    const totalTime = Date.now() - startTime;
    serverLogger.error('Corpus ingestion failed', error instanceof Error ? error : new Error(String(error)), {
      totalTimeMs: totalTime,
      corpusPath,
    });

    console.error('\n❌ Corpus ingestion failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * CLI interface
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options: IngestionOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--corpus-path' && i + 1 < args.length) {
      options.corpusPath = args[i + 1] as string;
      i++; // Skip next argument
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx ingestCorpus.ts [options]

Options:
  --corpus-path <path>  Path to corpus directory (default: ./wallymo_llm_corpus)
  --force              Force re-ingestion even if vector store exists
  --dry-run            Process documents but don't create vector store
  --help, -h           Show this help message

Examples:
  tsx ingestCorpus.ts
  tsx ingestCorpus.ts --corpus-path /path/to/corpus
  tsx ingestCorpus.ts --force
  tsx ingestCorpus.ts --dry-run
      `);
      process.exit(0);
    }
  }

  await ingestCorpus(options);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ingestCorpus };
