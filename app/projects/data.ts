/**
 * Project metadata describing portfolio entries rendered in the projects grid.
 * Extend this interface when adding new fields so the UI stays type-safe.
 */
export interface Project {
  id: string
  title: string
  description: string
  longDescription: string
  techStack: string[]
  externalUrl: string
  image?: string
  featured?: boolean
}

/**
 * Seed project data for the expandable grid. Replace the URLs with live links
 * once real projects are available.
 */
export const projects: Project[] = [
  {
    id: 'ai-code-assistant',
    title: 'AI Code Assistant',
    description: 'Streaming autocompletion with intent-aware prompts.',
    longDescription:
      'An AI pair-programming companion that blends static analysis with LLM-powered suggestions. It learns from your codebase, streaming completions inline while respecting repository privacy boundaries.',
    techStack: ['Next.js', 'OpenAI API', 'TypeScript', 'Tailwind CSS'],
    externalUrl: 'https://example.com/ai-code-assistant',
  },
  {
    id: 'llm-finetune-pipeline',
    title: 'LLM Fine-tuning Pipeline',
    description: 'Automated data curation and small-batch LoRA runs.',
    longDescription:
      'A reproducible fine-tuning workflow for domain-specific assistants. The pipeline scores and filters conversational data, schedules parameter-efficient LoRA jobs, and benchmarks outputs against golden datasets before deployment.',
    techStack: ['Python', 'PyTorch', 'Weights & Biases', 'FastAPI'],
    externalUrl: 'https://example.com/llm-finetune-pipeline',
    featured: true,
  },
  {
    id: 'neural-search-engine',
    title: 'Neural Search Engine',
    description: 'Semantic retrieval that understands code and docs.',
    longDescription:
      'Vectorizes mixed text and code repositories to power natural-language search. Uses hybrid sparse + dense retrieval, reranking transformers, and adaptive caching to deliver sub-second answers across million-document corpora.',
    techStack: ['Next.js', 'PostgreSQL', 'OpenSearch', 'TypeScript'],
    externalUrl: 'https://example.com/neural-search-engine',
  },
]
