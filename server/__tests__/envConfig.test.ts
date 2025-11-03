import { describe, expect, it } from 'vitest';

import { createServerEnvConfig } from '../config/env.js';

describe('createServerEnvConfig', () => {
  const baseEnv = {
    FRONTEND_URL: 'https://portfolio.example.com',
    LLM_PRIMARY_PROVIDER: 'anthropic',
    LLM_FALLBACK_PROVIDER: 'openai',
    LLM_TERTIARY_PROVIDER: 'gemini',
  } satisfies Partial<NodeJS.ProcessEnv>;

  it('throws when an invalid log level is provided', () => {
    expect(() =>
      createServerEnvConfig({
        ...baseEnv,
        LOG_LEVEL: 'verbose',
      }),
    ).toThrowError(/LOG_LEVEL/i);
  });

  it('parses required values and strips blank optional secrets', () => {
    const config = createServerEnvConfig({
      ...baseEnv,
      SERVER_PORT: '4100',
      CONTEXT7_API_KEY: '   ',
      GEMINI_API_KEY: 'gem-123',
      RATE_LIMIT_WINDOW_MS: '120000',
    });

    expect(config.serverPort).toBe(4100);
    expect(config.geminiApiKey).toBe('gem-123');
    expect(config.context7ApiKey).toBeUndefined();
    expect(config.rateLimitWindowMs).toBe(120000);
  });

  it('enforces supported provider values', () => {
    expect(() =>
      createServerEnvConfig({
        ...baseEnv,
        LLM_PRIMARY_PROVIDER: 'unsupported',
      }),
    ).toThrowError(/LLM_PRIMARY_PROVIDER/i);
  });
});
