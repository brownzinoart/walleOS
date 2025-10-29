# Fix Games Loading in Development and Production

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix games not loading assets in iframes and ensure production deployment works on Vercel

**Architecture:** The Word Search game is a self-contained HTML/CSS/JS experience loaded in an iframe from `/playground/games/`. The Simon Says game has been removed.

**Tech Stack:** Vanilla HTML/CSS/JS, jQuery, Vite (build tool), Vercel (hosting)

---

## Root Cause Analysis

**Word Search Game Issues:**
1. Missing jQuery dependency (script uses `$(document).ready()`)
2. Missing Google Fonts link for 'Fresca' font family

**Production Deployment Issues:**
1. Vercel.json has rewrite rules but games directory may not be copied to dist
2. Need to verify `public/` directory contents are copied to production build

---

## Task 1: Word Search Dependencies

Ensure required dependencies are present in the inlined head of the built file.

---

## Task 2: Fix Word Search External Dependencies

**Files:**
- Modify: `public/playground/games/word-seach/dist/index.html`

**Step 1: Add missing CDN dependencies to head section**

Add before closing `</head>` tag at line 104:

```html
    <!-- External Dependencies -->
    <link href="https://fonts.googleapis.com/css?family=Fresca&display=swap" rel="stylesheet">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
```

**Step 2: Test Word Search game in browser**

Run: Open `http://localhost:3000/#playground/games` and click "Word Search"
Expected: Game loads with Fresca font, grid displays correctly, mouse interactions work

**Step 3: Commit Word Search dependency fix**

```bash
git add public/playground/games/word-seach/dist/index.html
git commit -m "fix: add missing jQuery and Fresca font dependencies to Word Search game"
```

---

## Task 2: Verify Vite Build Includes Games Directory

**Files:**
- Read: `vite.config.ts`
- Potentially modify: `vite.config.ts`

**Step 1: Check if public directory is automatically copied**

Vite automatically copies the `public/` directory to `dist/` during build. Verify this behavior is not disabled.

Run: Check vite.config.ts for `publicDir` option
Expected: No custom `publicDir` setting, which means default behavior applies

**Step 2: Run production build locally**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 3: Verify games are in dist directory**

Run: `ls -la dist/playground/games/`
Expected: Word Search directory present with all assets

**Step 4: Test production build locally**

Run: `npm run preview`
Expected: Preview server starts on port 3000

**Step 5: Test games in preview mode**

Run: Open `http://localhost:3000/#playground/games` in browser
Expected: Word Search loads and functions correctly

**Step 6: Commit if any config changes were needed**

```bash
git add vite.config.ts
git commit -m "chore: verify Vite build configuration includes games directory"
```

---

<!-- Simon Says tasks removed: game no longer included -->

<!-- Removed file references related to Simon Says -->

**Step 1: Replace SCSS variable declarations with CSS custom properties**

The inline styles use SCSS syntax like `var(--black): #1D1F20;` which should be `--black: #1D1F20;` in CSS.

Find lines 21-33 and replace:

```css
// case and center panel colors
var(--black): #1D1F20;
var(--silver): #f5f4f4;

// large button colors
// picked directly from a sample image
var(--green): #00911C;
var(--red): #FE0111;
var(--blue): #0065CA;
var(--yellow): #F1C200;

// LCD and strict light colors
var(--LCD): #430710;
var(--on): #DC0D29;
```

With:

```css
:root {
  /* case and center panel colors */
  --black: #1D1F20;
  --silver: #f5f4f4;

  /* large button colors - picked directly from a sample image */
  --green: #00911C;
  --red: #FE0111;
  --blue: #0065CA;
  --yellow: #F1C200;

  /* LCD and strict light colors */
  --LCD: #430710;
  --on: #DC0D29;
}
```

**Step 2: Remove SCSS color functions**

SCSS functions like `tint()`, `darken()`, `lighten()` need to be replaced with actual color values. This is complex, so we'll use a simpler approach: calculate the colors manually.

For `--switch-color` at line 433:

Replace:
```css
var(--switch-color): darken(red,5%);
```

With:
```css
:root {
  --switch-color: #E6010F; /* red darkened by 5% */
}
```

**Step 3: Replace color function usages with CSS calc or direct values**

This step requires replacing all instances of `tint()`, `darken()`, and `lighten()` throughout the styles. Since the CSS is embedded and complex, the most practical approach is to pre-calculate these values.

Create a helper reference for color values needed:

- `tint(--black,3%)` → `#222426`
- `darken(--green,3%)` → `#008B1A`
- `tint(--green,30%)` → `#4DB95F`
- `tint(--green,20%)` → `#33AD43`
- `lighten(--green,32%)` → `#7FD98E`
- And so on for all color variations...

**Alternative Step 3 (Simpler): Use style.css file instead of inline**

Instead of fixing all SCSS functions, link to the pre-compiled style.css file that already exists:

Replace the inline `<style>` tag (lines 7-468) with:

```html
<link rel="stylesheet" href="style.css">
```

<!-- Removed test and commit steps related to Simon Says appearance -->

---

## Task 5: Deploy to Vercel and Verify Production

**Files:**
- None (deployment task)

**Step 1: Verify all changes are committed**

Run: `git status`
Expected: "nothing to commit, working tree clean"

**Step 2: Push to main branch**

Run: `git push origin main`
Expected: Push succeeds

**Step 3: Monitor Vercel deployment**

Run: Check Vercel dashboard or wait for deployment webhook
Expected: Build succeeds, deployment goes live

**Step 4: Test production games**

Run: Open `https://your-domain.vercel.app/#playground/games` in browser
Expected: Both games load correctly with all assets and functionality

**Step 5: Test both games thoroughly on production**

Manual testing checklist:
<!-- Simon Says checklist items removed -->
- [ ] Word Search loads with correct font
- [ ] Word Search grid displays properly
- [ ] Word Search mouse drawing works
- [ ] Word Search word detection works

**Step 6: Create final commit if production issues found**

If any production-specific issues are discovered, fix them and repeat deployment.

```bash
git add .
git commit -m "fix: resolve production-specific issues for games"
git push origin main
```

---

## Verification Checklist

After completing all tasks, verify:

<!-- Simon Says dev checklist removed -->
- [ ] Word Search game loads in local dev (localhost:3000)
- [ ] Both games load in local preview build (npm run preview)
- [ ] Both games load in Vercel production
- [ ] All external dependencies (jQuery, Buzz.js, Bootstrap Switch, fonts) load correctly
- [ ] No console errors in browser dev tools
- [ ] Game functionality works completely (sounds, interactions, win/loss states)
- [ ] CSS styling appears correct (no unstyled elements)
- [ ] Mobile responsiveness maintained (if applicable)

---

## Notes for Engineer

**Why Games Weren't Loading:**

1. **Missing Dependencies**: The HTML files were generated from CodePen demos which assume jQuery and other libraries are loaded by the CodePen environment. When moved to standalone files, these dependencies must be explicitly included.

2. **Inlining**: Word Search CSS/JS are inlined during build for portability.

3. **Build System**: Vite automatically copies `public/` to `dist/`, so no build configuration changes were needed. The issue was purely with the HTML files themselves.

**Testing Strategy:**

- Test locally first (dev server)
- Test with preview build (simulates production)
- Deploy to Vercel
- Test on actual production URL

**Debugging Tips:**

- Open browser DevTools Console to see missing resource errors
- Check Network tab to verify CDN resources load (200 status)
- Verify iframe sandbox attribute allows scripts and same-origin
- Check Vercel build logs if deployment fails
