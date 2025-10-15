import type { ChatMessage, MessageAnimationState } from '@/types';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatTimestamp = (timestamp: Date): string => {
  try {
    return timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const extractBodyAndSources = (raw: string): { body: string; sources: string[] } => {
  const idx = raw.lastIndexOf('Sources:');
  if (idx === -1) return { body: raw, sources: [] };
  const body = raw.slice(0, idx).trimEnd();
  const tail = raw.slice(idx).split(/\n/)[0] || '';
  const list = tail.replace(/^Sources:/, '').trim();
  if (!list) return { body: raw, sources: [] };
  const items = list
    .split(/;|,|\u2022|\*|\|/)
    .map(s => s.trim())
    .filter(Boolean);
  // de-dupe while preserving order
  const seen = new Set<string>();
  const unique = items.filter(s => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { body: body || raw, sources: unique };
};

export const renderChatMessage = (message: ChatMessage): string => {
  const isUser = message.role === 'user';
  const variantClasses = isUser
    ? 'chat-message-user ml-auto bg-surface-card text-primary border-2 border-neon-cyan shadow-brutal rounded-lg rounded-br-sm'
    : 'chat-message-assistant mr-auto bg-surface-secondary text-primary border-2 border-neon-magenta rounded-lg rounded-bl-sm';

  const timestamp = formatTimestamp(message.timestamp);
  const state: MessageAnimationState = message.animationState ?? 'idle';
  const isAnimating = state === 'buffering' || state === 'animating';

  const visibleHtml = isAnimating
    ? (message.displayContent ?? '')
    : (() => {
        const { body, sources } = extractBodyAndSources(message.content);
        const safeBody = escapeHtml(body);
        const sourcesMarkup = !isUser && sources.length > 0
          ? `<footer class="mt-3 text-xs text-tertiary">References: ${escapeHtml(sources.join('; '))}</footer>`
          : '';
        return `<span>${safeBody}</span>${sourcesMarkup}`;
      })();

  const ariaLive = isAnimating ? 'off' : 'polite';
  const ariaBusy = isAnimating ? 'true' : 'false';

  return `
    <article
      class="chat-message ${variantClasses} max-w-[80%] md:max-w-[70%] p-4 whitespace-pre-wrap"
      data-message-id="${message.id}"
      data-role="${message.role}"
      data-animation-state="${state}"
      ${isAnimating ? 'data-message-animating="true"' : ''}
      aria-live="${ariaLive}"
      aria-busy="${ariaBusy}"
    >
      <p class="leading-relaxed">${visibleHtml}</p>
      ${timestamp ? `<span class="mt-2 block text-xs text-tertiary">${timestamp}</span>` : ''}
    </article>
  `;
};
