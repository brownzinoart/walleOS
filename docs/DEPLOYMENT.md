# Deployment Guide

## Overview
The WallyGPT frontend deploys as a static single-page application on Vercel. The accompanying Express + Ollama backend is intended for local development and prototyping only. Production deployments should point the frontend at a separately hosted backend or a managed LLM provider that aligns with the roadmap to swap in a different service.

## Frontend Deployment (Vercel)
- **Build pipeline:** Vercel runs `npm ci --ignore-scripts` followed by `npm run build`, outputting static assets in `dist/`.
- **Environment variables:** None required for production today. When no `VITE_API_URL` is configured the frontend falls back to mock responses for chat interactions.
- **Routing:** `vercel.json` keeps a single SPA rewrite so non-asset routes serve `index.html`.
- **Caching:** Static assets receive immutable caching headers; `index.html` remains uncached for fast rollbacks.

## Backend Deployment (Future)
- **Current state:** The Express server in `server/` integrates with a locally running Ollama instance for experimentation.
- **Production plan:** Replace the local Ollama dependency with a production-ready provider (e.g., OpenAI, Anthropic, hosted LLM service) before going live. Host the backend on a platform suited for long-running services such as Railway, Render, or DigitalOcean.
- **Separation:** Vercel ignores the `server/` directory, so deploying the frontend does not provision or run the backend. Provision and secure the backend independently when ready.

## Local Development
1. **Install frontend deps:** Run `npm install` in the project root.
2. **Install backend deps:** `cd server && npm install`.
3. **Start backend:** From `server/`, run `npm run dev` (requires Ollama and the specified model locally).
4. **Start frontend:** In the root, run `npm run dev` to launch the Vite dev server on `http://localhost:3000`.
5. **Connect frontend:** Ensure `VITE_API_URL` points to the backend (defaults to `http://localhost:3001/api`) so the chat UI reaches the local API.

## Troubleshooting
- **Vercel build failures:** Confirm the backend dependencies live only in `server/package.json` and that the `server/` directory is listed in `.vercelignore`.
- **CORS issues:** Verify `FRONTEND_URL` in your backend `.env` matches the origin you are testing from.
- **Ollama connection errors:** Ensure the Ollama service is running (`ollama serve`) and the target model is pulled (`ollama pull llama3.1:8b-instruct`). Update `OLLAMA_HOST` if you use a non-default port or remote host.
