# WalleGPT Portfolio Product Requirements Document

## 1. Background
- WalleGPT evolves into a personal, conversational portfolio site that mirrors Wally's voice and visual style.
- The experience should feel like a bespoke ChatGPT wrapper, grounded in curated portfolio content and tone extracted from the RAG corpus Wally supplies.
- Goal: give recruiters, collaborators, and curious visitors a fast, delightful way to explore Wally's work and personality.

## 2. Objectives
1. Present Wally's portfolio highlights in an interactive chat-first interface that reflects his authentic tone.
2. Allow visitors to discover projects, skills, and background context within 3 or fewer interactions.
3. Provide maintainable content workflows so Wally can update knowledge and tone without touching code.
4. Showcase design sensibilities through a polished, on-brand UI that works on desktop and mobile.

## 3. Success Metrics
- Engagement: >60% of sessions trigger at least one chat exchange or suggestion chip tap.
- Discoverability: >70% of unique visitors view or receive information about at least two distinct portfolio collections (e.g., Projects + For Fun).
- Responsiveness: perceived latency under 1.5s for chat responses and <500ms for navigation transitions on broadband.
- Maintainability: new content uploads (projects, tone corpus) reflected on the site within <10 minutes without developer intervention.

## 4. Target Audience & Use Cases
- **Recruiters / Hiring Managers**: scan projects, validate skills, request contact info, feel Wally's personality.
- **Peers & Collaborators**: learn Wally's capabilities, explore past UX work, identify partnership angles.
- **Casual Visitors**: browse For Fun content, understand Wally's story, engage with playful chat prompts.
- Core use cases: ask "What did you ship at X?", browse featured projects, request resume, explore transition from UX to current focus, get a quick bio.

## 5. Experience Principles
- **Authentic Voice**: every interaction should feel unmistakably Wally; the tone engine must honor phrasing, humor, and pacing from the uploaded corpus.
- **Delightfully Efficient**: visitors obtain key answers quickly, with suggestion chips and smart defaults guiding them.
- **Show, Don't Tell**: pair conversational responses with visual project cards, timeline snippets, and rich media when available.
- **Respectful Transparency**: cite or preview the underlying portfolio snippet for confidence; gracefully answer "unknown" when data is missing.

## 6. Content & Tone Strategy
- Content sources: projects, resume, personal fun facts, roadmap/plans.
- Tone extraction pipeline:
  - On ingestion, analyze the RAG documents to identify lexical signatures (phrases, metaphors, pacing) and emotional cues.
  - Store tone attributes alongside semantic embeddings for retrieval.
  - Inject tone tokens/prompts into LLM calls to keep responses consistent; allow manual overrides for critical messaging (e.g., contact instructions).
- Content format: maintain structured JSON/MDX files with fields for summary, detailed narrative, metrics, media assets, visibility flags, and tone tags.

## 7. Functional Requirements
### 7.1 Chat Hero
- Prominent greeting card replicating the wireframe: introduction, input box, suggestion chips, featured projects.
- Real-time chat with streaming responses; surface inline citations or "view source" actions.
- Quick actions: copy response, share link, escalate to email CTA.

### 7.2 Navigation & Layout
- Left sidebar with sections: Projects, Resume, For Fun (customizable labels).
- Sticky contact block featuring name, email (with antispam obfuscation), optional socials.
- Responsive design: two-column layout on desktop, collapsible drawer + floating chat on mobile.

### 7.3 Suggestion Chips & Prompts
- Curated starting prompts (e.g., "What should I know about your latest project?", "How did you transition from UX?").
- Chips adapt based on visitor pathway (e.g., recruiters vs. casual detected via query intent).
- Configurable via JSON to avoid redeployments.

### 7.4 Portfolio Highlights
- Featured project grid under chat with thumbnail, title, tags; clicking opens modal or dedicated page with narrative and call-to-action.
- Support embedding media (images, video links) and application links.

### 7.5 Knowledge & Tone Engine
- Local store containing curated snippets + tone metadata, chunked to 400-600 tokens with 80-120 overlap (tunable).
- Retrieval layer selects top_k=6, reranks to 3, enforces at least one supporting doc per claim.
- Response generator uses OpenAI Responses API (or similar) with tool schema for `search_corpus`, `fetch_doc`, `redact`.
- Tone injection logic merges retrieved snippets with extracted phrasing cues; fallback to generic but friendly tone if coverage <0.45 confidence.

### 7.6 Content Maintenance
- Upload pipeline (CLI or admin panel) to add new RAG documents: auto-chunk, embed, tag tone.
- Simple config for navigation labels, chip prompts, featured project order.
- Documented workflow for refreshing embeddings and redeploying static assets.

### 7.7 Analytics & Instrumentation
- Track key interactions: chat submit, suggestion chip click, project open, resume download, contact CTA.
- Optional session replay limited to UI interactions (no chat transcript storage by default).
- Dashboard or lightweight reporting to review engagement metrics and tone alignment.

### 7.8 Accessibility & Localization
- WCAG 2.1 AA compliance: keyboard navigation, sufficient contrast, ARIA roles for chat components.
- Support for screen-reader friendly chat transcripts and alt text on media.
- Localization-ready copy architecture even if initial launch is English-only.

## 8. Non-Functional Requirements
- **Performance**: LCP <2.0s on broadband, LLM response streaming begins <1s after request when model latency allows.
- **Reliability**: degrade gracefully if LLM or embedding service fails (display offline message, allow static browsing).
- **Security & Privacy**: redact PII flagged in metadata; secure API keys via environment variables; rate limit chat to prevent abuse.
- **Scalability**: architecture should support future integration of additional tools (e.g., calendar booking, newsletter signup).

## 9. Dependencies & Risks
- Dependence on OpenAI (or chosen provider) availability and pricing.
- Tone extraction accuracy hinges on quality/coverage of uploaded corpus; risk of inconsistent voice if data sparse.
- Large media assets may inflate load times; need optimization strategy.
- Existing repo state shows large deletions—must coordinate to avoid conflicts when integrating with broader codebase.

## 10. Release Plan
- **MVP (Weeks 1-3)**: static navigation, chat wrapper with curated knowledge base, tone injection baseline, featured projects, analytics instrumentation.
- **Beta Polish (Weeks 4-5)**: responsive refinements, animation polish, advanced tone tuning, improved RAG eval suite, accessibility audits.
- **Future Enhancements**: seasonal theming, audio intro, live status updates, newsletter subscription, recruiter-specific share links.

## 11. Open Questions
- Preferred deployment platform (Vercel, Netlify, custom)?
- How frequently will content/tone uploads happen and who owns that process?
- Requirements for gating or password-protecting sensitive materials?
- Need for downloadable PDF resume vs. interactive view only?
