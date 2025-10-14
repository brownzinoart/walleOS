import { createCipheriv, randomBytes } from 'node:crypto';
import config from '../config/env.js';
import { serverLogger } from '../middleware/logger.js';
import type {
  Context7DocumentationResult,
  Context7SearchResponse,
} from '../types/index.js';

const MINIMUM_TOKENS = 1000;
const DEFAULT_TOKENS = 5000;
const MAX_TOKENS = 20000;
const CONTEXT_TYPE = 'txt';

const baseUrl = config.context7BaseUrl.endsWith('/')
  ? config.context7BaseUrl
  : `${config.context7BaseUrl}/`;

const buildUrl = (path: string): URL => {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalized, baseUrl);
};

const isValidEncryptionKey = (value: string): boolean => /^[0-9a-fA-F]{64}$/.test(value);

const encryptClientIp = (clientIp: string): string => {
  const encryptionKey = config.context7ClientIpKey;

  if (!encryptionKey) {
    return clientIp;
  }

  if (!isValidEncryptionKey(encryptionKey)) {
    serverLogger.warn('Invalid Context7 client IP encryption key; falling back to plain IP header.');
    return clientIp;
  }

  try {
    const iv = randomBytes(16);
    const cipher = createCipheriv(
      'aes-256-cbc',
      Buffer.from(encryptionKey, 'hex'),
      iv,
    );

    let encrypted = cipher.update(clientIp, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    serverLogger.warn('Failed to encrypt client IP for Context7 headers', {
      error: error instanceof Error ? error.message : String(error),
    });
    return clientIp;
  }
};

const buildHeaders = (clientIp?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-Context7-Source': 'wallygpt-backend',
  };

  if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1') {
    headers['mcp-client-ip'] = encryptClientIp(clientIp);
  }

  if (config.context7ApiKey) {
    headers['Authorization'] = `Bearer ${config.context7ApiKey}`;
  }

  return headers;
};

export class Context7ServiceError extends Error {
  code: string;
  status?: number;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, status?: number, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    if (status !== undefined) {
      this.status = status;
    }
    if (details !== undefined) {
      this.details = details;
    }
  }
}

const handleErrorResponse = async (
  response: globalThis.Response,
  requestId: string | undefined,
  operation: 'search' | 'documentation',
): Promise<never> => {
  const status = response.status;
  const text = await response.text().catch(() => '');

  const baseDetails = {
    status,
    body: text,
    requestId,
  };

  if (status === 401) {
    throw new Context7ServiceError(
      'Context7 rejected the request. Verify that CONTEXT7_API_KEY is set and valid.',
      'CONTEXT7_UNAUTHORIZED',
      status,
      baseDetails,
    );
  }

  if (status === 404 && operation === 'documentation') {
    throw new Context7ServiceError(
      'Context7 could not find documentation for the requested library.',
      'CONTEXT7_NOT_FOUND',
      status,
      baseDetails,
    );
  }

  if (status === 429) {
    throw new Context7ServiceError(
      'Context7 rate limit exceeded. Try again later or configure an API key.',
      'CONTEXT7_RATE_LIMITED',
      status,
      baseDetails,
    );
  }

  throw new Context7ServiceError(
    `Context7 request failed with status ${status}.`,
    'CONTEXT7_REQUEST_FAILED',
    status,
    baseDetails,
  );
};

export const searchContext7Libraries = async (
  query: string,
  clientIp: string | undefined,
  requestId?: string,
): Promise<Context7SearchResponse> => {
  const url = buildUrl('/v1/search');
  url.searchParams.set('query', query);

  try {
    const response = await fetch(url, {
      headers: buildHeaders(clientIp),
    });

    if (!response.ok) {
      await handleErrorResponse(response, requestId, 'search');
    }

    const payload = (await response.json()) as Context7SearchResponse;
    const results = Array.isArray(payload.results) ? payload.results : [];

    return payload.error
      ? { results, error: payload.error }
      : { results };
  } catch (error) {
    serverLogger.error(
      'Failed to query Context7 search API',
      error instanceof Error ? error : new Error(String(error)),
      { requestId, query },
    );

    if (error instanceof Context7ServiceError) {
      throw error;
    }

    throw new Context7ServiceError(
      'Unexpected error when contacting Context7 search API.',
      'CONTEXT7_SEARCH_ERROR',
      undefined,
      { requestId },
    );
  }
};

export interface Context7DocumentationOptions {
  tokens?: number;
  topic?: string;
}

export const fetchContext7Documentation = async (
  libraryId: string,
  options: Context7DocumentationOptions = {},
  clientIp?: string,
  requestId?: string,
): Promise<Context7DocumentationResult> => {
  const normalizedId = libraryId.replace(/^\//, '');

  const requestedTokens = options.tokens;
  const boundedTokens =
    requestedTokens === undefined
      ? DEFAULT_TOKENS
      : Math.min(Math.max(requestedTokens, MINIMUM_TOKENS), MAX_TOKENS);

  const url = buildUrl(`/v1/${normalizedId}`);
  url.searchParams.set('type', CONTEXT_TYPE);
  url.searchParams.set('tokens', boundedTokens.toString());
  if (options.topic) {
    url.searchParams.set('topic', options.topic);
  }

  try {
    const response = await fetch(url, {
      headers: buildHeaders(clientIp),
    });

    if (!response.ok) {
      await handleErrorResponse(response, requestId, 'documentation');
    }

    const text = await response.text();
    const content = text && text !== 'No content available' && text !== 'No context data available' ? text : null;

    return {
      libraryId: normalizedId,
      content,
    };
  } catch (error) {
    serverLogger.error(
      'Failed to fetch Context7 documentation',
      error instanceof Error ? error : new Error(String(error)),
      { requestId, libraryId: normalizedId },
    );

    if (error instanceof Context7ServiceError) {
      throw error;
    }

    throw new Context7ServiceError(
      'Unexpected error when contacting Context7 documentation API.',
      'CONTEXT7_DOCUMENTATION_ERROR',
      undefined,
      { requestId },
    );
  }
};
