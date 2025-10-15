# For Fun Page Implementation Plan

## Phase 1: Discovery
1. **Inventory CodePen interactions** — Capture DOM hierarchy, animation timings, hover states, and data fields (brand, model, stats, CTA) from the accordion slider to guide parity.  
   - Files/Modules: External reference only.
2. **Audit navigation & routing** — Confirm how hash routes are registered and activated so the new page behaves like existing dedicated sections, including how navigation items are sourced from content.  
   - Files/Modules: `src/utils/router.ts`, `src/components/Sidebar.ts`, `src/components/Layout.ts`, `src/main.ts`, `src/config/content.json`.
3. **Review styling primitives & assets** — Verify Tailwind tokens, typography scales, and current asset pipeline to match neon gradients and blur overlays.  
   - Files/Modules: `tailwind.config.js`, `src/styles/main.css`, `public`.

## Phase 2: Implementation
1. **Extend router & navigation** — Register `#forfun` in the router map, add the nav item to the shared content config, ensure sidebar/mobile nav treat it as a routed page, and broadcast active state changes. Update the home render switch in `getMainContent`/route-change handlers so the new component mounts.  
   - Files/Modules: `src/config/content.json`, `src/config/content.ts`, `src/utils/router.ts`, `src/components/Sidebar.ts`, `src/components/MobileNav.ts`, `src/components/Layout.ts`, `src/main.ts`.
2. **Define slider content model** — Create typed data for panels (titles, copy, stats, image URLs) and wire it into the existing content export surface.  
   - Files/Modules: `src/config/forFunContent.json`, `src/config/forFunContent.ts`, `src/config/content.ts`, `src/types/index.d.ts`.
3. **Build `ForFunPage` template** — Render the accordion structure via template string, applying Tailwind utilities for layout, blur, gradients, and responsive stacking.  
   - Files/Modules: `src/components/ForFunPage.ts`.
4. **Implement slider state manager** — Port hover/click logic into a utility with keyboard support, reduced-motion fallbacks, and cleanup hooks for hot reload, reusing existing perf helpers (`prefersReducedMotion`, `rafThrottle`, `debounce`).  
   - Files/Modules: `src/utils/performance.ts`, `src/utils/accordionSlider.ts`, `src/components/ForFunPage.ts`, `src/main.ts`.
5. **Translate custom styles** — Map CodePen CSS variables/timing functions into Tailwind config, create component-specific layers for perspective and glassmorphism effects, and reuse design tokens.  
   - Files/Modules: `tailwind.config.js`, `src/styles/main.css`, `src/styles/components/_for-fun.css`.
6. **Prepare media assets** — Import optimized background imagery, add responsive sources, and update build pipeline to copy them.  
   - Files/Modules: `public/images/for-fun/*`, `vite.config.ts`.

## Phase 3: QA
1. **Functional verification** — Manually test slide expansion, focus trapping, keyboard navigation, cleanup-on-route-change, and sidebar/mobile active states while monitoring console errors.  
   - Files/Modules: `src/components/ForFunPage.ts`, `src/utils/accordionSlider.ts`, `src/main.ts`, `src/components/Sidebar.ts`, `src/components/MobileNav.ts`.
2. **Accessibility review** — Validate logical tab order, ARIA roles for carousel semantics, and `prefers-reduced-motion` handling; ensure contrast on neon text.  
   - Files/Modules: `src/components/ForFunPage.ts`, `src/styles/main.css`.
3. **Performance hardening** — Lazy load background images, debounce resize observers, and guard transitions with RAF helpers to avoid layout thrash.  
   - Files/Modules: `src/utils/performance.ts`, `src/components/ForFunPage.ts`.
4. **Automated checks** — Add unit smoke test for route rendering, hash navigation coverage in Playwright, run lint/type/test suites, and capture before/after Lighthouse snapshot.  
   - Files/Modules: `tests/forfun.spec.ts`, `tests/e2e/forfun.spec.ts`, `package.json` scripts.

## Phase 4: Launch Readiness
1. **Integrate into shell** — Ensure layout initialization mounts the page, updates breadcrumb/title metadata, and resets chat context when navigating to `#forfun`; document cleanup hooks for slider timers/observers.  
   - Files/Modules: `src/main.ts`, `src/components/Layout.ts`, `src/utils/chatState.ts`, `src/utils/accordionSlider.ts`.
2. **Documentation & content updates** — Refresh navigation copy, sitemap, metadata, and public docs to reference the new page, imagery credits, and any analytics hooks.  
   - Files/Modules: `src/config/content.json`, `docs/README.md`, `public`.
3. **Release checklist** — Execute `npm run build`, smoke `npm run preview`, package assets for deployment pipeline, and run Lighthouse on the new route.  
   - Files/Modules: `package.json`, `dist`.

## Decisions & Inputs
1. Imagery: custom assets will be provided later; ensure the implementation accepts swapped backgrounds/icons without structural changes.  
2. Mobile behavior: maintain the CodePen stacked layout as the responsive default; no separate no-JS fallback required beyond graceful degradation.  
3. Content model: treat each card as bespoke static copy—no localization or CMS integration planned.
