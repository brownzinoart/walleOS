# Games Hub Playground Card Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an interactive games hub card to the playground bento grid that allows recruiters to play Simon Says and Word Search games in a single embedded experience with a toggle to switch between games.

**Architecture:** Create a new playground card entry in playgroundContent.json that links to a dedicated games route (#playground/games). Build a new games page component with iframe-based game embedding and a toggle control. Register the route and ensure proper navigation from the playground bento grid.

**Tech Stack:** TypeScript, Vanilla JS, HTML/CSS, existing routing system, iframe embedding

---

## Task 1: Add Games Card to Playground Content

**Files:**
- Modify: `src/config/playgroundContent.json`
- Test: Manual verification via localhost:3002/#playground

**Step 1: Add games card entry to playgroundContent.json**

Add this entry to the slides array (after the last existing slide):

```json
{
  "title": "Take a Break",
  "category": "Interactive Games",
  "backgroundImage": "/images/playground/games-preview.jpg",
  "foregroundImage": "/images/playground/games-preview.jpg",
  "size": "md",
  "accentColor": "var(--color-neon-lime)"
}
```

**Step 2: Verify the card renders on playground page**

Run: `npm run dev`
Navigate to: `http://localhost:3002/#playground`
Expected: New "Take a Break" card appears in bento grid with "Interactive Games" category label

**Step 3: Commit the content change**

```bash
git add src/config/playgroundContent.json
git commit -m "feat: add games hub card to playground"
```

---

## Task 2: Create Games Route Component (Structure)

**Files:**
- Create: `src/routes/playground/games.ts`
- Test: `src/__tests__/games-route.test.ts` (created in Task 3)

**Step 1: Write failing test for games component exports**

Create test file first (TDD approach):

```typescript
// src/__tests__/games-route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('Games route component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('exports render, init, and cleanup functions', async () => {
    const gamesModule = await import('@/routes/playground/games');

    expect(gamesModule.render).toBeDefined();
    expect(typeof gamesModule.render).toBe('function');
    expect(gamesModule.init).toBeDefined();
    expect(typeof gamesModule.init).toBe('function');
    expect(gamesModule.cleanup).toBeDefined();
    expect(typeof gamesModule.cleanup).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/games-route.test.ts`
Expected: FAIL with "Cannot find module" error

**Step 3: Create minimal games route component structure**

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/games-route.test.ts`
Expected: PASS

**Step 5: Commit the component structure**

```bash
git add src/routes/playground/games.ts src/__tests__/games-route.test.ts
git commit -m "feat: create games route component structure"
```

---

## Task 3: Implement Game Toggle Logic

**Files:**
- Modify: `src/routes/playground/games.ts:35-45`
- Test: `src/__tests__/games-route.test.ts`

**Step 1: Write failing test for game toggle interaction**

Add to `src/__tests__/games-route.test.ts`:

```typescript
it('shows first game by default and hides others', async () => {
  const { render, init } = await import('@/routes/playground/games');

  document.body.innerHTML = render();
  init();

  const simonFrame = document.querySelector('[data-game-frame="simon-says"]') as HTMLElement;
  const wordFrame = document.querySelector('[data-game-frame="word-search"]') as HTMLElement;

  expect(simonFrame.style.display).not.toBe('none');
  expect(wordFrame.style.display).toBe('none');
});

it('switches games when toggle button is clicked', async () => {
  const { render, init } = await import('@/routes/playground/games');

  document.body.innerHTML = render();
  init();

  const wordSearchBtn = document.querySelector('[data-game-id="word-search"]') as HTMLButtonElement;
  const simonFrame = document.querySelector('[data-game-frame="simon-says"]') as HTMLElement;
  const wordFrame = document.querySelector('[data-game-frame="word-search"]') as HTMLElement;

  wordSearchBtn.click();

  expect(simonFrame.style.display).toBe('none');
  expect(wordFrame.style.display).not.toBe('none');
  expect(wordSearchBtn.getAttribute('aria-pressed')).toBe('true');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/games-route.test.ts`
Expected: FAIL - games don't toggle, display properties not set correctly

**Step 3: Implement init function with toggle logic**

Replace the init function in `src/routes/playground/games.ts`:

```typescript
let currentGameId: GameId = 'simon-says';

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
    currentGameId = gameId;

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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/games-route.test.ts`
Expected: PASS

**Step 5: Commit the toggle logic**

```bash
git add src/routes/playground/games.ts src/__tests__/games-route.test.ts
git commit -m "feat: implement game toggle interaction logic"
```

---

## Task 4: Add Cleanup Logic

**Files:**
- Modify: `src/routes/playground/games.ts:47-52`
- Test: `src/__tests__/games-route.test.ts`

**Step 1: Write failing test for cleanup**

Add to `src/__tests__/games-route.test.ts`:

```typescript
it('removes event listeners on cleanup', async () => {
  const { render, init, cleanup } = await import('@/routes/playground/games');

  document.body.innerHTML = render();
  init();

  const root = document.querySelector('[data-games-root]');
  cleanup();

  // After cleanup, root should still exist but listeners removed
  expect(root).not.toBeNull();

  // Clicking buttons should not cause errors
  const buttons = document.querySelectorAll('[data-game-id]');
  buttons.forEach(btn => {
    expect(() => (btn as HTMLElement).click()).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/games-route.test.ts`
Expected: FAIL - cleanup doesn't properly remove listeners

**Step 3: Implement cleanup function**

Replace the cleanup function in `src/routes/playground/games.ts`:

```typescript
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

  // Reset current game state
  currentGameId = 'simon-says';
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/games-route.test.ts`
Expected: PASS

**Step 5: Commit cleanup implementation**

```bash
git add src/routes/playground/games.ts src/__tests__/games-route.test.ts
git commit -m "feat: implement games component cleanup"
```

---

## Task 5: Register Games Route

**Files:**
- Modify: `src/utils/router.ts:1-12`
- Modify: `src/routes/registry.ts`
- Test: `src/__tests__/games-route.test.ts`

**Step 1: Write failing test for route registration**

Add to `src/__tests__/games-route.test.ts`:

```typescript
it('has a registered route for playground/games', async () => {
  const { navigateTo, getRouteTitle } = await import('@/utils/router');

  expect(getRouteTitle('playground-games')).toBe('Games');

  navigateTo('playground-games');

  expect(window.location.hash).toBe('#playground-games');
  expect(document.title).toBe('Games - WalleOS');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/games-route.test.ts`
Expected: FAIL - route not registered

**Step 3: Add route type to router.ts**

Modify `src/utils/router.ts`:

```typescript
export type RouteComponentId =
  | "home"
  | "projects"
  | "project-weready"
  | "project-listingpal"
  | "project-echo"
  | "project-briefflow"
  | "project-clockit"
  | "project-hq"
  | "resume"
  | "playground"
  | "art-gallery"
  | "playground-games";
```

**Step 4: Add route mapping to router.ts**

Add to the routes Map in `src/utils/router.ts` (after the art-gallery entry):

```typescript
[
  "#playground/games",
  { path: "#playground/games", component: "playground-games", title: "Games" },
],
```

**Step 5: Register component in routes registry**

Check and update `src/routes/registry.ts`:

```typescript
import * as playgroundGames from '@/routes/playground/games';

// Add to the registry object
export const routeRegistry = {
  // ... existing routes ...
  'playground-games': playgroundGames,
};
```

**Step 6: Run test to verify it passes**

Run: `npm test -- src/__tests__/games-route.test.ts`
Expected: PASS

**Step 7: Commit route registration**

```bash
git add src/utils/router.ts src/routes/registry.ts src/__tests__/games-route.test.ts
git commit -m "feat: register playground games route"
```

---

## Task 6: Wire Games Card to Route

**Files:**
- Modify: `src/routes/playground/index.ts:78-115`
- Test: Manual verification

**Step 1: Add navigation handler for games card**

Modify the `renderBentoCard` function or the card click handler in `src/routes/playground/index.ts`. Find the section that handles the art card navigation (around line 183-189) and add similar logic for a games card.

First, update `playgroundContent.json` to track which card index is the games card. Since we're adding it as a new card, let's assume it will be at index 6 (after the 6 existing cards).

**Step 2: Update card click handler to support games navigation**

In `src/routes/playground/index.ts`, modify the `handleCardClick` function (around line 178-196):

```typescript
const handleCardClick = (event: MouseEvent, card: HTMLElement): void => {
  const link = card.dataset["link"];
  const isExternal = card.dataset["external"] === "true";
  const cardIndex = card.dataset["cardIndex"];

  // Check if this is the art card (Personal Hobby)
  if (cardIndex === "0") {
    event.preventDefault();
    event.stopPropagation();
    window.location.hash = "#playground/art-gallery";
    return;
  }

  // Check if this is the games card (Take a Break)
  if (cardIndex === "6") {
    event.preventDefault();
    event.stopPropagation();
    window.location.hash = "#playground/games";
    return;
  }

  if (link && isExternal) {
    event.preventDefault();
    event.stopPropagation();
    window.open(link, "_blank", "noopener,noreferrer");
  }
};
```

**Step 3: Update keyboard handler similarly**

Update `handleCardKeydown` function (around line 198-218):

```typescript
const handleCardKeydown = (event: KeyboardEvent, card: HTMLElement): void => {
  if (event.key === "Enter" || event.key === " ") {
    const link = card.dataset["link"];
    const isExternal = card.dataset["external"] === "true";
    const cardIndex = card.dataset["cardIndex"];

    // Check if this is the art card (Personal Hobby)
    if (cardIndex === "0") {
      event.preventDefault();
      event.stopPropagation();
      window.location.hash = "#playground/art-gallery";
      return;
    }

    // Check if this is the games card (Take a Break)
    if (cardIndex === "6") {
      event.preventDefault();
      event.stopPropagation();
      window.location.hash = "#playground/games";
      return;
    }

    if (link && isExternal) {
      event.preventDefault();
      event.stopPropagation();
      window.open(link, "_blank", "noopener,noreferrer");
    }
  }
};
```

**Step 4: Update card setup to mark games card as clickable**

Update the section where cards are made clickable (around line 221-240):

```typescript
cards.forEach((card) => {
  const link = card.dataset["link"];
  const isExternal = card.dataset["external"] === "true";
  const cardIndex = card.dataset["cardIndex"];
  const isArtCard = cardIndex === "0";
  const isGamesCard = cardIndex === "6";

  if ((link && isExternal) || isArtCard || isGamesCard) {
    card.addEventListener("click", (e) => handleCardClick(e, card));
    card.addEventListener("keydown", (e) => handleCardKeydown(e, card));

    if (isArtCard) {
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "View art gallery");
      card.setAttribute("tabindex", "0");
    } else if (isGamesCard) {
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Play interactive games");
      card.setAttribute("tabindex", "0");
    } else {
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", `External link to ${link}`);
    }
  }
});
```

**Step 5: Update renderBentoCard to mark games card as clickable**

In the `renderBentoCard` function (around line 78-115), update the clickable class logic:

```typescript
const isClickable = slide.link && slide.external;
const isArtCard = index === 0;
const isGamesCard = index === 6;
const clickableClass =
  isClickable || isArtCard || isGamesCard ? "bento-card--clickable" : "";
```

**Step 6: Test navigation manually**

Run: `npm run dev`
Navigate to: `http://localhost:3002/#playground`
Expected:
- Click "Take a Break" card
- Navigate to `#playground/games`
- See games page with toggle buttons and iframes

**Step 7: Commit navigation wiring**

```bash
git add src/routes/playground/index.ts
git commit -m "feat: wire games card to games route navigation"
```

---

## Task 7: Style Games Page Component

**Files:**
- Create: `src/styles/games.css`
- Modify: `src/main.ts` (to import styles)
- Test: Manual visual verification

**Step 1: Create games component styles**

```css
/* src/styles/games.css */
.games-page {
  min-height: 100vh;
  padding: 2rem;
  background: var(--color-background);
}

.games-header {
  text-align: center;
  margin-bottom: 2rem;
}

.games-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.games-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
}

.games-container {
  max-width: 1200px;
  margin: 0 auto;
}

.games-toggle {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.game-toggle-btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid var(--color-border);
  background: transparent;
  color: var(--color-text-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.game-toggle-btn:hover {
  border-color: var(--color-neon-cyan);
  color: var(--color-neon-cyan);
}

.game-toggle-btn[aria-pressed="true"] {
  background: var(--color-neon-cyan);
  border-color: var(--color-neon-cyan);
  color: var(--color-background);
}

.games-viewport {
  position: relative;
  width: 100%;
  height: 600px;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.game-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

@media (max-width: 768px) {
  .games-page {
    padding: 1rem;
  }

  .games-title {
    font-size: 2rem;
  }

  .games-toggle {
    flex-direction: column;
    gap: 0.5rem;
  }

  .games-viewport {
    height: 500px;
  }
}
```

**Step 2: Import styles in main.ts**

Add to imports in `src/main.ts`:

```typescript
import '@/styles/games.css';
```

**Step 3: Test styles visually**

Run: `npm run dev`
Navigate to: `http://localhost:3002/#playground/games`
Expected:
- Clean header with title and subtitle
- Centered toggle buttons with hover states
- Games displayed in bordered viewport
- Responsive on mobile

**Step 4: Commit styles**

```bash
git add src/styles/games.css src/main.ts
git commit -m "style: add games page component styles"
```

---

## Task 8: Add Placeholder Preview Image

**Files:**
- Create: `public/images/playground/games-preview.jpg` (or use existing image)
- Test: Manual visual verification

**Step 1: Create or source a preview image**

Option A: Take a screenshot of the games page
Option B: Use a placeholder image or gaming icon

Place the image at: `public/images/playground/games-preview.jpg`

**Step 2: Verify preview appears on playground card**

Run: `npm run dev`
Navigate to: `http://localhost:3002/#playground`
Expected: Games card shows preview image as background

**Step 3: Commit preview image**

```bash
git add public/images/playground/games-preview.jpg
git commit -m "assets: add games hub preview image"
```

---

## Task 9: Write Integration Tests

**Files:**
- Modify: `src/__tests__/games-route.test.ts`
- Test: Run test suite

**Step 1: Add integration test for full user flow**

Add to `src/__tests__/games-route.test.ts`:

```typescript
describe('Games page integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders complete games page with all elements', async () => {
    const { render, init } = await import('@/routes/playground/games');

    document.body.innerHTML = render();
    init();

    const root = document.querySelector('[data-games-root]');
    expect(root).not.toBeNull();

    const header = root?.querySelector('.games-header');
    expect(header).not.toBeNull();

    const title = root?.querySelector('.games-title');
    expect(title?.textContent).toBe('Take a Break');

    const toggleButtons = root?.querySelectorAll('[data-game-id]');
    expect(toggleButtons?.length).toBe(2);

    const iframes = root?.querySelectorAll('[data-game-frame]');
    expect(iframes?.length).toBe(2);
  });

  it('loads correct iframe sources for each game', async () => {
    const { render } = await import('@/routes/playground/games');

    document.body.innerHTML = render();

    const simonFrame = document.querySelector('[data-game-frame="simon-says"]') as HTMLIFrameElement;
    const wordFrame = document.querySelector('[data-game-frame="word-search"]') as HTMLIFrameElement;

    expect(simonFrame.src).toContain('/playground/games/simon-says-game-in-css-jquery/dist/index.html');
    expect(wordFrame.src).toContain('/playground/games/word-seach/dist/index.html');
  });
});
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 3: Run specific games tests**

Run: `npm test -- src/__tests__/games-route.test.ts`
Expected: All games-specific tests pass

**Step 4: Commit integration tests**

```bash
git add src/__tests__/games-route.test.ts
git commit -m "test: add integration tests for games page"
```

---

## Task 10: Update Playground Tests for New Card

**Files:**
- Modify: `src/__tests__/playground-route.test.ts`
- Test: Run playground test suite

**Step 1: Update test to expect 7 cards instead of 6**

Modify `src/__tests__/playground-route.test.ts` (around line 52):

```typescript
it('renders a bento grid with cards for each slide', async () => {
  const [{ render }, { playgroundSlides }] = await Promise.all([
    import('@/routes/playground/index'),
    import('@/config/playgroundContent'),
  ]);

  document.body.innerHTML = render();

  const root = document.querySelector('[data-playground-root]');
  expect(root).not.toBeNull();

  const grid = root?.querySelector('.bento-grid-container');
  expect(grid).not.toBeNull();

  const cards = root?.querySelectorAll('[data-bento-card]') ?? [];
  expect(cards.length).toBe(playgroundSlides.length);
  expect(cards.length).toBe(7); // Updated to reflect new games card

  playgroundSlides.forEach(({ title, category }) => {
    expect(root?.textContent?.includes(title)).toBe(true);
    expect(root?.textContent?.includes(category)).toBe(true);
  });
});
```

**Step 2: Run playground tests**

Run: `npm test -- src/__tests__/playground-route.test.ts`
Expected: All tests pass with 7 cards

**Step 3: Commit test updates**

```bash
git add src/__tests__/playground-route.test.ts
git commit -m "test: update playground tests for games card"
```

---

## Task 11: Manual QA and Polish

**Files:**
- Various (based on QA findings)
- Test: Manual cross-browser testing

**Step 1: Test complete user flow**

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3002/#playground`
3. Verify games card appears with correct styling
4. Click games card
5. Verify navigation to `#playground/games`
6. Verify Simon Says game loads by default
7. Click "Word Search" toggle button
8. Verify Word Search game displays and Simon Says hides
9. Click "Simon Says" toggle button
10. Verify Simon Says game displays and Word Search hides
11. Navigate back to playground using browser back or sidebar
12. Verify smooth navigation

**Step 2: Test responsive behavior**

1. Open browser dev tools
2. Toggle device toolbar
3. Test on mobile viewport (375px)
4. Verify toggle buttons stack vertically
5. Verify games remain playable
6. Test on tablet viewport (768px)
7. Test on desktop viewport (1440px)

**Step 3: Test accessibility**

1. Use keyboard navigation (Tab key)
2. Verify all toggle buttons are focusable
3. Press Enter/Space on toggle buttons
4. Verify games switch correctly
5. Test with screen reader (VoiceOver/NVDA)
6. Verify aria-labels are announced correctly

**Step 4: Document any issues found**

Create a list of polish items if needed:
- Visual alignment issues
- Animation/transition improvements
- Loading state considerations
- Error handling for iframe failures

**Step 5: Address critical issues**

Fix any blocking bugs discovered during QA.

**Step 6: Commit polish changes**

```bash
git add [modified files]
git commit -m "polish: address QA findings for games page"
```

---

## Task 12: Final Build and Verification

**Files:**
- None (build verification only)
- Test: Production build

**Step 1: Run production build**

Run: `npm run build`
Expected: Build completes successfully with no errors

**Step 2: Preview production build**

Run: `npm run preview`
Navigate to the preview URL
Expected: All features work in production build

**Step 3: Verify bundle size impact**

Check build output for bundle size
Expected: Minimal increase (games are iframes, not bundled)

**Step 4: Run full test suite one final time**

Run: `npm test`
Expected: All tests pass

**Step 5: Create final commit if needed**

```bash
git add [any final changes]
git commit -m "chore: finalize games hub implementation"
```

---

## Implementation Notes

### Architecture Decisions

1. **Iframe Embedding**: Games are embedded via iframes to maintain isolation and avoid conflicts with existing site styles/scripts
2. **Toggle Pattern**: Simple button-based toggle instead of tabs for minimal complexity and clear UX
3. **Route Structure**: `/playground/games` follows existing pattern of `/playground/art-gallery`
4. **No External Dependencies**: Uses vanilla JS and existing patterns to minimize bundle size

### Testing Strategy

- **Unit Tests**: Component exports, render output, toggle logic
- **Integration Tests**: Full page rendering, navigation, state management
- **Manual QA**: Cross-browser, responsive, accessibility, user flow
- **TDD Approach**: Write tests first, implement to pass, refactor

### Future Enhancements (Out of Scope)

- Add more games to the toggle
- Implement loading states for iframes
- Add game completion tracking/scores
- Add "Back to Playground" navigation button
- Implement game preview thumbnails
- Add keyboard shortcuts for game switching

### Deployment Checklist

- ✅ All tests pass
- ✅ Production build succeeds
- ✅ No console errors in browser
- ✅ Games load correctly in iframes
- ✅ Navigation works bidirectionally
- ✅ Responsive on all breakpoints
- ✅ Accessible via keyboard and screen reader
- ✅ Preview image displays on playground card

---

**Dependencies:**
- @superpowers:test-driven-development - Follow TDD for each task
- @superpowers:verification-before-completion - Verify tests pass before commits
