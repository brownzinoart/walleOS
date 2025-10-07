# WalleGPT Portfolio

WalleGPT is Wally's conversational portfolio experience that fuses Gen Z Pop neon energy with unapologetic Brutalist structure. Phase 1 establishes the technical and visual foundation for the chat-first interface described in the product requirements.

## Project Overview
- Product requirements: [`docs/PRD.md`](docs/PRD.md)
- Conversational agent architecture: [`docs/agents.md`](docs/agents.md)
- Resume content populated from Wally's professional background, showcasing 10+ years across AI implementation, UX design leadership, and account management with highlights in AI/LLM strategy, design systems, enterprise UX, and pharmaceutical marketing

## Tech Stack
- Vite for rapid development and optimized builds
- TypeScript for type safety and future scalability
- Tailwind CSS for a utility-first design system with custom tokens
- Vanilla TypeScript application shell (framework-free for now)

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start development server**
   ```bash
   npm run dev
   ```
   The site runs at `http://localhost:3000` with network access enabled for device testing.
3. **Build for production**
   ```bash
   npm run build
   ```
4. **Preview production build**
   ```bash
   npm run preview
   ```

## Project Structure
- `src/main.ts` – application entry point and future UI bootstrapper
- `src/styles/` – Tailwind layer setup, design tokens, and typography utilities
- `src/config/` – JSON-driven content plus typed accessors and validation helpers
- `docs/` – PRD, agent architecture, and foundational research materials

## Design System
- **Palette:** dark neutrals anchored by neon cyan, magenta, lime, and orange accents
- **Typography:** Space Grotesk for bold geometric expression, JetBrains Mono for technical voice
- **Tokens:** defined in `src/styles/design-tokens.css` and surfaced through Tailwind (`tailwind.config.js`)
- **Shadows & Radius:** offset brutalist shadows with sharp-corner defaults

## Content Management
- Update structured content in `src/config/content.json`
- Non-resume placeholder fields are wrapped in brackets (e.g., `[Your tagline here]`); replace them with real data
- Type definitions live in `src/config/content.ts` for editor autocomplete
- Run `npm run dev` and watch the console for `[content-warning]` messages indicating remaining placeholders
- Resume PDF is available at `/public/resume.pdf`; keep it in sync with `src/config/content.json`

## Development Roadmap
1. Foundation (current): tooling, tokens, and content schema
2. Layout & Navigation: sidebar scaffold and responsive grid
3. Chat Interface: conversation loop, prompt chips, and persona tuning
4. Project Cards: rich media modules with stateful details
5. Animations & Polish: micro-interactions, performance tuning, accessibility audit

## Performance Goals
- Largest Contentful Paint (LCP): < 2.0s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Lighthouse score: 95+

## Performance Toolkit
- CSS containment (`contain: layout style`) on root containers limits paint scope and keeps layout thrash under control.
- Targeted `will-change` hints are injected and released via `@/utils/performance` helpers to avoid long-lived memory pressure.
- Animations and drag interactions run through `requestAnimationFrame` throttles to guarantee 60fps without layout thrash.
- A lightweight loading overlay coordinates with `document.fonts.ready` so content only fades in after critical fonts resolve.
- Reduced motion preferences are respected globally; the app swaps to instant transitions and disables kinetic effects when the OS flag is set.
- `measurePerformance()` instrumentation logs render durations in development, making regressions easy to spot.

## Browser Compatibility
- Optimised for the latest releases of Chrome, Edge, Firefox, and Safari (both desktop and iOS).
- Graceful fallbacks:
  - `IntersectionObserver` gated features (card/chip entrances) degrade to static content when the API is unavailable.
  - Ripple effects and smooth scrolling fall back to instant interactions when `prefers-reduced-motion` is detected.
  - Custom scrollbars are wrapped in `::-webkit-scrollbar`/standard rules so unsupported engines keep default UI.
- Verified behaviour on touch devices (iOS Safari, Android Chrome) thanks to pointer-safe listeners and touch-action hints.

## Accessibility
- Skip link jumps directly to `#main-content` and announces itself with a high-contrast pill.
- Sidebar navigation announces the active section via an `aria-live` region and toggles `aria-current="page"` for assistive tech.
- Every interactive element retains visible focus rings powered by global focus tokens.
- Suggestion chips and nav items respond equally to keyboard (Enter/Space) and pointer activation.
- Chat viewport updates broadcast through polite live regions so screen readers stay in sync with the conversation.
- Visual adjustments (keyboard offset, reduced motion, loader spin suppression) respect OS accessibility preferences.

## Animation Guidelines
- Default micro-interactions run at 150–200 ms with ease-in-out curves to echo the brutalist snap.
- Entrance sequences (`fadeInUp`, chip stagger, card slide-in) trigger only once per viewport entry and are skipped entirely for reduced-motion visitors.
- 3D tilts and ripples keep transforms GPU-friendly (translate/rotate/scale) and release hints immediately after interaction.
- Loader and spinner animations are opt-in only at boot; routine interactions avoid blocking content.

## Development Notes
- Use `npm run dev` for iterative work; the loader ensures fonts are ready before interactions fire.
- Run `npm run build && npm run preview` to generate a production bundle and spot check the static output.
- Combine `npm run build` with Lighthouse in Chrome or `npm run preview` + `npx @lhci/cli autorun` for repeatable performance scoring.
- Toggle reduced motion from the OS accessibility settings to verify the low-motion path; the app mirrors the preference automatically.
- `src/utils/performance.ts` centralises debounce, throttle, rafThrottle, and instrumentation utilities—reuse them for future features.

## Troubleshooting
- **Loader never disappears** – ensure fonts load correctly; flaky network fonts can be replaced or hosted locally.
- **Animations feel sluggish** – check for stray `will-change` assignments; `removeWillChange(element)` frees the hint immediately.
- **Sidebar not scoring active sections** – confirm each section exposes `id` or `data-section-id` that matches the navigation config.
- **Scroll sticks on mobile** – verify `visualViewport` is available; fallback behaviour scrolls inputs into view when unavailable.

## Deployment

### Deploy to Vercel

This project is configured for seamless deployment on Vercel.

#### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Vercel will auto-detect the Vite framework and use the settings from `vercel.json`
5. Click "Deploy"

#### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` for a preview deployment
3. Run `vercel --prod` for a production deployment

#### Configuration

The project includes a `vercel.json` configuration file that:
- Sets the correct build command with TypeScript type-checking
- Configures SPA routing fallback
- Optimizes caching for static assets

#### Environment Variables

If your project requires environment variables, add them in the Vercel dashboard under Project Settings → Environment Variables.

#### Custom Domain

To add a custom domain, go to Project Settings → Domains in the Vercel dashboard.

## Contributing
- Lint with `npm run lint` (ESLint + TypeScript)
- Follow Conventional Commits
- Branch off `main` for features, submit PRs with linked issue/context
