import { readFileSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { serverLogger } from '../middleware/logger.js';
import matter from 'gray-matter';
import { CATEGORY_PRIORITY_BASE } from '../config/ragSchema.js';

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
    experienceIds?: string[];
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

interface ChunkConfig {
  maxTokens: number;
  minTokens: number;
  overlap: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const parseConfigNumber = (value: string | undefined, fallback: number, min: number, max: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
};

const resolveChunkConfig = (): ChunkConfig => {
  const maxTokens = parseConfigNumber(process.env['RAG_CHUNK_MAX_TOKENS'], 640, 240, 1200);
  const minTokens = parseConfigNumber(
    process.env['RAG_CHUNK_MIN_TOKENS'],
    160,
    60,
    Math.max(maxTokens - 40, 80),
  );
  const overlap = parseConfigNumber(
    process.env['RAG_CHUNK_OVERLAP_TOKENS'],
    80,
    0,
    Math.floor(maxTokens / 2),
  );

  return {
    maxTokens,
    minTokens,
    overlap,
  };
};

const CHUNK_CONFIG = resolveChunkConfig();

serverLogger.info('Using RAG chunk configuration', {
  maxTokens: CHUNK_CONFIG.maxTokens,
  minTokens: CHUNK_CONFIG.minTokens,
  overlap: CHUNK_CONFIG.overlap,
});

/**
 * Rough token estimation (1 token ≈ 4 characters for English text)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface SentenceSegment {
  content: string;
  start: number;
  end: number;
  tokens: number;
}

const sentencePattern = /[^.!?]+(?:[.!?]+|\n+|$)/g;

function segmentText(text: string): SentenceSegment[] {
  const segments: SentenceSegment[] = [];

  for (const match of text.matchAll(sentencePattern)) {
    const raw = match[0] ?? '';
    if (!raw.trim()) {
      continue;
    }

    const absoluteStart = match.index ?? 0;
    const absoluteEnd = absoluteStart + raw.length;

    const leadingWhitespace = raw.match(/^\s+/)?.[0]?.length ?? 0;
    const trailingWhitespace = raw.match(/\s+$/)?.[0]?.length ?? 0;

    const start = absoluteStart + leadingWhitespace;
    const end = absoluteEnd - trailingWhitespace;

    if (end <= start) {
      continue;
    }

    const content = text.slice(start, end);
    segments.push({
      content,
      start,
      end,
      tokens: estimateTokens(content),
    });
  }

  if (segments.length === 0) {
    const trimmed = text.trim();
    if (!trimmed) {
      return [];
    }
    const start = text.indexOf(trimmed);
    const end = start + trimmed.length;
    return [{ content: trimmed, start, end, tokens: estimateTokens(trimmed) }];
  }

  return segments;
}

const splitSegmentByTokens = (
  segment: SentenceSegment,
  fullText: string,
  maxTokens: number,
): SentenceSegment[] => {
  if (segment.tokens <= maxTokens) {
    return [segment];
  }

  const approxMaxChars = Math.max(1, Math.floor(maxTokens * 4));
  const slices: SentenceSegment[] = [];
  let cursor = segment.start;

  while (cursor < segment.end) {
    const tentativeEnd = Math.min(segment.end, cursor + approxMaxChars);
    let sliceEnd = tentativeEnd;

    if (tentativeEnd < segment.end) {
      const backtrack = fullText.lastIndexOf(' ', tentativeEnd);
      if (backtrack > cursor + Math.floor(approxMaxChars * 0.5)) {
        sliceEnd = backtrack;
      }
    }

    const segmentSlice = fullText.slice(cursor, sliceEnd);
    const trimmed = segmentSlice.trim();

    if (!trimmed) {
      cursor = sliceEnd;
      continue;
    }

    const leading = segmentSlice.indexOf(trimmed);
    const actualStart = cursor + leading;
    const actualEnd = actualStart + trimmed.length;

    slices.push({
      content: trimmed,
      start: actualStart,
      end: actualEnd,
      tokens: estimateTokens(trimmed),
    });

    cursor = actualEnd;
  }

  return slices;
};

function inferCategoryFromFilename(filename: string): string {
  const lowerFilename = filename.toLowerCase();

  if (lowerFilename.includes('voice') || lowerFilename.includes('narrative')) {
    return 'narrative';
  }
  if (lowerFilename.includes('portfolio')) {
    return 'portfolio';
  }
  if (lowerFilename.includes('experience')) {
    return 'experience';
  }
  if (lowerFilename.includes('skills') || lowerFilename.includes('tools')) {
    return 'skills';
  }
  if (lowerFilename.includes('faq')) {
    return 'faq';
  }
  if (lowerFilename.includes('fun') || lowerFilename.includes('facts')) {
    return 'funfacts';
  }
  if (lowerFilename.includes('metrics') || lowerFilename.includes('awards')) {
    return 'metrics';
  }

  return 'general';
}

/**
 * Extract metadata from markdown frontmatter and filename
 */
function extractMetadata(content: string, filename: string): {
  category: string;
  tags: string[];
  experienceIds: string[];
  cleanContent: string;
} {
  const { data, content: body } = matter(content);
  const frontmatter = data as Record<string, unknown>;

  const frontmatterCategory = typeof frontmatter.category === 'string' ? frontmatter.category.trim() : '';
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map(tag => String(tag).trim()).filter(Boolean)
    : [];
  const experienceIds = Array.isArray(frontmatter.experienceIds)
    ? frontmatter.experienceIds.map(id => String(id).trim()).filter(Boolean)
    : [];

  const category = frontmatterCategory || inferCategoryFromFilename(filename);
  const cleanContent = body;

  return { category, tags, experienceIds, cleanContent };
}


/**
 * Split text into chunks with overlap
 */
function createChunks(text: string, metadata: { category: string; tags: string[]; experienceIds: string[] }): DocumentChunk[] {
  const baseSegments = segmentText(text);
  const segments = baseSegments.flatMap((segment) =>
    splitSegmentByTokens(segment, text, CHUNK_CONFIG.maxTokens),
  );
  if (segments.length === 0) {
    return [];
  }

  const chunks: DocumentChunk[] = [];
  let currentSegments: SentenceSegment[] = [];
  let currentTokens = 0;
  let chunkIndex = 0;

  const flushCurrentChunk = (force = false): SentenceSegment[] => {
    if (currentSegments.length === 0) {
      return [];
    }

    const tokenCount = currentSegments.reduce((sum, seg) => sum + seg.tokens, 0);
    if (!force && tokenCount < CHUNK_CONFIG.minTokens) {
      return [];
    }

    const chunkStart = currentSegments[0].start;
    const chunkEnd = currentSegments[currentSegments.length - 1].end;
    const chunkContent = text.slice(chunkStart, chunkEnd).trim();

    if (!chunkContent) {
      return [];
    }

    const flushedSegments = currentSegments.slice();

    chunks.push({
      id: uuidv4(),
      content: chunkContent,
      metadata: {
        sourceFile: '',
        category: metadata.category,
        chunkIndex,
        totalChunks: 0, // updated later
        startChar: chunkStart,
        endChar: chunkEnd,
        tags: metadata.tags,
        priority: CATEGORY_PRIORITY_BASE[metadata.category] || 0.5,
        experienceIds: metadata.experienceIds.length > 0 ? metadata.experienceIds : undefined,
      },
    });

    chunkIndex++;
    currentSegments = [];
    currentTokens = 0;

    return flushedSegments;
  };

  for (const segment of segments) {
    const willExceed =
      currentSegments.length > 0 && currentTokens + segment.tokens > CHUNK_CONFIG.maxTokens;

    if (willExceed) {
      const meetsMinThreshold = currentTokens >= CHUNK_CONFIG.minTokens;
      const flushed = meetsMinThreshold ? flushCurrentChunk() : flushCurrentChunk(true);

      if (CHUNK_CONFIG.overlap > 0 && flushed.length > 0 && meetsMinThreshold) {
        let overlapTokens = 0;
        const overlapped: SentenceSegment[] = [];

        for (let i = flushed.length - 1; i >= 0; i--) {
          const candidate = flushed[i];
          if (overlapTokens + candidate.tokens > CHUNK_CONFIG.overlap) {
            break;
          }
          overlapped.unshift(candidate);
          overlapTokens += candidate.tokens;
        }

        currentSegments = overlapped.slice();
        currentTokens = overlapTokens;
      } else if (!meetsMinThreshold) {
        currentSegments = [];
        currentTokens = 0;
      }
    }

    currentSegments.push(segment);
    currentTokens += segment.tokens;
  }

  if (currentSegments.length > 0) {
    // Force flush the final chunk even if it is under the minimum token threshold
    flushCurrentChunk(true);
  }

  if (chunks.length === 0) {
    const fallbackContent = text.trim();
    if (fallbackContent) {
      chunks.push({
        id: uuidv4(),
        content: fallbackContent,
        metadata: {
          sourceFile: '',
          category: metadata.category,
          chunkIndex: 0,
          totalChunks: 1,
          startChar: text.indexOf(fallbackContent),
          endChar: text.indexOf(fallbackContent) + fallbackContent.length,
          tags: metadata.tags,
          priority: CATEGORY_PRIORITY_BASE[metadata.category] || 0.5,
          experienceIds: metadata.experienceIds.length > 0 ? metadata.experienceIds : undefined,
        },
      });
    }
  }

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
    const filename = basename(filePath);

    const { category, tags, experienceIds, cleanContent } = extractMetadata(content, filename);
    const chunks = createChunks(cleanContent, { category, tags, experienceIds });

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
 * Process all markdown files in the corpus directory (non-recursive)
 * @deprecated Use processCorpusDirectoryRecursive() instead for full coverage.
 * This function is maintained for backward compatibility but may miss files in subdirectories.
 */
export function processCorpusDirectory(corpusPath: string): ProcessedDocument[] {
  serverLogger.warn('processCorpusDirectory is deprecated. Use processCorpusDirectoryRecursive() for full coverage.', {
    corpusPath,
  });
  return processCorpusDirectoryRecursive(corpusPath, false);
}

/**
 * Process all markdown files in the corpus directory recursively
 */
export function processCorpusDirectoryRecursive(corpusPath: string, recursive = true): ProcessedDocument[] {
  const documents: ProcessedDocument[] = [];

  try {
    const entries = readdirSync(corpusPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(corpusPath, entry.name);

      if (entry.isDirectory() && recursive) {
        // Recursively process subdirectories
        const subDocs = processCorpusDirectoryRecursive(fullPath, recursive);
        documents.push(...subDocs);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
        // Process markdown file
        try {
          const document = processDocument(fullPath);
          documents.push(document);
          serverLogger.info('Processed document', {
            filename: entry.name,
            directory: corpusPath,
            category: document.category,
            chunks: document.chunks.length,
            tokens: document.totalTokens,
          });
        } catch (error) {
          serverLogger.warn('Failed to process document', {
            filename: entry.name,
            directory: corpusPath,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return documents;
  } catch (error) {
    serverLogger.error('Failed to process directory', error instanceof Error ? error : new Error(String(error)), {
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
