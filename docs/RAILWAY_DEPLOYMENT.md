# Railway Deployment Guide

This guide covers deploying the WalleOS backend to Railway.

## Overview

- **Platform**: Railway.app
- **Architecture**: Backend-only deployment (server/ directory)
- **Frontend**: Deployed separately on Vercel
- **Database**: LanceDB vector database (committed to git)

## Prerequisites

1. Railway account connected to your GitHub repository
2. All environment variables configured (see below)
3. Vector database generated locally (`npm run ingest:corpus`)

## Quick Start

### 1. Initial Setup

From Railway dashboard:

1. Create new project from GitHub repository
2. Set **Root Directory** to: `/server`
3. Railway will auto-detect Node.js and use `railway.toml` config

### 2. Environment Variables

Set these in Railway dashboard (Settings → Variables):

```bash
# LLM Providers (configure at least one)
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_CHAT_MODEL=claude-sonnet-4-20250514

GEMINI_API_KEY=AIzaSy...
GEMINI_CHAT_MODEL=gemini-2.0-flash
GEMINI_EMBED_MODEL=text-embedding-004

OPENAI_API_KEY=sk-proj-...
OPENAI_CHAT_MODEL=gpt-4o

# Provider Configuration
LLM_PRIMARY_PROVIDER=anthropic
LLM_FALLBACK_PROVIDER=openai
LLM_TERTIARY_PROVIDER=gemini

# Server Configuration
SERVER_PORT=3001
FRONTEND_URL=https://walle-os.vercel.app

# Logging
LOG_LEVEL=info
```

**Note**: Railway automatically sets `PORT` - your app should use `process.env.PORT` or fall back to `SERVER_PORT`.

### 3. Deploy

Push to your main branch:

```bash
git add .
git commit -m "feat: configure Railway deployment"
git push origin main
```

Railway will automatically:

1. Detect changes
2. Run `npm run build:railway` (copies content.json, builds TypeScript)
3. Start with `node dist/index.js`
4. Monitor health at `/api/health`

### 4. Verify Deployment

After deployment completes, run the verification script:

```bash
cd server
npm run verify:deployment https://your-app.railway.app
```

Or set the URL as an environment variable:

```bash
export RAILWAY_DEPLOYMENT_URL=https://your-app.railway.app
npm run verify:deployment
```

This checks:

- ✅ Ping endpoint (`/api/health/ping`)
- ✅ Full health check (`/api/health`)
- ✅ Chat streaming (`/api/chat`)

## Architecture Details

### Build Process

Railway executes: `npm run build:railway`

This script (`server/scripts/prepareRailwayBuild.ts`):

1. Copies `src/config/content.json` → `server/config/content.json`
2. Verifies vector database exists at `server/data/vectordb/`
3. Runs TypeScript compilation (`tsc`)

### Start Process

Railway executes: `node dist/index.js`

This:

1. Preloads `content.json` for prompt building
2. Connects to LanceDB at `server/data/vectordb/`
3. Starts Express server on `PORT` (Railway-provided)
4. Enables health check monitoring

### File Structure on Railway

```
/app/                           (Railway working directory)
  ├── config/
  │   ├── content.json          ← Copied during build
  │   ├── env.ts
  │   └── ragSchema.ts
  ├── data/
  │   └── vectordb/             ← Committed to git
  │       └── wallymo_chunks.lance
  ├── dist/                     ← TypeScript compiled output
  │   ├── index.js
  │   ├── app.js
  │   ├── services/
  │   └── ...
  └── node_modules/
```

## Vector Database Strategy

**Current Approach**: Vector database is committed to git.

**Why?**

- Portfolio content changes infrequently
- Instant deployment (no build-time ingestion)
- No Gemini API calls during deployment
- Fastest startup time

**Trade-offs**:

- Larger repository size (~10-50MB)
- Must regenerate locally after corpus changes
- Less dynamic than on-demand ingestion

### Updating the Vector Database

When you update content in `wallymo_llm_corpus/`:

```bash
# From project root
npm run ingest:corpus

# Verify ingestion
cd server
npm run test:rag

# Commit the updated database
git add server/data/vectordb/
git commit -m "chore: update vector database for corpus changes"
git push origin main
```

Railway will deploy the updated database automatically.

## Troubleshooting

### Build Fails: "Cannot find module '/app/dist/index.js'"

**Cause**: TypeScript compilation didn't run or failed.

**Fix**:

1. Check build logs for TypeScript errors
2. Verify `railway.toml` has `buildCommand = "npm run build:railway"`
3. Test locally: `cd server && npm run build:railway`

### Build Fails: "Unable to locate content.json"

**Cause**: `src/config/content.json` missing from repository.

**Fix**:

1. Ensure `src/config/content.json` exists in root
2. Verify it's not gitignored
3. Check build script at `server/scripts/prepareRailwayBuild.ts`

### Build Fails: "Vector database not found"

**Cause**: `server/data/vectordb/` is gitignored or not committed.

**Fix**:

1. Check `.gitignore` allows `server/data/vectordb/`
2. Run `npm run ingest:corpus` locally
3. Commit: `git add server/data/vectordb/ && git commit -m "chore: add vector DB"`

### Runtime Error: "LLM provider unavailable"

**Cause**: Missing or invalid API keys.

**Fix**:

1. Verify environment variables in Railway dashboard
2. Check provider status via `/api/health`
3. Ensure at least one provider (primary, fallback, or tertiary) has valid credentials

### Health Check Fails

**Cause**: Railway health check timing out or returning errors.

**Fix**:

1. Check Railway logs for startup errors
2. Verify `/api/health` works locally
3. Increase `healthcheckTimeout` in `railway.toml` (currently 100ms)
4. Check if LLM providers are accessible from Railway network

### Chat Returns Empty Responses

**Cause**: RAG retrieval failing or vector DB corrupt.

**Fix**:

1. Check logs for RAG errors
2. Regenerate vector DB: `npm run ingest:corpus`
3. Test RAG locally: `cd server && npm run test:rag`
4. Verify embeddings API key (Gemini) is valid

## Monitoring

### Health Endpoints

- **Ping**: `GET /api/health/ping` - Simple liveness check
- **Full**: `GET /api/health` - Checks all LLM providers + embeddings

### Logs

View real-time logs:

```bash
# Using Railway CLI
railway logs

# Or from Railway dashboard: Deployments → [Latest] → View Logs
```

### Metrics

Railway provides:

- CPU usage
- Memory usage
- Network traffic
- Request counts

Access via: Dashboard → Metrics

## Environment Variables Reference

| Variable                | Required    | Default                    | Description                                                 |
| ----------------------- | ----------- | -------------------------- | ----------------------------------------------------------- |
| `ANTHROPIC_API_KEY`     | Conditional | -                          | Anthropic API key (required if using Claude)                |
| `ANTHROPIC_CHAT_MODEL`  | No          | `claude-sonnet-4-20250514` | Claude model to use                                         |
| `GEMINI_API_KEY`        | Yes         | -                          | Google Gemini API key (required for embeddings)             |
| `GEMINI_CHAT_MODEL`     | No          | `gemini-2.0-flash`         | Gemini chat model                                           |
| `GEMINI_EMBED_MODEL`    | No          | `text-embedding-004`       | Gemini embedding model                                      |
| `OPENAI_API_KEY`        | Conditional | -                          | OpenAI API key (required if using GPT)                      |
| `OPENAI_CHAT_MODEL`     | No          | `gpt-4o`                   | OpenAI model to use                                         |
| `LLM_PRIMARY_PROVIDER`  | No          | `anthropic`                | Primary LLM provider (`anthropic`, `openai`, `gemini`)      |
| `LLM_FALLBACK_PROVIDER` | No          | `openai`                   | Fallback LLM provider                                       |
| `LLM_TERTIARY_PROVIDER` | No          | `gemini`                   | Tertiary LLM provider                                       |
| `SERVER_PORT`           | No          | `3001`                     | Server port (Railway sets `PORT` automatically)             |
| `FRONTEND_URL`          | Yes         | -                          | Frontend URL for CORS (e.g., `https://walle-os.vercel.app`) |
| `LOG_LEVEL`             | No          | `info`                     | Logging level (`debug`, `info`, `warn`, `error`)            |

## Advanced Configuration

### Custom Build Command

Edit `railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build:railway && npm run custom-task"
```

### Custom Start Command

Edit `railway.toml`:

```toml
[deploy]
startCommand = "node --max-old-space-size=512 dist/index.js"
```

### Health Check Tuning

Edit `railway.toml`:

```toml
[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 200  # Increase if LLM checks are slow
healthcheckInterval = 30   # Check every 30 seconds
```

### Railway CLI

Install for local debugging:

```bash
npm install -g @railway/cli
railway login
railway link  # Link to your project
railway run npm run dev  # Run with Railway env vars
```

## CI/CD Integration

Railway auto-deploys on push to main. For additional control:

### Deploy Specific Branch

Railway Settings → Deployment:

- **Branch**: `production` (or any branch)
- **Auto Deploy**: Enabled

### Deploy on Tag

Create a tag:

```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

Railway Settings → Deployment → **Deploy on Tag**: Enabled

### Deploy Previews

Railway automatically creates preview deployments for pull requests.

Access via: PR Checks → Railway → View Deployment

## Cost Optimization

- **LLM Providers**: Use lower-cost models for fallback (e.g., `gpt-4o-mini`, `gemini-1.5-flash`)
- **Caching**: Embeddings and narrative context are cached (see `server/services/embeddingService.ts`)
- **Rate Limiting**: Configured at `server/middleware/rateLimiter.ts`
- **Vector DB**: Committed to git = no ingestion costs on deploy

## Security Checklist

- ✅ Environment variables stored in Railway (not in code)
- ✅ CORS configured to allow only frontend URL
- ✅ Rate limiting enabled
- ✅ Security headers applied (`server/middleware/securityHeaders.ts`)
- ✅ No sensitive data in logs
- ✅ API keys never committed to git

## Support

- **Railway Issues**: https://railway.app/help
- **Project Issues**: https://github.com/your-username/walleOS/issues
- **Railway Docs**: https://docs.railway.app

## Next Steps

1. ✅ Deploy backend to Railway
2. Configure frontend `VITE_API_URL` to point to Railway URL
3. Test end-to-end chat flow
4. Monitor logs and metrics
5. Set up alerts for downtime (Railway Pro)

---

**Last Updated**: November 2024
**Railway Version**: Nixpacks builder
**Node Version**: 18+
