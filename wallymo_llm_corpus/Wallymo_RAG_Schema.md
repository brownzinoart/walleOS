# WALLY MOSTAFA – RAG SCHEMA TEMPLATE

```yaml
schema_version: 1.0
chunking: {max_tokens: 900, min_tokens: 300, overlap: 50}
embedding_model: nomic-embed-text (Ollama)
retrieval: {top_k_default: 6, rerank_k: 3, min_confidence: 0.65}
ranking_priority:
  - narrative: 1.0
  - portfolio: 0.95
  - experience: 0.9
  - skills: 0.85
  - faq: 0.8
  - funfacts: 0.7
  - metrics: 0.7
vector_db: {provider: FAISS, fallback: pgvector, normalize_embeddings: true}
```
