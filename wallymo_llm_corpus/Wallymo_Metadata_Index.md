# WALLY MOSTAFA – METADATA INDEX

## DOCUMENT REGISTRY
| id | file_name | category | primary_tags | see_also |
|----|-----------|----------|--------------|----------|
| 001 | Wallymo_Portfolio_LLM.md | portfolio | ["kinesso","UX","AI","design system","DXA"] | ["Wallymo_Voice_and_Career_Narrative.md","Wallymo_Metrics_and_Awards.md"] |
| 002 | Wallymo_Experience_LLM.md | experience | ["account management","freelance","leadership","founder","WeReady","ListingPal"] | ["Wallymo_Skills_and_Tools.md","Resume/oneblockaway.md"] |
| 003 | Wallymo_Voice_and_Career_Narrative.md | narrative | ["tone","career","style","philosophy"] | ["Wallymo_Portfolio_LLM.md","Wallymo_Fun_Facts.md"] |
| 004 | Wallymo_Fun_Facts.md | personal | ["art","painting","gaming","culture"] | ["Wallymo_Voice_and_Career_Narrative.md"] |
| 005 | Wallymo_Skills_and_Tools.md | technical | ["LLM","orchestration","design tools","UX"] | ["Wallymo_Experience_LLM.md","Wallymo_Portfolio_LLM.md"] |
| 006 | Wallymo_FAQ_LLM.md | faq | ["recruiter Q&A","responses"] | ["Wallymo_Portfolio_LLM.md","Wallymo_Voice_and_Career_Narrative.md"] |
| 007 | Wallymo_Metrics_and_Awards.md | data | ["metrics","awards","timeline"] | ["Wallymo_Portfolio_LLM.md","Resume/kinesso.md"] |
| 008 | Wallymo_RAG_Schema.md | schema | ["rag","schema"] | ["Wallymo_Metadata_Index.md","Wallymo_Voice_and_Career_Narrative.md"] |
| 009 | Resume/career_overview.md | resume | ["summary","career","timeline"] | ["Wallymo_Voice_and_Career_Narrative.md","Resume/kinesso.md"] |
| 010 | Resume/oneblockaway.md | resume | ["founder","ListingPal","WeReady","BriefFlow"] | ["Wallymo_Experience_LLM.md","Wallymo_Metrics_and_Awards.md"] |
| 011 | Resume/kinesso.md | resume | ["design leadership","Splash","DXA"] | ["Wallymo_Portfolio_LLM.md","Wallymo_Metrics_and_Awards.md"] |
| 012 | Resume/heartbeat_freelance.md | resume | ["UX","freelance","regulated"] | ["Wallymo_Experience_LLM.md","Wallymo_Skills_and_Tools.md"] |
| 013 | Resume/fcb_scout.md | resume | ["pharma","broadcast","pivot"] | ["Wallymo_Experience_LLM.md","Resume/fcbhealth.md"] |
| 014 | Resume/fcbhealth.md | resume | ["NUVIGIL","TV production","MLR"] | ["Resume/fcb_scout.md","Wallymo_Experience_LLM.md"] |
| 015 | Resume/cdm_barker.md | resume | ["digital marketing","Zoloft","Tough Mudder"] | ["Wallymo_Experience_LLM.md","Resume/heartbeat_freelance.md"] |
| 016 | Resume/rosettawishbone.md | resume | ["Pfizer","KOL","early career"] | ["Wallymo_Experience_LLM.md","Resume/career_overview.md"] |

## RETRIEVAL RULES
- Chunk narrative files between 300–900 tokens.
- Prioritize Portfolio → Experience → Resume cards → Skills for factual queries; tap Narrative for tone mirroring.
- Route metric requests to [Wallymo_Metrics_and_Awards.md](Wallymo_Metrics_and_Awards.md) and product specifics to [Resume/oneblockaway.md](Resume/oneblockaway.md).
- Include project tags (WeReady, ListingPal, Splash, DXA) when constructing retrieval filters.
