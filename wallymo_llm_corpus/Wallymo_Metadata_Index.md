# WALLY MOSTAFA – METADATA INDEX

## DOCUMENT REGISTRY
| id | file_name | category | primary_tags | see_also |
|----|-----------|----------|--------------|----------|
| 001 | Wallymo_Portfolio_LLM.md | portfolio | ["kinesso","UX","AI","design system","DXA"] | ["Wallymo_Voice_and_Career_Narrative.md","Wallymo_Metrics_and_Awards.md"] |
| 002 | Wallymo_Experience_LLM.md | experience | ["account management","freelance","leadership","founder","WeReady","ListingPal"] | ["Wallymo_Voice_and_Career_Narrative.md","Wallymo_Skills_and_Tools.md","# ListingPal Research Report.md"] |
| 003 | Wallymo_Voice_and_Career_Narrative.md | narrative | ["tone","career","style","philosophy"] | ["Wallymo_Portfolio_LLM.md","Wallymo_Fun_Facts.md"] |
| 004 | Wallymo_Fun_Facts.md | personal | ["art","painting","gaming","culture"] | ["Wallymo_Voice_and_Career_Narrative.md"] |
| 005 | Wallymo_Skills_and_Tools.md | technical | ["LLM","orchestration","design tools","UX"] | ["Wallymo_Experience_LLM.md","Wallymo_Portfolio_LLM.md"] |
| 006 | Wallymo_FAQ_LLM.md | faq | ["recruiter Q&A","responses"] | ["Wallymo_Portfolio_LLM.md","Wallymo_Voice_and_Career_Narrative.md"] |
| 007 | Wallymo_Metrics_and_Awards.md | data | ["metrics","awards"] | ["Wallymo_Portfolio_LLM.md","Wallymo_Skills_and_Tools.md"] |
| 008 | Wallymo_RAG_Schema.md | schema | ["rag","schema"] | ["Wallymo_Metadata_Index.md","Wallymo_Voice_and_Career_Narrative.md"] |
| 009 | # ListingPal Research Report.md | research | ["ListingPal","real estate","AI marketing","AgentSelect"] | ["Wallymo_Experience_LLM.md","Wallymo_Skills_and_Tools.md"] |

## RETRIEVAL RULES
Chunks 300–900 tokens; rerank to tone when close; prioritize Portfolio→Experience→Research→Skills for factual queries; Narrative for style; include project-specific tags (WeReady, ListingPal) for technical queries.
