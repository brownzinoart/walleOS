import chatPillsMarkdown from '../../docs/chat-pills.md?raw';

export interface ChatPill {
  id: string;
  prompt: string;
  response: string;
}

const normalizeMarkdown = (markdown: string): string => markdown.replace(/\r\n/g, '\n');

const isHeaderRow = (line: string): boolean => /^\|\s*Chip ID\s*\|/i.test(line);
const isDividerRow = (line: string): boolean => /^\|\s*-+\s*\|/i.test(line);

const parseTableRow = (line: string): ChatPill | null => {
  const trimmed = line.trim();

  if (!trimmed.startsWith('|') || trimmed === '|') {
    return null;
  }

  const cells = trimmed
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());

  if (cells.length < 3) {
    return null;
  }

  const [idCell, promptCell, ...rest] = cells;
  const responseCell = rest.join(' | ').trim();

  const id = idCell?.replace(/`/g, '').trim() ?? '';
  const prompt = promptCell?.trim() ?? '';
  const response = responseCell.trim();

  if (!id || !prompt || !response) {
    return null;
  }

  return { id, prompt, response };
};

const parseChatPills = (markdown: string): ChatPill[] => {
  const lines = normalizeMarkdown(markdown).split('\n');
  const pills: ChatPill[] = [];
  const seenIds = new Set<string>();

  let inTable = false;

  for (const line of lines) {
    if (!inTable) {
      if (isHeaderRow(line)) {
        inTable = true;
      }
      continue;
    }

    if (isDividerRow(line)) {
      continue;
    }

    if (!line.trim()) {
      if (pills.length > 0) {
        break;
      }
      continue;
    }

    if (!line.trim().startsWith('|')) {
      if (pills.length > 0) {
        break;
      }
      continue;
    }

    const pill = parseTableRow(line);

    if (!pill) {
      continue;
    }

    if (seenIds.has(pill.id)) {
      continue;
    }

    seenIds.add(pill.id);
    pills.push(pill);
  }

  return pills;
};

export const chatPills: ChatPill[] = parseChatPills(chatPillsMarkdown);

export const chatPillMap: Map<string, ChatPill> = new Map(
  chatPills.map((pill) => [pill.id, pill]),
);

export const getChatPillById = (id: string): ChatPill | undefined => chatPillMap.get(id);
