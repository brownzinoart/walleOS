import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { serverLogger } from '../middleware/logger.js';

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    sourceFile: string;
    category: string;
    chunkIndex: number;
    totalChunks: number;
    startChar: number;
    endChar: number;
    tags: string[];
    priority: number;
  };
}

export interface ProcessedDocument {
  id: string;
  filename: string;
  category: string;
  tags: string[];
  chunks: DocumentChunk[];
  totalTokens: number;
}

// Configuration from RAG schema (adjusted for shorter documents)
const CHUNK_CONFIG = {
  maxTokens: 900,
  minTokens: 150, // Reduced from 300 to capture shorter documents
  overlap: 50,
};

// Category priority mapping from schema
const CATEGORY_PRIORITY: Record<string, number> = {
  narrative: 1.0,
  portfolio: 0.95,
  experience: 0.9,
  skills: 0.85,
  faq: 0.8,
  funfacts: 0.7,
  metrics: 0.7,
};

/**
 * Rough token estimation (1 token ≈ 4 characters for English text)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Extract metadata from markdown frontmatter and filename
 */
function extractMetadata(content: string, filename: string): {
  category: string;
  tags: string[];
  cleanContent: string;
} {
  let cleanContent = content;
  let category = 'general';
  let tags: string[] = [];

  // Extract frontmatter if present
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    cleanContent = frontmatterMatch[2];

    // Parse simple YAML-like frontmatter
    const lines = frontmatter.split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      if (key?.trim() === 'tags' && value) {
        // Parse array-like tags: [tag1, tag2, tag3]
        const tagMatch = value.match(/\[(.*?)\]/);
        if (tagMatch) {
          tags = tagMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
        }
      }
    }
  }

  // Infer category from filename
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes('voice') || lowerFilename.includes('narrative')) {
    category = 'narrative';
  } else if (lowerFilename.includes('portfolio')) {
    category = 'portfolio';
  } else if (lowerFilename.includes('experience')) {
    category = 'experience';
  } else if (lowerFilename.includes('skills') || lowerFilename.includes('tools')) {
    category = 'skills';
  } else if (lowerFilename.includes('faq')) {
    category = 'faq';
  } else if (lowerFilename.includes('fun') || lowerFilename.includes('facts')) {
    category = 'funfacts';
  } else if (lowerFilename.includes('metrics') || lowerFilename.includes('awards')) {
    category = 'metrics';
  }

  return { category, tags, cleanContent };
}

/**
 * Split text into chunks with overlap
 */
function createChunks(text: string, metadata: { category: string; tags: string[] }): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = 0;
  let startChar = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceTokens = estimateTokens(sentence);
    
    // If adding this sentence would exceed max tokens, finalize current chunk
    if (currentTokens + sentenceTokens > CHUNK_CONFIG.maxTokens && currentChunk.length > 0) {
      // Only create chunk if it meets minimum token requirement
      if (currentTokens >= CHUNK_CONFIG.minTokens) {
        chunks.push({
          id: uuidv4(),
          content: currentChunk.trim(),
          metadata: {
            sourceFile: '',
            category: metadata.category,
            chunkIndex,
            totalChunks: 0, // Will be updated later
            startChar,
            endChar: startChar + currentChunk.length,
            tags: metadata.tags,
            priority: CATEGORY_PRIORITY[metadata.category] || 0.5,
          },
        });
        chunkIndex++;
      }

      // Start new chunk with overlap
      const overlapTokens = Math.min(CHUNK_CONFIG.overlap, currentTokens);
      if (overlapTokens > 0) {
        // Find sentences that fit within overlap token limit
        let overlapText = '';
        let overlapCount = 0;
        for (let j = sentences.length - 1; j >= 0 && overlapCount < overlapTokens; j--) {
          const prevSentence = sentences[j];
          const prevTokens = estimateTokens(prevSentence);
          if (overlapCount + prevTokens <= overlapTokens) {
            overlapText = prevSentence + ' ' + overlapText;
            overlapCount += prevTokens;
          } else {
            break;
          }
        }
        currentChunk = overlapText;
        currentTokens = overlapCount;
      } else {
        currentChunk = '';
        currentTokens = 0;
      }
      
      startChar = startChar + currentChunk.length;
    }

    currentChunk += (currentChunk ? ' ' : '') + sentence;
    currentTokens += sentenceTokens;
  }

  // Add final chunk if it has content
  if (currentChunk.trim() && currentTokens >= CHUNK_CONFIG.minTokens) {
    chunks.push({
      id: uuidv4(),
      content: currentChunk.trim(),
      metadata: {
        sourceFile: '',
        category: metadata.category,
        chunkIndex,
        totalChunks: 0,
        startChar,
        endChar: startChar + currentChunk.length,
        tags: metadata.tags,
        priority: CATEGORY_PRIORITY[metadata.category] || 0.5,
      },
    });
  }

  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length;
  });

  return chunks;
}

/**
 * Process a single markdown file into chunks
 */
export function processDocument(filePath: string): ProcessedDocument {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const filename = filePath.split('/').pop() || '';
    
    const { category, tags, cleanContent } = extractMetadata(content, filename);
    const chunks = createChunks(cleanContent, { category, tags });
    
    // Update chunk metadata with source file
    chunks.forEach(chunk => {
      chunk.metadata.sourceFile = filename;
    });

    const totalTokens = chunks.reduce((sum, chunk) => sum + estimateTokens(chunk.content), 0);

    return {
      id: uuidv4(),
      filename,
      category,
      tags,
      chunks,
      totalTokens,
    };
  } catch (error) {
    serverLogger.error('Failed to process document', error instanceof Error ? error : new Error(String(error)), {
      filePath,
    });
    throw error;
  }
}

/**
 * Process all markdown files in the corpus directory
 */
export function processCorpusDirectory(corpusPath: string): ProcessedDocument[] {
  try {
    const files = readdirSync(corpusPath);
    const markdownFiles = files.filter(file => extname(file).toLowerCase() === '.md');
    
    const documents: ProcessedDocument[] = [];
    
    for (const file of markdownFiles) {
      const filePath = join(corpusPath, file);
      try {
        const document = processDocument(filePath);
        documents.push(document);
        serverLogger.info('Processed document', {
          filename: file,
          category: document.category,
          chunks: document.chunks.length,
          tokens: document.totalTokens,
        });
      } catch (error) {
        serverLogger.warn('Failed to process document', {
          filename: file,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return documents;
  } catch (error) {
    serverLogger.error('Failed to process corpus directory', error instanceof Error ? error : new Error(String(error)), {
      corpusPath,
    });
    throw error;
  }
}

/**
 * Get all chunks from processed documents
 */
export function getAllChunks(documents: ProcessedDocument[]): DocumentChunk[] {
  return documents.flatMap(doc => doc.chunks);
}
