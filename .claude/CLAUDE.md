# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

WalleOS is a conversational portfolio site combining RAG-powered chat with a brutalist/neon design system. The frontend is a Vite + TypeScript SPA; the backend is an Express server with dual LLM providers (GLM/Gemini), LanceDB vector search, and Google Gemini embeddings.

**Key Characteristics:**
- **Split Architecture:** Frontend deploys to Vercel; backend runs locally or on separate hosting
- **RAG Pipeline:** Markdown corpus → chunking → embeddings → LanceDB → semantic retrieval
- **Dual LLM Failover:** Primary GLM (glm-4.6), fallback Gemini (gemini-2.5-flash)
- **Performance Optimized:** Recent optimizations achieved -50-60% latency, -32% API costs via caching

---

## Essential Commands

### Frontend Development
```bash
# Development server (frontend only, uses mock responses without backend)
npm run dev                    # Runs on http://localhost:3000

# Build + type check
npm run build                  # Builds games, runs tsc --noEmit, builds Vite

# Preview production build
npm run preview

# Linting
npm run lint                   # ESLint with TypeScript
npm run lint:fix               # Auto-fix issues

# Testing
npm run test                   # Vitest run
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
npm run test:e2e               # Playwright E2E tests
```

### Backend Development
**All backend commands run from `server/` directory:**

```bash
cd server

# Development server with hot reload
npm run dev                    # Runs on http://localhost:3001

# Build TypeScript
npm run build                  # Compiles to dist/

# Production server
npm run start                  # Runs compiled dist/index.js

# Vector DB ingestion
npm run ingest                 # Ingest corpus with default settings
npm run ingest:force           # Force re-ingestion (overwrites existing)
npm run ingest:dry-run         # Validate without writing

# Test RAG retrieval
npm run test:rag               # Interactive RAG query testing
```

### Full Stack Development (from root)
```bash
# Run both frontend + backend concurrently
npm run dev:all                # Runs "concurrently" for both servers

# Setup infrastructure (ingestion + warm up)
npm run dev:infra              # Prepares vector DB

# Complete setup and start
npm run up                     # Runs dev:infra then dev:all

# Vector DB ingestion (from root)
npm run ingest:corpus          # Uses default Gemini embeddings
npm run ingest:gemini          # Explicit Gemini provider
```

---

## Architecture Overview

### Frontend Architecture (`src/`)

**Core Systems:**
- **Router:** Client-side SPA routing via `src/utils/router.ts` with hash-based navigation
- **Components:** Web Components pattern in `src/components/` (Layout, Sidebar, ChatContainer, ProjectCard, etc.)
- **State Management:** Observable pattern in `src/utils/chatState.ts` for reactive chat UI
- **Content:** JSON-driven via `src/config/content.json` with TypeScript types in `src/config/content.ts`

**Key Files:**
- `src/main.ts` - Entry point, initializes router and layout
- `src/utils/router.ts` - Hash-based routing with route definitions
- `src/utils/chatState.ts` - Chat state management with observer pattern
- `src/config/content.json` - Resume, projects, branding (source of truth)
- `src/config/chatPills.ts` - Suggestion chips loaded from `docs/chat-pills.md`

**Design System:**
- Design tokens in `src/styles/design-tokens.css`
- Tailwind config extends tokens in `tailwind.config.js`
- Fonts: Space Grotesk (headings), JetBrains Mono (code/technical)
- Colors: Dark neutrals + neon cyan/magenta/lime/orange

### Backend Architecture (`server/`)

**Request Flow:**
```
POST /api/chat
  ↓
chatGateway.ts (provider selection + failover)
  ↓
promptBuilder.ts (build system + user prompts with RAG)
  ↓
ragService.ts (retrieve context from vector DB)
  ↓
vectorStore.ts (LanceDB search)
  ↓
LLM streaming (GLM or Gemini via SSE)
```

**Core Services:**

1. **chatGateway.ts** - LLM provider orchestration
   - Primary: GLM (`glm-4.6`)
   - Fallback: Gemini (`gemini-2.5-flash`)
   - Handles failover on errors

2. **promptBuilder.ts** - Prompt construction
   - `buildSystemPrompt()` - RAG-enhanced with narrative context (cached)
   - `buildUserPromptWithRAG()` - Retrieves relevant chunks per query
   - Loads content from `src/config/content.json`

3. **ragService.ts** - Semantic retrieval
   - `retrieveContext()` - Main RAG entry point
   - `preprocessQuery()` - Query expansion (simplified for short queries only)
   - `rerankResults()` - Category-based re-ranking with boost terms

4. **vectorStore.ts** - LanceDB interface
   - `search()` - Vector similarity search
   - `add()` - Bulk insert chunks
   - `getStats()` - Corpus statistics

5. **embeddingService.ts** - Gemini embeddings
   - `generateEmbedding()` - Single embedding (with LRU cache)
   - `generateEmbeddings()` - Batch generation
   - Model: `text-embedding-004` (768 dimensions)

6. **documentProcessor.ts** - Corpus ingestion
   - Parses markdown with YAML frontmatter
   - Chunks at sentence boundaries (~640 tokens, 80 token overlap)
   - Extracts metadata: category, tags, experienceIds

**Optimization Layer (Recently Added):**
- `server/utils/lruCache.ts` - Reusable LRU cache with TTL
- Embedding cache (500 entries, 1hr TTL) in `embeddingService.ts`
- Narrative context cache (1hr TTL) in `promptBuilder.ts`
- RAG health check cache (1min TTL) in `promptBuilder.ts`
- See `OPTIMIZATION_SUMMARY.md` for details

**API Endpoints:**
- `POST /api/chat` - Streaming chat (Server-Sent Events)
- `GET /api/health` - Backend + LLM provider health

### Vector Database (LanceDB)

**Location:** `server/data/vectordb/` (gitignored, generated locally)

**Schema:**
```typescript
{
  id: string,
  content: string,
  embedding: number[],  // 768-dimensional
  sourceFile: string,
  category: string,     // narrative, portfolio, experience, resume, etc.
  tags: string[],
  priority: number,
  experienceIds?: string[]
}
```

**Ingestion Pipeline:**
1. Read markdown files from `wallymo_llm_corpus/`
2. Parse YAML frontmatter for metadata
3. Chunk text at sentence boundaries
4. Generate embeddings via Gemini API
5. Insert into LanceDB with normalized vectors

**Refresh After Content Changes:**
```bash
# From root
npm run ingest:corpus

# Or from server/ with options
cd server
npm run ingest:force          # Overwrites existing DB
```

---

## Environment Configuration

Copy `.env.example` to `.env` and configure:

**LLM Providers:**
- `GLM_API_KEY` - Zhipu AI API key
- `GEMINI_API_KEY` - Google Gemini API key
- `LLM_PRIMARY_PROVIDER` - Default: `glm`
- `LLM_FALLBACK_PROVIDER` - Default: `gemini`

**Server:**
- `SERVER_PORT` - Default: `3001`
- `FRONTEND_URL` - CORS origin (default: `http://localhost:3000`)

**Frontend:**
- `VITE_API_URL` - Backend URL (set to empty string for mock mode in production)

**RAG Configuration (optional environment variables):**
- `RAG_CHUNK_MAX_TOKENS` - Default: 640
- `RAG_CHUNK_MIN_TOKENS` - Default: 160
- `RAG_CHUNK_OVERLAP_TOKENS` - Default: 80

---

## Content Management

### Resume & Portfolio Data
**File:** `src/config/content.json`

Contains branding, resume experiences, skills, and projects. This is the source of truth for both frontend display and backend prompt building.

**Update Process:**
1. Edit `content.json`
2. Frontend hot-reloads automatically in dev mode
3. Backend requires restart to pick up changes
4. Keep resume PDF in `/public/resume.pdf` in sync

### Chat Suggestion Chips
**File:** `docs/chat-pills.md`

Markdown table defining suggestion chips (id, prompt, category, route, experienceId). Loaded by frontend via `src/config/chatPills.ts`.

**Update Process:**
1. Edit `docs/chat-pills.md`
2. Re-run corpus ingestion: `npm run ingest:corpus`
3. Frontend hot-reloads chip config

### RAG Corpus
**Location:** `wallymo_llm_corpus/`

Markdown files with YAML frontmatter. Categories: narrative, portfolio, experience, resume, skills, faq, funfacts, metrics.

**Frontmatter Schema:**
```yaml
---
category: experience
tags: ["ai", "design-systems"]
experienceIds: ["founder-one-block-away"]
priority: 1.0
---
```

**Update Process:**
1. Add/edit markdown files in `wallymo_llm_corpus/`
2. Re-run ingestion: `npm run ingest:corpus`
3. Vector DB regenerates at `server/data/vectordb/`

---

## Development Workflows

### Adding a New Chat Feature

1. **Frontend State:** Update `src/utils/chatState.ts` for new state
2. **Component:** Add/modify component in `src/components/`
3. **Backend Endpoint:** Add route in `server/routes/`
4. **Service Layer:** Implement logic in `server/services/`
5. **Test:** Add tests in `src/__tests__/` or `server/services/__tests__/`

### Modifying RAG Retrieval

1. **Query Processing:** `server/services/ragService.ts` - `preprocessQuery()`
2. **Vector Search:** `server/services/vectorStore.ts` - `search()` options
3. **Re-ranking:** `server/services/ragService.ts` - `rerankResults()`
4. **Prompt Injection:** `server/services/promptBuilder.ts` - `buildUserPromptWithRAG()`

### Optimizing Performance

**Current Optimizations (see `OPTIMIZATION_SUMMARY.md`):**
- Embedding cache reduces API calls by ~60-70%
- Narrative context cache eliminates redundant RAG queries
- Vector search oversampling reduced from 2x to 1.3x
- Query preprocessing simplified (only expands short queries)

**Debugging Performance:**
- Check server logs for cache hit rates
- Monitor vector search times in logs
- Use `npm run performance` to analyze bundle sizes
- Backend logs timing for each RAG phase

### Adding New LLM Provider

1. Create service file: `server/services/[provider].ts`
2. Implement streaming interface matching `gemini.ts` or `glm.ts`
3. Add provider config to `server/config/env.ts`
4. Update `server/services/chatGateway.ts` to include new provider
5. Update `.env.example` with new provider keys

---

## Testing Strategy

### Frontend Tests
- **Unit:** Vitest for utils and components
- **E2E:** Playwright for user flows
- **Run:** `npm run test` or `npm run test:e2e`

### Backend Tests
- **RAG Testing:** `cd server && npm run test:rag`
- **Manual:** Use curl or Postman against `/api/chat`

### RAG Quality Testing
```bash
cd server
npm run test:rag

# Interactive prompts:
# - Test queries
# - View retrieved chunks
# - Check confidence scores
# - Verify category filtering
```

---

## Deployment

### Frontend (Vercel)
- Auto-deploys from Git via Vercel dashboard
- Uses `vercel.json` config
- Set `VITE_API_URL` to empty string for production (uses mock responses)
- Build command: `npm run build`

### Backend (Separate Hosting Required)
Backend is **NOT deployed to Vercel**. Host separately on:
- Railway
- Render
- DigitalOcean App Platform
- Any Node.js hosting with persistent storage

**Requirements:**
- Node 18+
- Environment variables from `.env.example`
- Vector DB must be regenerated on host (run `npm run ingest:corpus` post-deploy)
- Or: commit vector DB to Git (not recommended due to size)

---

## Troubleshooting

### Backend Won't Start
- **Check:** Ollama running? (Only if using Ollama, not needed for GLM/Gemini)
- **Check:** `.env` file exists in `server/` directory
- **Check:** Valid API keys for GLM and Gemini
- **Fix:** `cd server && npm install` to ensure dependencies installed

### Vector DB Missing/Corrupt
```bash
# Regenerate from root
npm run ingest:corpus

# Or force rebuild
cd server
npm run ingest:force
```

### Chat Returns Mock Responses
- **Cause:** Frontend cannot reach backend at `VITE_API_URL`
- **Check:** Backend running on correct port (default 3001)
- **Check:** CORS configured correctly (`FRONTEND_URL` in `.env`)
- **Check:** Browser console for fetch errors

### RAG Returns Low-Quality Results
1. Check corpus coverage: `cd server && npm run test:rag`
2. Verify category tags in frontmatter
3. Adjust `preprocessQuery()` logic in `ragService.ts`
4. Re-run ingestion after corpus changes
5. Check embedding cache hits (may need cache clear)

### TypeScript Errors After Updates
```bash
# Frontend
npm run type-check

# Backend
cd server
npx tsc --noEmit
```

### Performance Regressions
- Review `OPTIMIZATION_SUMMARY.md` for baseline metrics
- Check server logs for cache hit rates
- Monitor embedding API call counts
- Use `npm run performance` for bundle analysis

---

## Key Architectural Decisions

1. **Why Dual LLM Providers?**
   - GLM primary for cost efficiency
   - Gemini fallback for reliability
   - Automatic failover on errors

2. **Why LanceDB?**
   - Embedded vector DB (no separate server)
   - Fast similarity search
   - File-based (good for small-medium corpora)

3. **Why Gemini for Embeddings?**
   - Modern model (text-embedding-004)
   - Good quality for semantic search
   - Integrated with chat fallback provider

4. **Why No Framework on Frontend?**
   - Portfolio site doesn't need React/Vue complexity
   - Vanilla TS gives full control over performance
   - Faster load times, smaller bundle

5. **Why Split Frontend/Backend Deployment?**
   - Vercel doesn't support persistent storage (vector DB)
   - Backend LLM inference better on dedicated hosting
   - Allows independent scaling

---

## Important File Locations

**Configuration:**
- `src/config/content.json` - Resume, projects, branding
- `docs/chat-pills.md` - Suggestion chip definitions
- `wallymo_llm_corpus/` - RAG corpus markdown files
- `.env` - Backend environment (gitignored)
- `.env.example` - Template with defaults

**Critical Backend Files:**
- `server/services/chatGateway.ts` - LLM provider orchestration
- `server/services/promptBuilder.ts` - Prompt construction with RAG
- `server/services/ragService.ts` - Semantic retrieval logic
- `server/services/vectorStore.ts` - LanceDB interface
- `server/services/embeddingService.ts` - Gemini embeddings
- `server/utils/lruCache.ts` - Caching infrastructure

**Critical Frontend Files:**
- `src/main.ts` - Application entry point
- `src/utils/router.ts` - Client-side routing
- `src/utils/chatState.ts` - Chat state management
- `src/components/Layout.ts` - Main layout shell
- `src/components/ChatContainer.ts` - Chat UI

**Documentation:**
- `README.md` - Getting started, tech stack
- `docs/PRD.md` - Product requirements
- `docs/agents.md` - Agent design and architecture
- `OPTIMIZATION_SUMMARY.md` - Recent performance optimizations
- `docs/DEPLOYMENT.md` - Deployment architecture

---

## Code Style & Conventions

- **TypeScript:** Strict mode enabled
- **Imports:** Use `.js` extensions in imports (ESM requirement)
- **Components:** Web Components pattern with TypeScript
- **State:** Observable pattern for reactive updates
- **Naming:** camelCase for functions/variables, PascalCase for classes/components
- **Exports:** Named exports preferred over default exports
- **Async:** Use async/await over promise chains

**Linting:** Run `npm run lint` before commits. Configured with ESLint + TypeScript plugin.
