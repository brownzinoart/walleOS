// src/routes/playground/games.ts
const GAMES = [
  {
    id: 'simon-says',
    title: 'Simon Says',
    path: '/playground/games/simon-says-game-in-css-jquery/dist/index.html'
  },
  {
    id: 'word-search',
    title: 'Word Search',
    path: '/playground/games/word-seach/dist/index.html'
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
          ${GAMES.map(game => `
            <button
              class="game-toggle-btn"
              data-game-id="${game.id}"
              aria-pressed="false"
            >
              ${game.title}
            </button>
          `).join('')}
        </div>
        <div class="games-viewport" data-games-viewport>
          ${GAMES.map(game => `
            <iframe
              id="game-${game.id}"
              class="game-iframe"
              data-game-frame="${game.id}"
              src="${game.path}"
              title="${game.title} game"
              sandbox="allow-scripts allow-same-origin"
              style="display: none;"
            ></iframe>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};

const init = (): void => {
  // Placeholder for initialization logic
};

const cleanup = (): void => {
  // Placeholder for cleanup logic
};

export { render, init, cleanup };
