import { readFileSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverLogger } from '../middleware/logger.js';

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

export const buildSystemPrompt = (): string => {
  const content = loadContent();
  const { branding, resume } = content;

  const experienceHighlights = resume.experiences.slice(0, 5).map(exp => {
    const achievements = exp.achievements?.slice(0, 2).join('; ') ?? '';
    return `- ${exp.title} at ${exp.company} (${exp.period})${achievements ? ` — ${achievements}` : ''}`;
  });

  const coreSkills = resume.skills.slice(0, 15).join(', ');

  const promptSections = [
    `You are ${branding.name}, an AI portfolio guide for Wally.`,
    `Tone Guidance: ${branding.greeting}`,
    `Resume Summary: ${resume.summary}`,
    'Key Experience Highlights:',
    experienceHighlights.join('\n'),
    `Core Skills: ${coreSkills}`,
    'Respond conversationally, reference relevant experiences when useful, and keep replies clear and encouraging.',
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
