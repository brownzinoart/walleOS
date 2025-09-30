# WalleOS

Terminal-inspired landing experience for showcasing AI coding and LLM implementation projects. Built with a modern Next.js 15 + React 19 stack tuned for smooth motion, cinematic scroll effects, and future WebGL enhancements.

## Tech Stack
- Next.js 15 (App Router) + React 19
- Tailwind CSS v4 (PostCSS, CSS-first directives)
- shadcn/ui component system
- Motion, GSAP + ScrollTrigger animations
- React Three Fiber + drei helpers for 3D scenes
- Lenis for buttery smooth scrolling
- Netlify for automated deployments

## Getting Started
1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment
This project targets Netlify with the Next.js Runtime v5 via `@netlify/plugin-nextjs`. Pushing to the default branch will trigger automatic builds and deploys.

## Project Structure
- `app/` — Next.js App Router entry points, layouts, and routes
- `app/globals.css` — Tailwind v4 directives, Lenis styles, and terminal theme tokens
- `components/` — Shared React components (populated via shadcn/ui in future phases)
- `lib/` — Utility helpers and shared logic
- `public/` — Static assets served at the site root

## License
MIT © WalleOS
