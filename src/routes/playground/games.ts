// src/routes/playground/games.ts
const GAMES = [
  {
    id: 'simon-says',
    title: 'Neon Simon',
    path: '/playground/games/neon-simon/index.html'
  },
  {
    id: 'reaction-sprint',
    title: 'Reaction Sprint',
    path: '/playground/games/reaction-sprint/index.html'
  }
] as const;

type GameId = typeof GAMES[number]['id'];

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
  const root = document.querySelector<HTMLElement>('[data-games-root]');
  if (!root) return;

  const toggleButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-game-id]')
  );
  const gameFrames = Array.from(
    root.querySelectorAll<HTMLIFrameElement>('[data-game-frame]')
  );

  // Show first game by default
  const firstFrame = gameFrames[0];
  const firstButton = toggleButtons[0];
  if (firstFrame) firstFrame.style.display = 'block';
  if (firstButton) firstButton.setAttribute('aria-pressed', 'true');

  // Toggle game display
  const switchToGame = (gameId: GameId): void => {
    gameFrames.forEach(frame => {
      const frameGameId = frame.dataset['gameFrame'];
      frame.style.display = frameGameId === gameId ? 'block' : 'none';
    });

    toggleButtons.forEach(btn => {
      const btnGameId = btn.dataset['gameId'];
      btn.setAttribute('aria-pressed', String(btnGameId === gameId));
    });
  };

  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const gameId = btn.dataset['gameId'] as GameId;
      if (gameId) switchToGame(gameId);
    });
  });
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
