import { renderWelcomeCard } from '@/components/WelcomeCard';
import type { ChatMessage } from '@/types';
import { renderChatMessage } from './ChatMessage';

export const CHAT_CONTAINER_SELECTOR = '[data-chat-container]';
export const MESSAGE_LIST_SELECTOR = '[data-message-list]';

interface ChatContainerOptions {
  showEmptyState?: boolean;
  emptyStateContent?: string;
  appendContent?: string;
}

export const renderChatContainer = (
  messages: ChatMessage[],
  options: ChatContainerOptions = {}
): string => {
  const defaultEmptyState = `
    <div class="chat-empty-state flex flex-col gap-6">
      ${renderWelcomeCard()}
    </div>
  `;

  const {
    showEmptyState = true,
    emptyStateContent = defaultEmptyState,
    appendContent = '',
  } = options;
  const hasMessages = messages.length > 0;
  const messageMarkup = hasMessages
    ? messages.map((message) => renderChatMessage(message)).join('')
    : showEmptyState
    ? emptyStateContent
    : '';
  const combinedMarkup = `${messageMarkup}${appendContent}`;

  return `
    <section
      class="chat-container flex flex-col gap-4 overflow-y-auto flex-1 px-4 md:px-0 pb-32 md:pb-8"
      data-chat-container
      aria-live="polite"
      aria-describedby="chat-instructions"
    >
      <div id="chat-instructions" class="sr-only">
        Chat messages will appear here. New responses are announced automatically.
      </div>
      <div class="flex flex-col gap-4" data-message-list>
        ${combinedMarkup}
      </div>
    </section>
  `;
};

export const scrollToBottom = (behavior: ScrollBehavior = 'smooth'): void => {
  const container = document.querySelector<HTMLElement>(CHAT_CONTAINER_SELECTOR);

  if (!container) {
    return;
  }

  requestAnimationFrame(() => {
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  });
};
