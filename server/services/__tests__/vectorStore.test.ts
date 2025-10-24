import { describe, expect, it, vi } from 'vitest';

vi.mock('@lancedb/lancedb', () => ({
  connect: vi.fn(),
  Table: class {},
}));

import { matchesExperienceIdFilter } from '../vectorStore.js';

describe('matchesExperienceIdFilter', () => {
  it('allows all rows when no filter is provided', () => {
    expect(matchesExperienceIdFilter(undefined, undefined)).toBe(true);
    expect(matchesExperienceIdFilter('director-kinesso', undefined)).toBe(true);
  });

  it('allows rows with empty experience ids when a filter is provided', () => {
    expect(matchesExperienceIdFilter('', 'director-kinesso')).toBe(true);
    expect(matchesExperienceIdFilter([], 'director-kinesso')).toBe(true);
    expect(matchesExperienceIdFilter(' , ', 'director-kinesso')).toBe(true);
  });

  it('matches rows that contain the requested experience id', () => {
    expect(matchesExperienceIdFilter('director-kinesso,founder-one-block-away', 'founder-one-block-away')).toBe(true);
    expect(matchesExperienceIdFilter(['director-kinesso', 'founder-one-block-away'], 'director-kinesso')).toBe(true);
  });

  it('filters rows when non-empty experience ids do not contain the filter', () => {
    expect(matchesExperienceIdFilter('account-supervisor-scout', 'director-kinesso')).toBe(false);
  });
});
