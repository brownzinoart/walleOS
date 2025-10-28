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

## Vector Database in Deployment
The Lance-based vector database is not committed to Git and must be generated within the target environment. Include the ingestion script as part of your deployment or initialization process so retrieval features work immediately after rollout.

- **Source corpus:** `wallymo_llm_corpus/`
- **Ingestion script:** `server/scripts/ingestCorpus.ts`

### When to Generate
- **Deploy-time (recommended):** Run the ingestion as a post-deploy task or init job where all dependencies (LLM service, filesystem permissions) are available. This avoids long first-request latency.
- **Build-time:** Possible in container builds if the LLM/model and data are accessible during the image build. Be mindful of large image sizes and external service access during CI.
- **On first request:** Lazy generation keeps deploys fast but introduces cold-start latency and potential concurrency issues. If chosen, guard with a lock to prevent multiple ingestions.
- **Content refreshes:** Any edits to `docs/chat-pills.md` or the `wallymo_llm_corpus/` directory should trigger a fresh ingestion so the deployed index mirrors the latest answers.

### How to Run
Execute one of the following in the deployment environment:

```bash
# If an npm script exists
npm run ingest:corpus

# Or run the TypeScript script directly
npx ts-node server/scripts/ingestCorpus.ts
```

### Environment & Storage Considerations
- **Ollama/LLM availability:** Ensure the LLM endpoint is reachable from the deployment target, or swap to your production provider.
- **Paths & permissions:** The generated database writes to `server/data/vectordb/`. Provide a writable directory and persist it across releases (container volume or host path).
- **Ephemeral filesystems:** If using serverless or ephemeral disks, mount persistent storage or generate at startup into a persistent volume.
- **Backups & restore:** For production, snapshot or archive `server/data/vectordb/` as part of backup routines. Restoring the directory fully restores the index.

### Pipeline Integration
- Add an explicit ingestion step to your CD pipeline (e.g., init container, post-deploy job, or one-off task) that runs before traffic is shifted.
- Monitor the job duration and surface logs so failures block rollout rather than silently degrading retrieval quality.

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
