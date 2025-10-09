# Responsive Breakpoint Audit (Desktop as Source of Truth)

## Key Findings
1. ✅ **768px overlap removed** – Mobile resume rules now stop at `max-width: 767px`, allowing Tailwind `md:` utilities to take over without double-applied padding or typography at the tablet breakpoint.【F:src/styles/components.css†L2282-L2320】
2. ✅ **Tablet layout preserves the desktop split view** – A dedicated `768px–1023px` tablet query keeps the resume/chat panels side-by-side with right-sized gaps and suggestion chip columns, while mobile continues to stack with safe-area padding.【F:src/styles/components.css†L2641-L2696】【F:src/styles/components.css†L2698-L2725】
3. ✅ **Large screens gain richer project density** – The projects grid now expands to a third column on `lg`/`xl` viewports with enhanced hover affordances for wide displays, making better use of desktop real estate.【F:src/components/ProjectsPage.ts†L21-L29】【F:src/components/ProjectCard.ts†L110-L118】【F:src/styles/components.css†L1072-L1173】
4. ✅ **Layout spacing tokens centralised** – Shared custom properties drive main-content padding and chat safe-area offsets across breakpoints, replacing per-component tweaks and aligning mobile/tablet treatments with the desktop baseline.【F:src/styles/components.css†L1-L14】【F:src/styles/components.css†L290-L329】【F:src/styles/components.css†L916-L939】【F:src/components/ChatInput.ts†L184-L222】【F:src/components/Layout.ts†L67-L88】

## Audit Goals
- Document how current breakpoints reinterpret the desktop-first design system so future tweaks honour the “desktop bible.”
- Flag areas where tablet and mobile diverge early, giving designers a short list to validate before the next build.
- Provide a QA matrix that product can reference when validating responsive fixes.

## Breakpoint Inventory
- **Tailwind design tokens** define the canonical breakpoints (`sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px). These drive all `md:` utility shifts and the JavaScript desktop check (`matchMedia('(min-width: 768px)')`).【F:tailwind.config.js†L106-L112】【F:src/components/Layout.ts†L23-L152】
- **Component-level CSS** layers bespoke queries on top of Tailwind utilities:
  - `@media (min-width: 768px)` cements the sidebar as static desktop chrome and suppresses the hamburger trigger.【F:src/styles/components.css†L385-L403】【F:src/components/MobileNav.ts†L262-L281】
  - `@media (max-width: 767px)` pins the chat input/footer and pads the scroll area to respect safe areas.【F:src/styles/components.css†L916-L933】
  - `@media (max-width: 767px)` reflows resume spacing and forces the download CTA full-width while keeping mobile typography aligned with desktop tokens.【F:src/styles/components.css†L2282-L2320】
  - `@media (max-width: 767px)` collapses the resume/chat split view into a stacked column, tightening suggestion chip widths, with a secondary clamp at 640px.【F:src/styles/components.css†L2641-L2696】
  - `@media (min-width: 768px) and (max-width: 1023px)` maintains the two-column resume/chat layout with balanced gaps and three-up suggestion chips for tablets.【F:src/styles/components.css†L2698-L2725】

## Viewport QA Matrix
| Viewport | Layout Baseline | Key Behaviour | Desktop Parity Risk |
| --- | --- | --- | --- |
| ≤639px (`sm-`) | Single-column layout with floating mobile nav trigger and fixed chat input footer.【F:src/components/Layout.ts†L67-L90】【F:src/components/MobileNav.ts†L262-L281】【F:src/components/ChatInput.ts†L184-L222】 | Safe-area padding prevents overlap; chat messages max at 80% width for readability.【F:src/styles/components.css†L916-L933】【F:src/components/ChatMessage.ts†L24-L39】 | Low – mobile patterns are intentional, but ensure typography still echoes desktop hierarchy.【F:src/components/WelcomeCard.ts†L7-L18】 |
| 640–767px (`sm`→`md`) | Still single-column, but Tailwind typography and spacing scale up for hero, resume, and projects sections.【F:src/components/ProjectsPage.ts†L7-L29】【F:src/components/Resume.ts†L316-L340】 | Chat remains pinned; suggestion chips gain desktop padding yet stay centre-aligned until `md`.【F:src/styles/components.css†L916-L933】【F:src/components/SuggestionChips.ts†L54-L93】 | Low – mobile resume clamp hands off cleanly at 768px now that the custom query stops at 767px.【F:src/styles/components.css†L2282-L2320】 |
| 768–1023px (`md`→`lg`) | Layout flips to two-column sidebar + content; projects grids hold two or three columns depending on viewport width; resume/chat stay side-by-side via the tablet breakpoint.【F:src/components/Layout.ts†L67-L90】【F:src/components/ProjectsPage.ts†L21-L29】【F:src/styles/components.css†L2698-L2725】 | Desktop nav chrome fully replaces mobile overlay; chat container spacing uses shared tablet padding tokens.【F:src/styles/components.css†L385-L403】【F:src/styles/components.css†L936-L939】 | Low – parity now matches the desktop bible, with only visual QA left to validate gutters and copy fit.【F:src/styles/components.css†L2698-L2725】 |
| ≥1024px (`lg+`) | Sidebar + main content two-column grid persists; projects expand to a third column and desktop hover affordances intensify to match available real estate.【F:src/components/Layout.ts†L67-L90】【F:src/components/ProjectCard.ts†L110-L118】【F:src/styles/components.css†L1072-L1173】 | Suggestion chips left-align with expanded padding; chat suggestions return to inline density.【F:src/components/SuggestionChips.ts†L54-L93】【F:src/styles/components.css†L2698-L2725】 | Low – wide screens now leverage the extra column, leaving only future experimentation for masonry variants.【F:src/components/ProjectsPage.ts†L21-L29】【F:src/styles/components.css†L1072-L1173】 |

## Recommended Next Actions
1. ✅ Prototype a `tablet` breakpoint to keep resume/chat side-by-side while preserving mobile safe-area behaviour below 768px.【F:src/styles/components.css†L2698-L2725】
2. ✅ Update resume queries to `max-width: 767px` so 768px exactly matches the desktop bible without conflicting styles.【F:src/styles/components.css†L2282-L2320】
3. ✅ Explore `lg`/`xl` grid variants for projects and boost hover states on wide viewports.【F:src/components/ProjectsPage.ts†L21-L29】【F:src/components/ProjectCard.ts†L110-L118】【F:src/styles/components.css†L1072-L1173】
4. ⏳ Schedule screenshot QA at the four core widths and annotate deviations, feeding into a shared design QA doc before code changes land.【F:src/components/ChatContainer.ts†L37-L49】【F:src/components/SuggestionChips.ts†L54-L93】
