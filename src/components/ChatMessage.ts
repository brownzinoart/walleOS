import type { ChatMessage } from '@/types';

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

export const renderChatMessage = (message: ChatMessage): string => {
  const isUser = message.role === 'user';
  const variantClasses = isUser
    ? 'chat-message-user ml-auto bg-neon-cyan text-black shadow-brutal rounded-lg rounded-br-sm'
    : 'chat-message-assistant mr-auto bg-gray-800 text-white border-2 border-neon-magenta rounded-lg rounded-bl-sm';

  const timestamp = formatTimestamp(message.timestamp);
  const content = escapeHtml(message.content);

  return `
    <article
      class="chat-message ${variantClasses} max-w-[80%] md:max-w-[70%] p-4 whitespace-pre-wrap"
      data-message-id="${message.id}"
      data-role="${message.role}"
      aria-live="polite"
    >
      <p class="leading-relaxed">${content}</p>
      ${timestamp ? `<span class="mt-2 block text-xs opacity-70">${timestamp}</span>` : ''}
    </article>
  `;
};
