import { describe, expect, it } from 'vitest';
import { preprocessQuery } from '../services/ragService.js';

describe('ragService preprocessQuery', () => {
  it('returns original text for longer queries', () => {
    const query = 'Give me the full narrative about WalleOS architecture';
    expect(preprocessQuery(query)).toBe(query.toLowerCase());
  });

  it('performs synonym expansion for short tokens', () => {
    expect(preprocessQuery('AI summary')).toMatch(/artificial intelligence/);
    expect(preprocessQuery('ml use cases')).toMatch(/machine learning/);
  });
});
