import { config as loadEnv } from 'dotenv';

loadEnv();

type LogLevelOption = 'debug' | 'info' | 'warn' | 'error';

type ProviderOption = 'anthropic' | 'openai' | 'gemini' | 'glm';

export interface ServerEnvConfig {
  serverPort: number;
  frontendUrl: string;
  glmApiKey?: string;
  glmChatModel: string;
  geminiApiKey?: string;
  geminiChatModel: string;
  geminiEmbedModel: string;
  openaiApiKey?: string;
  openaiChatModel: string;
  anthropicApiKey?: string;
  anthropicChatModel: string;
  llmPrimaryProvider: ProviderOption;
  llmFallbackProvider: ProviderOption;
  llmTertiaryProvider: ProviderOption;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  logLevel: LogLevelOption;
  context7BaseUrl: string;
  context7ApiKey?: string;
  context7ClientIpKey?: string;
}

const LOG_LEVELS: LogLevelOption[] = ['debug', 'info', 'warn', 'error'];
const PROVIDERS: ProviderOption[] = ['anthropic', 'openai', 'gemini', 'glm'];

const defaultValues = {
  FRONTEND_URL: 'http://localhost:3000',
  SERVER_PORT: 3001,
  GLM_CHAT_MODEL: 'glm-4.6',
  GEMINI_CHAT_MODEL: 'gemini-2.0-flash',
  GEMINI_EMBED_MODEL: 'text-embedding-004',
  OPENAI_CHAT_MODEL: 'gpt-4o-mini',
  ANTHROPIC_CHAT_MODEL: 'claude-sonnet-4-20250514',
  LLM_PRIMARY_PROVIDER: 'anthropic' as ProviderOption,
  LLM_FALLBACK_PROVIDER: 'openai' as ProviderOption,
  LLM_TERTIARY_PROVIDER: 'gemini' as ProviderOption,
  RATE_LIMIT_WINDOW_MS: 900_000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  LOG_LEVEL: 'info' as LogLevelOption,
  CONTEXT7_API_BASE_URL: 'https://context7.com/api',
};

const trimOrUndefined = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const parseInteger = (
  value: string | undefined,
  fallback: number,
  field: string,
): number => {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${field}: must be an integer`);
  }

  return parsed;
};

const parseLogLevel = (value: string | undefined): LogLevelOption => {
  if (!value) {
    return defaultValues.LOG_LEVEL;
  }

  const normalized = value.trim().toLowerCase();
  if (!LOG_LEVELS.includes(normalized as LogLevelOption)) {
    throw new Error(
      `Invalid LOG_LEVEL: expected one of ${LOG_LEVELS.join(', ')}`,
    );
  }

  return normalized as LogLevelOption;
};

const parseProvider = (
  value: string | undefined,
  field: 'LLM_PRIMARY_PROVIDER' | 'LLM_FALLBACK_PROVIDER' | 'LLM_TERTIARY_PROVIDER',
  fallback: ProviderOption,
): ProviderOption => {
  const candidate = (value ?? fallback).trim().toLowerCase();

  if (!PROVIDERS.includes(candidate as ProviderOption)) {
    throw new Error(
      `Invalid ${field}: expected one of ${PROVIDERS.join(', ')}`,
    );
  }

  return candidate as ProviderOption;
};

const parseUrl = (value: string | undefined, fallback: string, field: string): string => {
  const candidate = value && value.trim().length > 0 ? value.trim() : fallback;
  try {
    // eslint-disable-next-line no-new
    new URL(candidate);
    return candidate;
  } catch {
    throw new Error(`Invalid ${field}: must be a valid URL`);
  }
};

export function createServerEnvConfig(rawEnv: NodeJS.ProcessEnv = process.env): ServerEnvConfig {
  const context7ApiKey = trimOrUndefined(rawEnv['CONTEXT7_API_KEY']);
  const context7ClientIpKey = trimOrUndefined(rawEnv['CONTEXT7_CLIENT_IP_KEY']);
  const glmApiKey = trimOrUndefined(rawEnv['GLM_API_KEY']);
  const geminiApiKey = trimOrUndefined(rawEnv['GEMINI_API_KEY']);
  const openaiApiKey = trimOrUndefined(rawEnv['OPENAI_API_KEY']);
  const anthropicApiKey = trimOrUndefined(rawEnv['ANTHROPIC_API_KEY']);

  return {
    serverPort: parseInteger(
      rawEnv['SERVER_PORT'],
      defaultValues.SERVER_PORT,
      'SERVER_PORT',
    ),
    frontendUrl: parseUrl(
      rawEnv['FRONTEND_URL'],
      defaultValues.FRONTEND_URL,
      'FRONTEND_URL',
    ),
    glmChatModel: (rawEnv['GLM_CHAT_MODEL'] || defaultValues.GLM_CHAT_MODEL).trim(),
    geminiChatModel: (rawEnv['GEMINI_CHAT_MODEL'] || defaultValues.GEMINI_CHAT_MODEL).trim(),
    geminiEmbedModel: (rawEnv['GEMINI_EMBED_MODEL'] || defaultValues.GEMINI_EMBED_MODEL).trim(),
    openaiChatModel: (rawEnv['OPENAI_CHAT_MODEL'] || defaultValues.OPENAI_CHAT_MODEL).trim(),
    anthropicChatModel: (rawEnv['ANTHROPIC_CHAT_MODEL'] || defaultValues.ANTHROPIC_CHAT_MODEL).trim(),
    llmPrimaryProvider: parseProvider(
      rawEnv['LLM_PRIMARY_PROVIDER'],
      'LLM_PRIMARY_PROVIDER',
      defaultValues.LLM_PRIMARY_PROVIDER,
    ),
    llmFallbackProvider: parseProvider(
      rawEnv['LLM_FALLBACK_PROVIDER'],
      'LLM_FALLBACK_PROVIDER',
      defaultValues.LLM_FALLBACK_PROVIDER,
    ),
    llmTertiaryProvider: parseProvider(
      rawEnv['LLM_TERTIARY_PROVIDER'],
      'LLM_TERTIARY_PROVIDER',
      defaultValues.LLM_TERTIARY_PROVIDER,
    ),
    rateLimitWindowMs: parseInteger(
      rawEnv['RATE_LIMIT_WINDOW_MS'],
      defaultValues.RATE_LIMIT_WINDOW_MS,
      'RATE_LIMIT_WINDOW_MS',
    ),
    rateLimitMaxRequests: parseInteger(
      rawEnv['RATE_LIMIT_MAX_REQUESTS'],
      defaultValues.RATE_LIMIT_MAX_REQUESTS,
      'RATE_LIMIT_MAX_REQUESTS',
    ),
    logLevel: parseLogLevel(rawEnv['LOG_LEVEL']),
    context7BaseUrl: parseUrl(
      rawEnv['CONTEXT7_API_BASE_URL'],
      defaultValues.CONTEXT7_API_BASE_URL,
      'CONTEXT7_API_BASE_URL',
    ),
    ...(context7ApiKey ? { context7ApiKey } : {}),
    ...(context7ClientIpKey ? { context7ClientIpKey } : {}),
    ...(glmApiKey ? { glmApiKey } : {}),
    ...(geminiApiKey ? { geminiApiKey } : {}),
    ...(openaiApiKey ? { openaiApiKey } : {}),
    ...(anthropicApiKey ? { anthropicApiKey } : {}),
  };
}

const envConfig = createServerEnvConfig();

export default envConfig;
