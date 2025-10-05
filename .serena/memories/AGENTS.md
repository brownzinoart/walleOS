# Repository Guidelines

## Project Structure & Module Organization

- `src/main.ts` – Application entry point and UI bootstrapper
- `src/components/` – HTML render helpers and component logic
- `src/config/` – JSON-driven content with typed accessors (`content.json`, `content.ts`)
- `src/styles/` – Tailwind CSS layers, design tokens, and typography utilities
- `src/utils/` – Performance helpers and shared utility functions
- `src/types/` – TypeScript type definitions
- `docs/` – Product specifications, architecture docs, and research materials
- `public/` – Static assets and public files
- `dist/` – Production build output

## Build, Test, and Development Commands

- `npm install` – Install project dependencies
- `npm run dev` – Start development server at `http://localhost:3000` with network access
- `npm run build` – Type-check and build for production
- `npm run preview` – Preview production build locally
- `npm run lint` – Run ESLint on TypeScript files
- `npm run lint:fix` – Auto-fix ESLint issues
- `npm run type-check` – Run TypeScript type checking without emitting files
- `npm run test` – Run unit tests with Vitest
- `npm run test:watch` – Run tests in watch mode
- `npm run test:coverage` – Generate test coverage report
- `npm run test:e2e` – Run end-to-end tests with Playwright
- `npm run prepare` – Run type-check, lint, and test sequence
- `npm run deploy` – Full preparation and build deployment pipeline

## Coding Style & Naming Conventions

- **TypeScript-first** codebase with strict type checking enabled
- Use **ESLint** with `@typescript-eslint` rules enforced
- **Prefer-const** rule enforced (error level)
- **No explicit `any`** types (warning level) – use proper typing
- Unused variables allowed with underscore prefix (`_variable`)
- Components return **template strings** for markup generation
- Use **Tailwind utility classes** aligned with design tokens
- Keep comments **minimal and purposeful**
- Follow existing naming patterns in the codebase

## Testing Guidelines

- **Vitest** for unit testing with jsdom environment
- **Playwright** for end-to-end testing
- Test files should follow patterns: `*.test.ts`, `*.spec.ts`
- Coverage reporting available via `npm run test:coverage`
- Tests run in watch mode during development with `npm run test:watch`
- UI testing available with `npm run test:ui`

## Commit & Pull Request Guidelines

- Follow **Conventional Commits** specification
- Branch off `main` for feature development
- Submit PRs with linked issues and context
- Run `npm run prepare` before creating PRs
- Include relevant screenshots for UI changes
- Ensure all tests pass and linting is clean
- Performance regressions should be noted in PR descriptions

## Performance & Accessibility

- Target Lighthouse score of 95+
- Use CSS containment and `will-change` hints judiciously
- Respect reduced motion preferences system-wide
- Ensure proper ARIA labels and keyboard navigation
- Test on both desktop and mobile browsers
- Monitor LCP (< 2.0s), FID (< 100ms), CLS (< 0.1) metrics