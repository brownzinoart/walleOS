import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverLogger } from '../middleware/logger.js';
import { retrieveContext, retrieveNarrativeContext, getRAGServiceHealth } from './ragService.js';
import { LRUCache } from '../utils/lruCache.js';

// Cache for RAG health check (1 minute TTL)
const ragHealthCache = new LRUCache<string, Awaited<ReturnType<typeof getRAGServiceHealth>>>({
  max: 1,
  ttl: 60000, // 1 minute
});

// Cache for narrative context (1 hour TTL)
const narrativeContextCache = new LRUCache<string, Awaited<ReturnType<typeof retrieveNarrativeContext>>>({
  max: 1,
  ttl: 3600000, // 1 hour
});

interface ResumeExperience {
  id: string;
  title: string;
  company: string;
  period: string;
  description?: string;
  achievements?: string[];
  skills?: string[];
  technologies?: string[];
}

interface ResumeData {
  summary: string;
  experiences: ResumeExperience[];
  skills: string[];
}

interface Branding {
  name: string;
  greeting: string;
  tagline: string;
}

interface ContentFile {
  branding: Branding;
  resume: ResumeData;
}

let cachedContent: ContentFile | null = null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resolveContentPath = (): string => {
  const fromEnv = process.env['PROMPT_CONTENT_PATH'] ?? process.env['CONTENT_JSON_PATH'];
  const candidates = [
    fromEnv,
    // Railway deployment: content.json copied to server/config/
    resolvePath(__dirname, '../config/content.json'),
    // Development: traverse up to frontend config
    resolvePath(__dirname, '../../src/config/content.json'),
    resolvePath(process.cwd(), '..', 'src', 'config', 'content.json'),
    resolvePath(process.cwd(), 'src', 'config', 'content.json'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Unable to locate content.json for prompt building. Set PROMPT_CONTENT_PATH to override.');
};

const contentPath = resolveContentPath();

const loadContent = (): ContentFile => {
  if (cachedContent) {
    return cachedContent;
  }

  try {
    const raw = readFileSync(contentPath, 'utf-8');
    const parsed = JSON.parse(raw) as ContentFile;
    cachedContent = parsed;
    return parsed;
  } catch (error) {
    serverLogger.error(
      'Failed to load resume content for prompt building',
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};

/**
 * Preload content.json on server startup to avoid blocking first request
 */
export const preloadContent = (): void => {
  try {
    loadContent();
    serverLogger.info('Preloaded content.json for prompt building');
  } catch (error) {
    serverLogger.warn('Failed to preload content.json, will load on first request', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Cached RAG health check (avoids querying vector store on every request)
 */
const getCachedRAGHealth = async (): Promise<Awaited<ReturnType<typeof getRAGServiceHealth>>> => {
  const cached = ragHealthCache.get('health');
  if (cached) {
    return cached;
  }

  const health = await getRAGServiceHealth();
  ragHealthCache.set('health', health);
  return health;
};

/**
 * Cached narrative context retrieval (same query every time)
 */
const getCachedNarrativeContext = async (): Promise<Awaited<ReturnType<typeof retrieveNarrativeContext>>> => {
  const cacheKey = 'narrative';
  const cached = narrativeContextCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const context = await retrieveNarrativeContext('voice tone writing style career narrative precision directness');
  narrativeContextCache.set(cacheKey, context);
  return context;
};

export const buildSystemPrompt = async (): Promise<string> => {
  const content = loadContent();
  const { branding: _branding } = content;

  // Check if RAG service is available (cached)
  const ragHealth = await getCachedRAGHealth();

  if (ragHealth.healthy && ragHealth.vectorStoreReady) {
    // Use RAG-enhanced system prompt
    try {
      // Get narrative context for tone and voice (cached)
      const narrativeContext = await getCachedNarrativeContext();

      const promptSections = [
        'You are Wally Mostafa, a UX systems architect and AI specialist.',
        '',
        '## YOUR VOICE & STYLE',
        narrativeContext.context || 'Write with precision and directness. Every sentence must earn its place. Avoid filler and emotional exaggeration but still convey conviction. Balance system-level reasoning with hands-on practicality. Lead with impact, then process, then proof.',
        '',
        '## RESPONSE STYLE',
        'Always respond in first person as "I" - never as "Wally Mostafa" or third person.',
        'Use personal anecdotes and direct experiences: "I built...", "I led...", "I created...", "My company One Block Away..."',
        'Weave in your career journey, specific projects, and achievements naturally.',
        'Reference WeReady (One Block Away LLC) and your work in AI orchestration and UX systems.',
        'Be conversational but direct - explain "why" and "how" from your perspective.',
        'Keep responses concise and focused - avoid unnecessary elaboration or repetition.',
        '',
        '## INSTRUCTIONS',
        'Share your experiences and insights as if speaking directly to the person.',
        'Reference specific projects, metrics, and achievements when relevant.',
        'Maintain precision while being conversational and personal.',
        'Ground all responses in your actual experience and expertise.',
      ];

      return promptSections.filter(Boolean).join('\n\n');
    } catch (error) {
      serverLogger.warn('Failed to retrieve RAG context for system prompt, falling back to static content', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Fall through to static prompt
    }
  }

  // Fallback to static content if RAG is not available
  const { resume } = content;
  const experienceHighlights = resume.experiences.slice(0, 5).map(exp => {
    const achievements = exp.achievements?.slice(0, 2).join('; ') ?? '';
    return `- ${exp.title} at ${exp.company} (${exp.period})${achievements ? ` — ${achievements}` : ''}`;
  });

  const coreSkills = resume.skills.slice(0, 15).join(', ');

  const promptSections = [
    'You are Wally Mostafa, a UX systems architect and AI specialist.',
    '',
    '## YOUR BACKGROUND',
    `${resume.summary}`,
    '',
    'Key Experience Highlights:',
    experienceHighlights.join('\n'),
    '',
    `Core Skills: ${coreSkills}`,
    '',
    '## INSTRUCTIONS',
    'Respond as yourself - Wally Mostafa. Share your experiences and insights directly.',
    'Reference specific projects and achievements when relevant.',
    'Maintain a direct, precise communication style while being conversational.',
  ];

  return promptSections.filter(Boolean).join('\n\n');
};

export const buildExperienceContextPrompt = (experienceId: string): string | undefined => {
  const content = loadContent();
  const experience = content.resume.experiences.find(exp => exp.id === experienceId);

  if (!experience) {
    serverLogger.warn('Experience context not found for chat prompt', { experienceId });
    return undefined;
  }

  const sections: string[] = [
    `Focus on the following experience: ${experience.title} at ${experience.company} (${experience.period}).`,
  ];

  if (experience.description) {
    sections.push(`Role Overview: ${experience.description}`);
  }

  if (experience.achievements && experience.achievements.length > 0) {
    sections.push(
      `Key Achievements:\n${experience.achievements
        .slice(0, 5)
        .map(achievement => `• ${achievement}`)
        .join('\n')}`,
    );
  }

  const combinedSkills = [
    ...(experience.skills ?? []),
    ...(experience.technologies ?? []),
  ].filter(Boolean);

  if (combinedSkills.length > 0) {
    sections.push(`Skills & Technologies: ${Array.from(new Set(combinedSkills)).join(', ')}`);
  }

  return sections.join('\n\n');
};

/**
 * Build user prompt with RAG context injection
 */
export const buildUserPromptWithRAG = async (userMessage: string, experienceId?: string): Promise<string> => {
  const sections: string[] = [];

  // Check if RAG service is available (cached)
  const ragHealth = await getCachedRAGHealth();

  if (ragHealth.healthy && ragHealth.vectorStoreReady) {
    try {
      // Retrieve relevant context for the user's query
      const ragResponse = await retrieveContext({
        query: userMessage,
        topK: 4,
        includeMetadata: false,
        categoryHint: experienceId ? 'resume' : 'home',
        ...(experienceId ? { experienceId } : {}),
      });

      if (ragResponse.results.length > 0) {
        sections.push('## RELEVANT CONTEXT');
        sections.push(ragResponse.context);

        // Inject compact sources list (top 2-3 unique sources)
        const uniqueSources: string[] = [];
        for (const r of ragResponse.results) {
          if (!uniqueSources.includes(r.source)) {
            uniqueSources.push(r.source);
          }
          if (uniqueSources.length >= 3) break;
        }
        if (uniqueSources.length > 0) {
          sections.push(`Sources: ${uniqueSources.join('; ')}`);
        }
        sections.push('---');
      }
    } catch (error) {
      serverLogger.warn('Failed to retrieve RAG context for user prompt', {
        error: error instanceof Error ? error.message : String(error),
        userMessage: userMessage.substring(0, 100),
      });
    }
  }

  // Add experience context if specified
  if (experienceId) {
    const experienceContext = buildExperienceContextPrompt(experienceId);
    if (experienceContext) {
      sections.push('## EXPERIENCE FOCUS');
      sections.push(experienceContext);
      sections.push('---');
    }
  }

  // Add user message
  sections.push('## USER MESSAGE');
  sections.push(userMessage.trim());

  return sections.join('\n\n');
};
