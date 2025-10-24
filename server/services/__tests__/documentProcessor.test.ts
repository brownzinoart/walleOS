import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { processDocument } from '../documentProcessor.js';

const tempDirs: string[] = [];

function createTempMarkdown(filename: string, contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'doc-processor-test-'));
  tempDirs.push(dir);
  const filePath = join(dir, filename);
  writeFileSync(filePath, contents, 'utf-8');
  return filePath;
}

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('processDocument frontmatter parsing', () => {
  it('parses tags and experienceIds from YAML frontmatter with quotes', () => {
    const filePath = createTempMarkdown(
      'cdm_barker.md',
      `---\ncategory: "resume"\ntags:\n  - "cdm-ny"\n  - 'barker-dzp'\nexperienceIds:\n  - cdm-ny\n  - barker-dzp\n---\nCDM and Barker experience summary.`,
    );

    const processed = processDocument(filePath);

    expect(processed.category).toBe('resume');
    expect(processed.tags).toEqual(['cdm-ny', 'barker-dzp']);
    expect(processed.chunks.length).toBeGreaterThan(0);
    expect(processed.chunks[0].metadata.experienceIds).toEqual(['cdm-ny', 'barker-dzp']);
  });

  it('infers category from filename when frontmatter is absent and keeps experienceIds undefined', () => {
    const filePath = createTempMarkdown('skills_snapshot.md', 'This file has no frontmatter but references core skills.');

    const processed = processDocument(filePath);

    expect(processed.category).toBe('skills');
    expect(processed.tags).toEqual([]);
    expect(processed.chunks[0].metadata.experienceIds).toBeUndefined();
  });
});
