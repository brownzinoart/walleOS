import type { SuggestionChip } from '@/config/content';

export const SELECTED_CHIPS_SESSION_KEY = 'walleos-selected-suggestion-chips';

export function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = shuffled[index]!;
    shuffled[index] = shuffled[swapIndex]!;
    shuffled[swapIndex] = temp;
  }

  return shuffled;
}

export function selectRandomChips(chips: SuggestionChip[], count: number): SuggestionChip[] {
  if (count <= 0 || chips.length === 0) {
    return [];
  }

  const selectionCount = Math.min(count, chips.length);
  return shuffleArray(chips).slice(0, selectionCount);
}

function readStoredSelection(allChips: SuggestionChip[], expectedCount: number): SuggestionChip[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedIdsRaw = window.sessionStorage.getItem(SELECTED_CHIPS_SESSION_KEY);

    if (!storedIdsRaw) {
      return null;
    }

    const parsed = JSON.parse(storedIdsRaw);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const chipsById = new Map(allChips.map((chip) => [chip.id, chip]));
    const resolved = parsed
      .map((id) => (typeof id === 'string' ? chipsById.get(id) : undefined))
      .filter((chip): chip is SuggestionChip => Boolean(chip));

    if (resolved.length !== expectedCount) {
      return null;
    }

    const uniqueIds = new Set(resolved.map((chip) => chip.id));
    if (uniqueIds.size !== resolved.length) {
      return null;
    }

    return resolved;
  } catch {
    return null;
  }
}

function storeSelection(chips: SuggestionChip[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const ids = chips.map((chip) => chip.id);
    window.sessionStorage.setItem(SELECTED_CHIPS_SESSION_KEY, JSON.stringify(ids));
  } catch {
    // ignore persistence errors
  }
}

export function getSelectedSuggestionChips(allChips: SuggestionChip[], count = 4): SuggestionChip[] {
  if (count <= 0) {
    return [];
  }

  const normalizedCount = Math.min(count, allChips.length);

  if (normalizedCount === 0) {
    return [];
  }

  const storedSelection = readStoredSelection(allChips, normalizedCount);

  if (storedSelection) {
    return storedSelection;
  }

  const selection = selectRandomChips(allChips, normalizedCount);
  storeSelection(selection);
  return selection;
}

export function clearSelectedChips(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(SELECTED_CHIPS_SESSION_KEY);
  } catch {
    // ignore persistence errors
  }
}
