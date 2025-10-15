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
  it('expands domain synonyms for Splash/DXA', () => {
    const q = preprocessQuery('Tell me about Splash and DXA');
    expect(q).toMatch(/design system/);
    expect(q).toMatch(/audit/);
  });

  it('expands ventures (WeReady/ListingPal) terms', () => {
    const q = preprocessQuery('What is ListingPal vs WeReady?');
    expect(q).toMatch(/agentselect/);
    expect(q).toMatch(/investment readiness/);
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

