# Hide Games Playground from Mobile Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hide the games playground entry card from mobile devices and prevent access to the games route on mobile viewports.

**Architecture:** Add mobile detection to conditionally filter the games card (index 6) from the playground bento grid on viewports ≤767px. Add route guard to redirect mobile users away from `#playground/games` if accessed directly. Use existing `window.matchMedia` pattern for desktop detection at 1024px breakpoint.

**Tech Stack:** TypeScript, CSS media queries, existing router/layout utilities

---

## Task 1: Hide Games Card from Mobile Playground

**Files:**
- Modify: `src/routes/playground/index.ts:85-116`
- Modify: `src/styles/components/playground.css:225-250`

**Step 1: Add mobile detection utility at top of playground index**

In `src/routes/playground/index.ts`, add after existing imports (around line 10):

```typescript
// Mobile detection utility (matches Layout.ts pattern)
const isDesktop = (): boolean => {
  return window.matchMedia('(min-width: 1024px)').matches;
};
```

**Step 2: Filter games card on mobile in renderBentoGrid**

In `src/routes/playground/index.ts`, modify the `renderBentoGrid()` function (around lines 118-122):

Replace:
```typescript
const renderBentoGrid = (): string => {
  return content.slides
    .map((slide, index) => renderBentoCard(slide, index))
    .join("");
};
```

With:
```typescript
const renderBentoGrid = (): string => {
  const isMobile = !isDesktop();

  return content.slides
    .filter((slide, index) => {
      // Hide games card (index 6) on mobile
      if (isMobile && index === 6) {
        return false;
      }
      return true;
    })
    .map((slide, index) => renderBentoCard(slide, index))
    .join("");
};
```

**Step 3: Add CSS fallback for games card hiding**

In `src/styles/components/playground.css`, add new rule inside the existing mobile media query (after line 225):

```css
@media (max-width: 767px) {
  /* Existing mobile rules... */

  /* Hide games card on mobile as additional safeguard */
  .bento-card[data-card-index="6"] {
    display: none !important;
  }
}
```

**Step 4: Test mobile card hiding**

Manual test:
1. Run `npm run dev`
2. Open `http://localhost:3001/#playground`
3. Open DevTools responsive mode
4. Set viewport to 375px width (mobile)
5. Verify only 6 cards are visible (games card missing)
6. Set viewport to 1024px+ width (desktop)
7. Verify all 7 cards are visible (games card present)

Expected: Games card invisible on mobile, visible on desktop

**Step 5: Commit card hiding changes**

```bash
git add src/routes/playground/index.ts src/styles/components/playground.css
git commit -m "feat: hide games playground card on mobile devices

- Add mobile detection utility matching Layout.ts pattern
- Filter games card (index 6) from bento grid on viewports <1024px
- Add CSS fallback with display:none for card[data-card-index=6]
- Mobile breakpoint: 767px and below"
```

---

## Task 2: Add Route Guard for Games on Mobile

**Files:**
- Modify: `src/routes/playground/games.ts:50-68`

**Step 1: Add mobile redirect on games route mount**

In `src/routes/playground/games.ts`, modify the `init()` function (around line 50):

Replace:
```typescript
const init = () => {
  const container = document.querySelector('.games-container');
```

With:
```typescript
const init = () => {
  // Redirect mobile users back to playground
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  if (!isDesktop) {
    window.location.hash = '#playground';
    return;
  }

  const container = document.querySelector('.games-container');
```

**Step 2: Test mobile route guard**

Manual test:
1. Run `npm run dev`
2. Open `http://localhost:3001/` in DevTools responsive mode
3. Set viewport to 375px width (mobile)
4. Navigate directly to `http://localhost:3000/#playground/games`
5. Verify immediate redirect to `#playground`
6. Set viewport to 1024px+ width (desktop)
7. Navigate to `http://localhost:3000/#playground/games`
8. Verify games page loads normally

Expected: Mobile users redirected to playground, desktop users see games page

**Step 3: Commit route guard changes**

```bash
git add src/routes/playground/games.ts
git commit -m "feat: add mobile route guard for games playground

- Detect mobile viewport on games route init
- Redirect to #playground if viewport <1024px
- Prevent direct URL access to games on mobile devices"
```

---

## Task 3: Verify Cross-Browser Mobile Hiding

**Files:**
- Test: Manual cross-browser testing

**Step 1: Test on iOS Safari (if available)**

Manual test:
1. Deploy to test environment or use local network IP
2. Open on iPhone Safari
3. Navigate to `http://[YOUR_IP]:3001/#playground`
4. Verify games card is hidden
5. Try accessing `http://[YOUR_IP]:3000/#playground/games` directly
6. Verify redirect to playground

Expected: Games card hidden, route guard redirects

**Step 2: Test on Android Chrome (if available)**

Manual test:
1. Open on Android Chrome browser
2. Navigate to `http://[YOUR_IP]:3001/#playground`
3. Verify games card is hidden
4. Try accessing `http://[YOUR_IP]:3000/#playground/games` directly
5. Verify redirect to playground

Expected: Games card hidden, route guard redirects

**Step 3: Test responsive breakpoints in DevTools**

Manual test:
1. Open DevTools device toolbar
2. Test these viewports:
   - 320px (iPhone SE)
   - 375px (iPhone 12/13)
   - 414px (iPhone Plus)
   - 768px (iPad portrait - should show card)
   - 1024px (iPad landscape - should show card)
   - 1440px (desktop - should show card)

Expected:
- <768px: Games card hidden
- ≥1024px: Games card visible
- 768-1023px: Verify current behavior (likely visible based on existing breakpoints)

**Step 4: Document mobile hiding behavior**

No commit needed - verification step only. If issues found, note them for fixes.

---

## Task 4: Optional Enhancement - Add Resize Listener

**Files:**
- Modify: `src/routes/playground/index.ts:123-180`

**Note:** This task is optional and only needed if you want the card to show/hide dynamically when resizing browser window without page reload.

**Step 1: Add resize handler to re-render grid**

In `src/routes/playground/index.ts`, add to the `init()` function after line 163:

```typescript
// Dynamic resize handling for mobile/desktop transitions
const handleResize = () => {
  const bentoGrid = document.querySelector('.bento-grid');
  if (bentoGrid) {
    bentoGrid.innerHTML = renderBentoGrid();
    // Re-attach click listeners after re-render
    initializeCardClickHandlers();
  }
};

// Debounce resize to avoid excessive re-renders
let resizeTimeout: number | undefined;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(handleResize, 250);
});
```

**Step 2: Extract click handler initialization**

Create new function before `init()`:

```typescript
const initializeCardClickHandlers = () => {
  const bentoCards = document.querySelectorAll<HTMLElement>(".bento-card");

  bentoCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      const cardIndex = card.dataset.cardIndex;

      if (cardIndex === "6") {
        event.preventDefault();
        event.stopPropagation();
        window.location.hash = "#playground/games";
        return;
      }

      const targetSlide = parseInt(cardIndex || "0", 10);
      currentSlide = targetSlide;
      updateCarousel();
      openModal();
    });
  });
};
```

**Step 3: Use extracted function in init**

In `init()`, replace the existing click handler setup (lines 192-209) with:

```typescript
initializeCardClickHandlers();
```

**Step 4: Test dynamic resize behavior**

Manual test:
1. Run `npm run dev`
2. Open `http://localhost:3001/#playground` at desktop width (1440px)
3. Verify 7 cards visible
4. Resize browser window to 600px width
5. Verify games card disappears after resize
6. Resize back to 1440px
7. Verify games card reappears

Expected: Card visibility updates dynamically on resize

**Step 5: Commit resize enhancement (if implemented)**

```bash
git add src/routes/playground/index.ts
git commit -m "feat: add dynamic resize handling for games card visibility

- Extract click handler initialization to reusable function
- Add debounced resize listener (250ms)
- Re-render bento grid on mobile/desktop breakpoint transitions
- Games card shows/hides dynamically without page reload"
```

---

## Testing Checklist

- [ ] Games card hidden on mobile (≤767px)
- [ ] Games card visible on desktop (≥1024px)
- [ ] Direct URL `#playground/games` redirects on mobile
- [ ] Direct URL `#playground/games` loads on desktop
- [ ] CSS fallback hides card on mobile
- [ ] JavaScript filter prevents card rendering on mobile
- [ ] No console errors on mobile or desktop
- [ ] Responsive transitions smooth (if Task 4 implemented)

## Rollback Plan

If issues arise:

```bash
# Revert all changes
git revert HEAD~3  # Adjust number based on commits made

# Or revert individual commits
git revert <commit-hash>
```

## Notes for Engineer

- **Breakpoint alignment**: Desktop detection uses 1024px (Layout.ts pattern), but mobile CSS uses 767px. This is intentional - the 768-1023px range (tablet) currently shows the games card.
- **Double safeguard**: Both JavaScript filtering AND CSS hiding ensure card is hidden on mobile even if one method fails.
- **Route guard**: Prevents bookmark/direct link access on mobile devices.
- **Port difference**: Note that playground page is on :3001 but games route is on :3000 in your URLs. Verify this is intentional for your setup.
- **Task 4 is optional**: Only implement if you want dynamic resize behavior. Most users won't resize their browser, so page-load detection is sufficient.

## Related Files Reference

- Desktop detection pattern: `src/components/Layout.ts:29`
- Router definition: `src/utils/router.ts:87-92`
- Card data: `src/config/playgroundContent.json:61-68`
- Games component: `src/routes/playground/games.ts`
- Mobile styles: `src/styles/components/playground.css:225+`
