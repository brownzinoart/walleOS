import { describe, expect, it } from 'vitest';
import { chatPills, suggestionChips, mockResponses } from '@/config/content';

describe('chat pill content hydration', () => {
  it('keeps suggestion chips in sync with markdown prompts', () => {
    chatPills.forEach((pill) => {
      const chip = suggestionChips.find((item) => item.id === pill.id);
      expect(chip, `Missing suggestion chip for ${pill.id}`).toBeDefined();
      expect(chip?.text).toBe(pill.prompt);
    });
  });

  it('hydrates mock responses from markdown answers', () => {
    chatPills.forEach((pill) => {
      expect(mockResponses[pill.id], `Missing mock response for ${pill.id}`).toBeDefined();
      expect(mockResponses[pill.id]).toBe(pill.response);
    });
  });
});
