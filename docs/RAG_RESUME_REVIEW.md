# RAG Backend Implementation Review - Resume Page

## Overview

This document reviews the RAG (Retrieval-Augmented Generation) backend implementation specifically for resume card chat experiences at `http://localhost:3000/#resume`.

## Architecture Flow

### Request Flow

```
Frontend (ExperienceChat.ts)
  ↓ POST /api/chat with experienceContext.experienceId
Chat Route (routes/chat.ts)
  ↓ Validates request, streams response
Chat Gateway (services/chatGateway.ts)
  ↓ Provider selection (Anthropic → OpenAI → Gemini)
LLM Service (anthropic.ts/openai.ts/gemini.ts)
  ↓ Calls promptBuilder.buildUserPromptWithRAG()
Prompt Builder (services/promptBuilder.ts)
  ↓ Calls ragService.retrieveContext() with experienceId
RAG Service (services/ragService.ts)
  ↓ Calls vectorStore.search() with experienceId boosting
Vector Store (services/vectorStore.ts)
  ↓ LanceDB similarity search + filtering
```

## Key Components Analysis

### 1. Frontend → Backend Communication

**Location:** `src/components/ExperienceChat.ts:514-521`

```typescript
const chatRequest: ChatRequest = {
  message: trimmed,
  experienceContext: {
    experienceId,
    experienceTitle: experience.title,
  },
  ...(chipId && { chipId }),
};
```

**Status:** ✅ Correctly passes `experienceId` to backend

**Note:** `experienceTitle` is passed but not currently used in backend RAG logic (only in static context prompt).

---

### 2. RAG Query Construction

**Location:** `server/services/promptBuilder.ts:258-264`

```typescript
const ragResponse = await retrieveContext({
  query: userMessage,
  topK: 4,
  includeMetadata: false,
  categoryHint: experienceId ? "resume" : "home",
  ...(experienceId ? { experienceId } : {}),
});
```

**Status:** ✅ Correctly configured

- Sets `categoryHint: 'resume'` for experience chats
- Passes `experienceId` for boosting
- Uses `topK: 4` (reasonable for focused context)

---

### 3. Experience ID Boosting Logic

**Location:** `server/services/ragService.ts:118-122, 206-230`

**Metadata-Based Boosting (Primary Signal):**

```typescript
// Strongest signal: exact experienceId match in chunk metadata
if (
  experienceId &&
  result.chunk.metadata.experienceIds?.includes(experienceId)
) {
  adjustedScore *= 1.5; // 50% boost for exact experience match
}
```

**Validation & Logging:**

```typescript
// Log warning if no experience-specific chunks found
if (metadataMatches === 0 && rerankedResults.length > 0) {
  serverLogger.warn("No experience-specific chunks found for experienceId", {
    experienceId: experienceIdForLogging,
    totalResults: rerankedResults.length,
    suggestion:
      "Verify experienceIds in document frontmatter match this experienceId",
  });
}
```

**Status:** ✅ **Improved Implementation**

**Improvements Made:**

1. ✅ **Removed hardcoded boost terms** - No manual updates needed
2. ✅ **Single boosting system** - Metadata boost only (1.5x)
3. ✅ **Added validation** - Logs warning when experienceId has no matches
4. ✅ **Enhanced logging** - Better visibility into matching behavior

**Benefits:**

- Maintainable: relies solely on document frontmatter
- Accurate: metadata matching is more reliable than tag matching
- Observable: clear logging for debugging

---

### 4. Document Processing & Metadata Extraction

**Location:** `server/services/documentProcessor.ts:222-243`

```typescript
function extractMetadata(
  content: string,
  filename: string,
): {
  category: string;
  tags: string[];
  experienceIds: string[];
  cleanContent: string;
};
```

**Status:** ✅ Correctly extracts `experienceIds` from frontmatter

**Example from corpus:**

```yaml
---
tags: [director-kinesso, kinesso, splash, dxa, ...]
category: resume
experienceIds: [director-kinesso]
---
```

**Note:** Documents in `wallymo_llm_corpus/Resume/` correctly use `experienceIds` array in frontmatter.

---

### 5. Vector Store Experience ID Filtering

**Location:** `server/services/vectorStore.ts:44-63, 255-258`

```typescript
// Filter function
export function matchesExperienceIdFilter(
  rowExperienceIds: string | string[] | undefined,
  experienceIdFilter?: string,
): boolean {
  // Parses comma-separated string from LanceDB
  // Checks if experienceIdFilter is in array
}
```

**Status:** ✅ Correctly implemented but **NOT USED**

**Issue:** The `experienceIdFilter` option exists in `SearchOptions` but is **never passed** from `ragService.ts`. The filtering happens in post-processing via boosting instead.

**Current Flow:**

1. Vector search returns all results (no filtering)
2. RAG service applies boosting based on `experienceIds` metadata
3. Results are reranked

**Potential Optimization:**

- Could filter at vector store level to reduce result set
- However, current approach allows general context + experience-specific boost (may be intentional)

---

### 6. Static Experience Context Injection

**Location:** `server/services/promptBuilder.ts:208-244, 291-299`

```typescript
// Builds static context from content.json
export const buildExperienceContextPrompt = (
  experienceId: string,
): string | undefined => {
  const experience = content.resume.experiences.find(
    (exp) => exp.id === experienceId,
  );
  // Returns: title, company, period, description, achievements, skills, technologies
};
```

**Status:** ✅ Provides fallback context

**Flow:**

1. RAG retrieves semantic context from vector store
2. Static context from `content.json` is added as "EXPERIENCE FOCUS" section
3. Both are included in prompt

**Note:** This ensures basic experience info is always available even if RAG fails or returns no results.

---

### 7. Category Priority for Resume Context

**Location:** `server/config/ragSchema.ts:26-35`

```typescript
export const CATEGORY_PRIORITY_RESUME: CategoryPriorityMap = {
  experience: 1.0,
  resume: 1.0,
  portfolio: 0.95,
  metrics: 0.9,
  skills: 0.85,
  narrative: 0.8,
  faq: 0.7,
  funfacts: 0.6,
};
```

**Status:** ✅ Appropriate prioritization

**Analysis:**

- `experience` and `resume` categories get highest priority (1.0)
- `portfolio` and `metrics` are high (0.95, 0.9)
- `narrative` is lower (0.8) - less relevant for specific role questions
- Good separation between resume-specific and general content

---

## Improvements Implemented

### ✅ Improvement 1: Removed Hardcoded Boost Terms

**Status:** **FIXED**

**Changes:**

- Removed `experienceBoostTerms` hardcoded mapping (lines 214-225)
- Removed tag-based boosting logic from `rerankResults()`
- Simplified function signature: removed `tagBoostTerms` parameter

**Benefits:**

- No manual updates required when adding new experiences
- Single source of truth: `experienceIds` in document frontmatter
- Cleaner, more maintainable code

---

### ✅ Improvement 2: Enhanced Metadata-Based Boosting

**Status:** **FIXED**

**Changes:**

- Increased metadata boost from 1.25x to **1.5x** for exact experience matches
- Added inline documentation explaining metadata-based approach
- Removed redundant tag/content matching logic

**Benefits:**

- Stronger signal for experience-specific content
- More accurate matching via frontmatter metadata
- Better separation of concerns

---

### ✅ Improvement 3: Added Experience ID Validation

**Status:** **FIXED**

**Changes:**

- Added warning log when `experienceId` has zero matching chunks
- Logs include helpful suggestion to verify frontmatter
- Enhanced logging with `boostMethod` field for transparency

**Benefits:**

- Early detection of missing or mismatched experience documents
- Better debugging capabilities
- Clearer visibility into RAG retrieval behavior

---

### ✅ Improvement 4: Enhanced Prompt Builder Validation

**Status:** **FIXED**

**Changes:**

- Added warning log when experience not found in `content.json`
- Added comment explaining fallback context purpose

**Benefits:**

- Catches configuration issues early
- Better understanding of dual context system

---

## Remaining Considerations

### Issue 3: Experience Title Not Used in RAG

**Severity:** Low

**Status:** **ACCEPTED** - Not a priority

**Reasoning:** `experienceTitle` is redundant with metadata matching. Current approach is sufficient.

---

### Issue 4: Vector Store Filtering Not Used

**Severity:** Low

**Status:** **ACCEPTED** - By design

**Reasoning:** Current approach allows general context + experience-specific boost, providing better coverage. Filtering at vector store level would be too restrictive.

---

## Strengths

1. ✅ **Dual Context System** - RAG semantic search + static content.json ensures reliability
2. ✅ **Metadata-Based Matching** - Strong signal via `experienceIds` in frontmatter
3. ✅ **Category Prioritization** - Resume context gets appropriate weight
4. ✅ **Error Handling** - Graceful fallback if RAG fails
5. ✅ **Caching** - RAG health check cached (1 min TTL)
6. ✅ **Logging** - Good visibility into rerank mix (metadata vs general matches)

## Testing Recommendations

1. **Verify Experience ID Matching:**

   ```bash
   # Check if all experienceIds in content.json have corresponding RAG documents
   grep -r "experienceIds:" wallymo_llm_corpus/Resume/
   ```

2. **Test RAG Retrieval:**

   ```bash
   # Use test script to verify experience-specific queries
   npm run test:rag
   ```

3. **Monitor Logs:**
   - Check `metadataMatches` vs `generalMatches` in RAG service logs
   - Verify experience-specific chunks are being retrieved

## Summary

The RAG backend implementation for resume card chats has been **improved** to be more maintainable, accurate, and observable. Key improvements include:

1. ✅ **Removed hardcoded boost terms** - Now relies solely on `experienceIds` metadata
2. ✅ **Increased metadata boost** - From 1.25x to 1.5x for better experience-specific matching
3. ✅ **Added validation** - Warns when experienceId has no matching chunks
4. ✅ **Enhanced logging** - Better visibility into RAG retrieval behavior

**Overall Status:** ✅ **Improved and production-ready**

The system now uses a single, maintainable approach for experience-specific context retrieval, with better error detection and debugging capabilities.
