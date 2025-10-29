// src/routes/playground/games.ts
const GAMES = [
  {
    id: 'word-search',
    title: 'Word Search',
    path: '/playground/games/word-seach/dist/index.html'
  }
] as const;


const render = (): string => {
  return `
    <div data-games-root class="games-page">
      <header class="games-header">
        <h1 class="games-title">Take a Break</h1>
        <p class="games-subtitle">Quick games for recruiters to enjoy</p>
      </header>
      <div class="games-container">
        <div class="games-toggle" data-games-toggle>
          ${GAMES.map((game, index) => `
            <button
              class="game-toggle-btn"
              data-game-id="${game.id}"
              aria-pressed="${index === 0 ? 'true' : 'false'}"
              disabled
              aria-disabled="true"
            >
              ${game.title}
            </button>
          `).join('')}
        </div>
        <div class="games-viewport" data-games-viewport>
          ${GAMES.map((game, index) => `
            <iframe
              id="game-${game.id}"
              class="game-iframe"
              data-game-frame="${game.id}"
              src="${game.path}"
              title="${game.title} game"
              sandbox="allow-scripts allow-same-origin"
              style="display: ${index === 0 ? 'block' : 'none'};"
            ></iframe>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};

const init = (): void => {
  // Redirect mobile users back to playground
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  if (!isDesktop) {
    window.location.hash = '#playground';
    return;
  }

  const root = document.querySelector<HTMLElement>('[data-games-root]');
  if (!root) return;

  const toggleButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-game-id]')
  );
  const gameFrames = Array.from(
    root.querySelectorAll<HTMLIFrameElement>('[data-game-frame]')
  );

  // Show first (and only) game by default
  const firstFrame = gameFrames[0];
  const firstButton = toggleButtons[0];
  if (firstFrame) firstFrame.style.display = 'block';
  if (firstButton) firstButton.setAttribute('aria-pressed', 'true');

  // Remove clickable behavior: no event listeners needed for a single disabled button
};

const cleanup = (): void => {
  const root = document.querySelector<HTMLElement>('[data-games-root]');
  if (!root) return;

  const toggleButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-game-id]')
  );

  // Remove event listeners by cloning nodes
  toggleButtons.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode?.replaceChild(newBtn, btn);
  });
};

export { render, init, cleanup };
