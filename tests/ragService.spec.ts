import { describe, it, expect, vi } from 'vitest';

// Mock server-only modules to safely import ragService in browser-like env
vi.mock('../server/middleware/logger.js', () => ({
  serverLogger: {
    info: () => {},
    warn: () => {},
    error: () => {},
  },
}));
vi.mock('../server/services/embeddingService.js', () => ({
  generateEmbedding: async () => new Array(384).fill(0),
}));
vi.mock('../server/services/vectorStore.js', () => ({
  getVectorStore: () => ({
    isReady: async () => false,
  }),
}));

import { preprocessQuery, getCategoryPriorityMap } from '../server/services/ragService';

describe('ragService preprocessQuery', () => {
  it('skips expansion for long queries (>= 20 chars)', () => {
    const q = preprocessQuery('Tell me about Splash and DXA');
    // Long queries just get lowercased, no expansion for performance
    expect(q).toBe('tell me about splash and dxa');
  });

  it('expands short queries with known terms', () => {
    const q = preprocessQuery('ai');
    // Short queries get expanded
    expect(q).toMatch(/artificial intelligence/);
    expect(q).toMatch(/machine learning/);
  });

  it('expands weready for short queries', () => {
    const q = preprocessQuery('weready');
    expect(q).toMatch(/startup intelligence/);
    expect(q).toMatch(/readiness score/);
  });
});

describe('ragService category priority hint', () => {
  it('prefers narrative on home', () => {
    const map = getCategoryPriorityMap('home');
    expect(map.narrative).toBeGreaterThan(map.experience);
  });

  it('prefers experience on resume', () => {
    const map = getCategoryPriorityMap('resume');
    expect(map.experience).toBeGreaterThan(map.narrative);
  });
});

