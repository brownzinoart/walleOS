import { config as loadEnv } from 'dotenv';

loadEnv();

type LogLevelOption = 'debug' | 'info' | 'warn' | 'error';

export interface ServerEnvConfig {
  ollamaHost: string;
  serverPort: number;
  frontendUrl: string;
  ollamaModel: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  logLevel: LogLevelOption;
  context7BaseUrl: string;
  context7ApiKey?: string;
  context7ClientIpKey?: string;
}

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseLogLevel = (value: string | undefined, fallback: LogLevelOption): LogLevelOption => {
  const allowed: LogLevelOption[] = ['debug', 'info', 'warn', 'error'];
  if (!value) return fallback;
  return allowed.includes(value as LogLevelOption) ? (value as LogLevelOption) : fallback;
};

const getString = (value: string | undefined, fallback: string): string => {
  return value && value.trim().length > 0 ? value : fallback;
};

const getOptionalString = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const context7ApiKey = getOptionalString(process.env['CONTEXT7_API_KEY']);
const context7ClientIpKey = getOptionalString(process.env['CONTEXT7_CLIENT_IP_KEY']);

const envConfig: ServerEnvConfig = {
  ollamaHost: getString(process.env['OLLAMA_HOST'], 'http://localhost:11434'),
  serverPort: parseNumber(process.env['SERVER_PORT'], 3001),
  frontendUrl: getString(process.env['FRONTEND_URL'], 'http://localhost:3000'),
  ollamaModel: getString(process.env['OLLAMA_MODEL'], 'llama3.1:8b-instruct'),
  rateLimitWindowMs: parseNumber(process.env['RATE_LIMIT_WINDOW_MS'], 900_000),
  rateLimitMaxRequests: parseNumber(process.env['RATE_LIMIT_MAX_REQUESTS'], 100),
  logLevel: parseLogLevel(process.env['LOG_LEVEL'], 'info'),
  context7BaseUrl: getString(process.env['CONTEXT7_API_BASE_URL'], 'https://context7.com/api'),
  ...(context7ApiKey ? { context7ApiKey } : {}),
  ...(context7ClientIpKey ? { context7ClientIpKey } : {}),
};

export default envConfig;
