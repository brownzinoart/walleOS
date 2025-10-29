# WALLY MOSTAFA – RAG SCHEMA

## Implementation Details

```yaml
schema_version: 2.0
last_updated: 2025-10-29

# Vector Database
vector_db:
  provider: LanceDB
  table_name: wallymo_chunks
  database_path: server/data/vectordb
  normalize_embeddings: true
  similarity_metric: cosine

# Embedding Configuration
embedding:
  provider: Google Gemini API
  model: text-embedding-004
  dimensions: 768
  batch_processing: sequential
  max_retries: 3
  retry_backoff: exponential

# Chunking Strategy
chunking:
  method: semantic_sentence_based
  max_tokens: 640  # configurable 240-1200 via RAG_CHUNK_MAX_TOKENS
  min_tokens: 160  # configurable 60-max via RAG_CHUNK_MIN_TOKENS
  overlap_tokens: 80  # configurable 0-max/2 via RAG_CHUNK_OVERLAP_TOKENS
  token_estimation: 1_token_per_4_chars

# Retrieval Configuration
retrieval:
  top_k_default: 6
  rerank_k: 3
  min_confidence: 0.05  # lowered to accommodate embedding score distribution

# Context-Aware Category Priority Weighting
ranking_priority:
  homepage_chat:
    narrative: 1.0
    portfolio: 0.95
    skills: 0.9
    experience: 0.85
    resume: 0.85
    metrics: 0.8
    faq: 0.75
    funfacts: 0.7

  resume_experience_chat:
    experience: 1.0
    resume: 1.0
    portfolio: 0.95
    metrics: 0.9
    skills: 0.85
    narrative: 0.8
    faq: 0.7
    funfacts: 0.6

# Multi-Factor Reranking
reranking:
  experience_id_boost: 1.25x  # strongest signal
  tag_content_boost: 1.15x    # secondary signal
  category_weight: variable   # per context (see ranking_priority)

# Experience ID Mapping
experience_boost_keywords:
  founder-one-block-away: [weready, listingpal, agentselect, mvp, orchestration]
  director-kinesso: [splash, dxa, kinesso, design system, indigo]
  sr-ux-designer-heartbeat: [heartbeat, healthcare, compliance, ux]
  account-supervisor-scout: [scout, xyrem, linzess]
  sr-account-exec-fcb: [fcb, nuvigil, teva, mlr]
  cdm-ny: [zoloft, tough mudder, pdi]
  barker-dzp: [zoloft, tough mudder, pdi]
  account-coordinator-rosetta: [rosetta, pfizer, prevnar, dubai, kol]
```

## Corpus Structure

```
wallymo_llm_corpus/
├── Resume/
│   ├── kinesso.md                    [experienceId: director-kinesso]
│   ├── oneblockaway.md               [experienceId: founder-one-block-away]
│   ├── heartbeat_freelance.md        [experienceId: sr-ux-designer-heartbeat]
│   ├── fcb_scout.md                  [experienceId: account-supervisor-scout]
│   ├── fcbhealth.md                  [experienceId: sr-account-exec-fcb]
│   ├── cdm_barker.md                 [experienceId: cdm-ny, barker-dzp]
│   ├── rosettawishbone.md            [experienceId: account-coordinator-rosetta]
│   └── career_overview.md            [general timeline]
│
├── Wallymo_Skills_and_Tools.md       [category: skills]
├── Wallymo_Metrics_and_Awards.md     [category: metrics] ← CANONICAL FACTS
├── Wallymo_FAQ_LLM.md                [category: faq] ← INCLUDES CAREER NARRATIVE
├── Wallymo_Fun_Facts.md              [category: funfacts]
└── Wallymo_RAG_Schema.md             [documentation]
```

## Retrieval Behavior

### Homepage General Chat
- Uses `categoryHint: 'home'`
- Narrative/FAQ weighted highest for voice/tone
- Pulls cross-career context
- No experience ID boosting

### Experience-Specific Chat Modules
- Uses `categoryHint: 'resume'` + `experienceId`
- Experience/resume categories weighted highest
- 1.25x boost for matching experienceId chunks
- Scoped to relevant role details

### Narrative Context (System Prompt)
- Specialized retrieval: `retrieveNarrativeContext()`
- Tighter constraints: topK=2, minConfidence=0.15
- Injects voice/tone into system prompt
- Voice rules now embedded in Resume/*.md frontmatter

## Metadata Schema

Each chunk includes:
```yaml
sourceFile: string           # original .md filename
category: string             # inferred or from frontmatter
chunkIndex: number           # position in document
totalChunks: number          # total chunks in document
startChar: number            # character offset
endChar: number              # character offset
tags: string[]               # from frontmatter
priority: number             # category-based priority 0.5-1.0
experienceIds: string[]      # from frontmatter (optional)
voice_rules: string[]        # voice/tone guidelines (optional)
```
