# Chat Pill Responses

Pre-composed answers for the home-page suggestion chips so the UI can display a response without making a fresh API request. Each pill maps to the `suggestionChips` array in `src/config/content.json`.

| Chip ID | Prompt | Suggested Response |
| --- | --- | --- |
| `ai-implementation` | How do you implement AI workflows in real projects? | I treat LLMs as teammates, start with problem framing, then pick a best-fit model mix (Claude for UX/UI, Gemini for deep research and planning, local runners via Ollama when data sensitivity matters, Codex for backend tasks..etc). From there I wire function-calling prompts, guardrails, and a LanceDB or pgvector store, then ship evaluation harnesses so teams can observe drift. The goal is useful automation, not hype—human sign-off stays in the loop where stakes are high. |
| `design-systems-leadership` | Tell me about scaling design systems and teams | At Kinesso I co-built the Splash design system while scaling the org from 2 to 30 designers. We paired atomic tokens with a governance council, weekly remix critiques, and Design Bot audits so engineers trusted component fidelity. The result: faster releases, less QA churn, and shared ownership instead of siloed style guides. |
| `portfolio-awards` | What awards have you won for your design work? | Splash and DXA earned Red Dot 2021 plus Indigo trophies in 2022 (2× Gold, 2× Silver, 1× Bronze) and 2023 (3× Gold, 2× Silver). Those weren’t vanity plaques—they recognized measurable lifts like DXA shrinking audits from weeks to <24 hours and Splash driving reuse +79%. |
| `current-ventures` | What are WeReady and ListingPal? | Both live under my studio, One Block Away. WeReady scores startup readiness across code, business, investment, and design pillars using 65+ cited data sources. ListingPal is an AgentSelect™-powered workflow that gives agents a full MLS/SEO/social/pads package in ~90 seconds, replacing the 3–5 tools they normally juggle. |
| `llm-orchestration-approach` | Walk me through your approach to LLM orchestration | AgentSelect™ is the pattern: classify the task, dispatch to the cheapest capable model, then reconcile tone with a post-processor before delivery. I log latency, cost, and qualitative feedback so routing keeps improving. That architecture powers ListingPal and informs WeReady’s evidence summaries. |
| `research-vs-prototyping` | How do you balance user research with rapid prototyping? | I run discovery sprints that alternate—day 1 interviews, day 2 synthesis, day 3 clickable prototypes, day 4 validation. Research stays lightweight but continuous. The Splash program survived because research artifacts lived in Figma next to components, so moving fast never meant skipping insight. |
| `growing-design-teams` | What's your philosophy on growing design teams effectively? | Hire for systems thinking and coaching, not just pixels. I pair new hires with playbooks (research scripts, token libraries) and set up weekly remix sessions so juniors learn in the open. Ops basics—intake funnels, hot sheets, shared briefs—keep delivery predictable even as headcount grows. |
| `pharma-to-ai-journey` | What led you from pharma advertising to AI implementation? | Pharma gave me stakeholder discipline: FDA reviews, KOL summits in Dubai, multimillion campaigns. I pivoted into UX to fix the product gaps I kept seeing, then into AI when orchestration finally made “faster + safer” realistic. One Block Away is where those threads meet—measurable impact with responsible automation. |
| `current-development-toolkit` | What's in your current development toolkit these days? | TypeScript + Vite on the front, Node/Express or Cloud Run microservices on the back, pgvector/LanceDB for embeddings, Tailwind for UI velocity, and Playwright/Vitest for guardrails. For AI work I keep LangChain, LlamaIndex, and custom prompt registries in reach, wrapped with CLI scripts so iteration is quick. |
| `complex-challenge-solved` | Describe a complex technical challenge you've solved recently? | ListingPal needed MLS-friendly copy, social tone shifts, and paid-ad punch—all in one pass. I split the job into asynchronous prompt lanes, used AgentSelect™ to pick the right model per asset, and added evaluation prompts that flag compliance issues before they ship. Now agents get a polished package in minutes with far fewer revisions. |
| `ai-design-vision` | Where do you see AI-powered design tools heading next? | We’re moving from single-model co-pilots to orchestration layers that understand business context. Design systems will ship with embedded agents auditing consistency, suggesting variants, and citing data so teams trust them. My focus is making that assistive, not autonomous—AI should widen a designer’s creative bandwidth, not overwrite judgment. |
| `staying-current-tech` | How do you stay current with emerging technologies today? | I block weekly “signal scans” across arXiv, VC decks, and open-source repos, then prototype the promising ideas inside One Block Away mini-projects. Speaking with founders through WeReady keeps market reality in check, and teaching others forces me to translate hype into usable playbooks. |

## Update Workflow

- **Frontend sync** happens automatically. `src/config/chatPills.ts` parses this table at build time, and `src/config/content.ts` hydrates `suggestionChips` plus `mockResponses` so the UI mirrors whatever you write here.
- **Backend/RAG sync** still needs a refresh. After changing this table (or any document inside `wallymo_llm_corpus/`), regenerate embeddings so the vector store sees the new copy:

  ```bash
  npm run ingest:corpus
  ```

- **Safety net tests:** run the targeted check to confirm every chip picked up the latest prompt/response pair:

  ```bash
  npm run test src/__tests__/chat-pills-config.test.ts
  ```

- **Adding a new chip?** Include the new row here first. The hydration step will auto-create a `general` category chip if it doesn’t already exist in `src/config/content.json`; adjust the category there if you need a more specific bucket.

> **Implementation note:** if you want these to render inside the chat UI, convert the table to the data structure your front-end expects (for example, preload them in a local map keyed by chip ID).
