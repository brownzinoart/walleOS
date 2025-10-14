# Context7 MCP Integration

This project now exposes a thin proxy around the [Upstash Context7 MCP server](https://github.com/upstash/context7) so you can pull the latest framework and library documentation directly into WallyGPT workflows.

## 1. Configure Environment

Copy `.env.example` to `.env` if you have not already done so, then add an API key (optional but recommended for higher limits and private projects):

```bash
CONTEXT7_API_BASE_URL=https://context7.com/api
CONTEXT7_API_KEY=ctx7sk_your_key_here   # optional
CONTEXT7_CLIENT_IP_KEY=0001020304...1f  # optional 64-char hex string
```

- `CONTEXT7_API_BASE_URL` defaults to the public SaaS API — override if you self-host.
- `CONTEXT7_API_KEY` unlocks higher quotas and private repos. Keys start with `ctx7sk`.
- `CONTEXT7_CLIENT_IP_KEY` (64 hex chars) encrypts client IP addresses sent to Context7; omit it to send plain IPs.

Restart the backend (`npm run dev` inside `server/`) after updating env vars.

## 2. Available API Endpoints

With the server running on `http://localhost:3001`, the following proxy endpoints are available:

| Endpoint | Purpose | Example |
| --- | --- | --- |
| `GET /api/context7/search?q=<query>` | Resolve package names to Context7 library IDs. | `/api/context7/search?q=react` |
| `GET /api/context7/docs?id=<libraryId>[&tokens=5000][&topic=intro]` | Retrieve latest documentation snippets. | `/api/context7/docs?id=/vercel/next.js&tokens=6000` |

- `tokens` is optional (defaults to 5,000) and is clamped between 1,000–20,000 tokens.
- `topic` lets you narrow docs to a specific area (e.g. `routing`).
- Responses bubble up Context7 errors (401, 404, 429) with actionable messages.

## 3. Frontend Helpers

`src/services/api.ts` exposes strongly-typed helpers:

- `searchContext7Libraries(query)` → `Context7SearchResponse`
- `fetchContext7Documentation({ id, tokens?, topic? })` → `Context7DocumentationResult`

These utilities wrap request retry logic and input validation, so components can pull documentation without duplicating fetch code.

## 4. Example Usage

```ts
import { searchContext7Libraries, fetchContext7Documentation } from '@/services/api';

const { results } = await searchContext7Libraries('astro');
if (results.length) {
  const docs = await fetchContext7Documentation({ id: results[0].id, tokens: 4000 });
  console.log(docs.content);
}
```

The returned content can be injected into prompts before calling Ollama, giving the chat agent up-to-date library context.

## 5. Troubleshooting

- **401 Unauthorized** → Double-check `CONTEXT7_API_KEY` (keys start with `ctx7sk`).
- **429 Rate Limited** → Reduce requests or add an API key.
- **404 Not Found** → The library ID may be wrong or unpublished; re-run a search to verify.
- **Encryption warnings** → If you set `CONTEXT7_CLIENT_IP_KEY`, make sure it is exactly 64 hex characters.

For deeper MCP usage (e.g., running Context7 via `npx` in an IDE), consult the upstream [Context7 README](https://github.com/upstash/context7/blob/master/README.md).
