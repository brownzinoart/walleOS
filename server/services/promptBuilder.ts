import { readFileSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverLogger } from '../middleware/logger.js';
import { retrieveContext, retrieveNarrativeContext, getRAGServiceHealth } from './ragService.js';

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
const contentPath = resolvePath(__dirname, '../../src/config/content.json');

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

export const buildSystemPrompt = async (): Promise<string> => {
  const content = loadContent();
  const { branding } = content;

  // Check if RAG service is available
  const ragHealth = await getRAGServiceHealth();

  if (ragHealth.healthy && ragHealth.vectorStoreReady) {
    // Use RAG-enhanced system prompt
    try {
      // Get narrative context for tone and voice - use better search terms
      const narrativeContext = await retrieveNarrativeContext('voice tone writing style career narrative precision directness');

      const promptSections = [
        'You are Wally Mostafa, a UX systems architect and AI specialist.',
        '',
        '## YOUR VOICE & STYLE',
        narrativeContext.context || 'Write with precision and directness. Every sentence must earn its place. Avoid filler and emotional exaggeration but still convey conviction. Balance system-level reasoning with hands-on practicality. Lead with impact, then process, then proof.',
        '',
        '## INSTRUCTIONS',
        'Respond as yourself - Wally Mostafa. Share your experiences, insights, and perspectives directly.',
        'Reference specific projects, metrics, and achievements when relevant.',
        'Maintain your characteristic precision and directness while being conversational.',
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

  // Check if RAG service is available
  const ragHealth = await getRAGServiceHealth();

  if (ragHealth.healthy && ragHealth.vectorStoreReady) {
    try {
      // Retrieve relevant context for the user's query
      const ragResponse = await retrieveContext({
        query: userMessage,
        topK: 4,
        includeMetadata: false,
      });

      if (ragResponse.results.length > 0) {
        sections.push('## RELEVANT CONTEXT');
        sections.push(ragResponse.context);
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
