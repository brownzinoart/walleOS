# WalleGPT Agent Design

## 1. Overview
WalleGPT powers the conversational layer of Wally's portfolio site. The agent blends curated portfolio knowledge with tone extracted from Wally's own writing to deliver authentic, helpful answers in a chat-first UI.

## 2. Agent Goals
- Highlight projects, skills, and personal story in a voice that feels unmistakably Wally.
- Route visitors to the right artifacts (project pages, resume, contact) within a few turns.
- Provide transparent, cited answers grounded in the portfolio corpus.
- Gracefully handle unknowns, sensitive requests, or off-topic questions.

## 3. Persona & Voice Guidelines
Derived from tone analysis of the uploaded RAG corpus:
- **Voice**: upbeat, candid, lightly witty; uses conversational contractions and concrete examples.
- **Pacing**: short paragraphs, purposeful line breaks, avoids long monologues.
- **Signature Moves**: references impact metrics when available, invites the user to explore visuals, offers quick follow-up prompts.
- **Boundaries**: no disclosure of personal contact details beyond whitelisted channels; no speculation outside verified records; redirect medical/legal/financial questions.

## 4. Tone Extraction Pipeline
1. **Ingestion**: new documents (projects, case studies, blog posts) are chunked (400-600 tokens, 80-120 overlap) and embedded.
2. **Tone Mining**:
   - Run keyword and sentiment extraction to capture phrases, metaphors, humor markers.
   - Cluster high-salience n-grams and sentences; label with tone tags (e.g., `playful`, `direct`, `reflective`).
   - Store tone vectors alongside semantic embeddings.
3. **Prompt Conditioning**:
   - For each response, retrieve supporting snippets and associated tone tags.
   - Inject tone hints into the system prompt (e.g., `Use Wally's upbeat, candid tone with concise sentences and concrete examples`).
   - Provide seed phrases when high-confidence tone matches exist; otherwise, fall back to default persona instructions.
4. **Feedback Loop**: allow manual overrides and collect analytics on tone alignment to refine prompts and tagging rules.

## 5. Tools & Data Sources
- `search_corpus(q, top_k=6)` → returns document IDs, metadata, tone tags.
- `fetch_doc(id)` → fetches full snippet for grounding and citations.
- `get_snippet(tag)` → retrieves reusable voice seeds (e.g., signature phrases).
- `redact(text)` → masks PII flagged as sensitive unless explicitly whitelisted.
- Data stores: `resume`, `projects`, `skills`, `timeline`, `plans`, plus optional `for_fun`.

## 6. Conversation Architecture
- Built as a LangGraph (or comparable) workflow with the following nodes:
  1. **Intent Classifier**: categorize request into project, skill, timeline, personal, or out-of-scope.
  2. **Retriever**: query relevant stores based on intent; rerank results; ensure minimum confidence threshold.
  3. **Tone Composer**: aggregate tone tags and select prompt modifiers.
  4. **Responder**: call OpenAI Responses API with structured output contract and tool schemas.
  5. **Fallback Handler**: trigger clarifying question or "Unknown in current records" message when confidence <0.45.
  6. **Suggestion Generator**: craft up to three follow-up prompts using current context.

## 7. Prompt & Output Contract
- **System Prompt Skeleton**:
  - Role: WalleGPT, recruiter-friendly portfolio guide.
  - Constraints: cite at least one supporting document per claim; respect tone instructions; use inline markers `[n]` that map to citations.
  - Safety: block PII unless whitelisted, decline medical/legal/financial advice.
- **User Prompt Handling**: include visitor message, detected intent, retrieved snippets, tone cues, and recent conversation history (bounded by memory rules).
- **Output Format**:
  ```json
  {
    "answer": "string",
    "citations": [{"doc_id":"string","title":"string","url":"string"}],
    "confidence": 0.0-1.0
  }
  ```
- Inline markers `[1]`, `[2]` link to citation URLs; confidence reflects hit density × agreement × recency.

## 8. Conversation Patterns
- **Welcome Flow**: greet user in Wally's voice, recommend two prompts, highlight latest project card.
- **Recruiter Quick Scan**: summarize top 2 roles with impact metrics, offer resume download, surface contact CTA.
- **Project Deep Dive**: when user asks "Tell me about Project X", fetch case study, share problem → actions → results, link to visuals, offer follow-up such as "Want the design deck?".
- **Career Narrative**: respond to transition questions with timeline snippets and reflective tone.
- **Fun Fact Mode**: lighten tone, reference `for_fun` store, always check visibility flag before sharing.
- **Fallback**: if query ambiguous or unsupported, ask single clarifying question; if still unresolved, respond with "Unknown in current records".

## 9. Memory & Context Handling
- Stateless by default between sessions; within a session maintain last 6 turns or 2,500 tokens.
- Thread IDs map to conversation sessions (per LangGraph memory saver) to support resume conversations when desired.
- For returning users, optionally preload personalized suggestions based on prior analytics (future enhancement).

## 10. Evaluation & Monitoring
- Automated RAG evals using hit rate/MRR to validate retrieval quality per corpus.
- Tone alignment score: sample chats scored manually or via classifier to ensure voice consistency.
- Guardrail tests: prompt injection attempts, PII leakage checks, off-topic requests.
- Instrumentation through LangSmith (or equivalent) to trace each retrieval + response path.

## 11. Maintenance Playbook
- When new content arrives:
  1. Place documents in ingestion folder.
  2. Run embedding + tone extraction script.
  3. Review generated tone tags; adjust as needed.
  4. Update navigation config / featured cards.
  5. Redeploy site or refresh cache.
- Schedule quarterly tone audits to keep persona instructions aligned with latest writing.

## 12. Future Enhancements
- Multi-agent orchestration (e.g., research sub-agent for live search, writer agent for newsletter blurbs).
- Personalization layer detecting recruiter vs. peer to adjust tone intensity.
- Audio or video companion responses using same tone metadata.

