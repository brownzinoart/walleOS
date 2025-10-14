// Personal Context Service - Reads from your authentic voice and experiences
import { readFileSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PERSONAL_CONTEXT_PATH = resolvePath(__dirname, '../config/personalContext.json');

// Types for personal context database
export interface PersonalContextData {
  personal: {
    introduction: {
      shortBio: string;
      coreIdentity: string;
      currentFocus: string;
      originStory: string;
    };
    dailyLife: {
      morningRitual: string;
      workStyle: string;
      eveningWindDown: string;
      weekendVibes: string;
    };
    values: {
      coreBeliefs: string[];
      workPhilosophy: string;
      designPhilosophy: string;
      aiPhilosophy: string;
    };
    funFacts: {
      personalQuirks: Array<{
        quirk: string;
        story: string;
      }>;
      hobbies: Array<{
        hobby: string;
        description: string;
        frequency: string;
      }>;
      interests: Array<{
        topic: string;
        level: 'casual' | 'moderate' | 'expert';
        description: string;
      }>;
    };
  };
  professional: {
    careerJourney: {
      origin: string;
      transitions: Array<{
        from: string;
        to: string;
        reason: string;
        lessons: string;
      }>;
      currentChapter: string;
      futureVision: string;
    };
    experiences: {
      [key: string]: Array<{
        id: string;
        title: string;
        company: string;
        period: string;
        situation: string;
        role: string;
        challenges: Array<{
          challenge: string;
          approach: string;
          solution: string;
          impact: string;
        }>;
        achievements: Array<{
          achievement: string;
          context: string;
          skills: string[];
          impact: string;
        }>;
        learnings: Array<{
          lesson: string;
          application: string;
        }>;
        proudMoments: string[];
        technologies: string[];
        teamContext: string;
      }>;
    };
    expertise: {
      aiAndTech: {
        approach: string;
        experience: string;
        philosophy: string;
        currentWork: string;
      };
      design: {
        process: string;
        principles: string;
        tools: string;
        userFocus: string;
      };
      leadership: {
        style: string;
        teamBuilding: string;
        decisionMaking: string;
        mentoring: string;
      };
    };
  };
  stories: {
    challengeStories: Array<{
      title: string;
      situation: string;
      obstacle: string;
      approach: string;
      solution: string;
      result: string;
      reflection: string;
    }>;
    successStories: Array<{
      title: string;
      goal: string;
      challenge: string;
      breakthrough: string;
      result: string;
      legacy: string;
    }>;
    learningStories: Array<{
      title: string;
      context: string;
      mistake: string;
      realization: string;
      change: string;
      ongoing: string;
    }>;
  };
  communication: {
    tones: {
      professional: {
        description: string;
        triggerScenarios: string[];
        example: string;
      };
      casual: {
        description: string;
        triggerScenarios: string[];
        example: string;
      };
      technical: {
        description: string;
        triggerScenarios: string[];
        example: string;
      };
      mentor: {
        description: string;
        triggerScenarios: string[];
        example: string;
      };
    };
    phrases: {
      favorites: string[];
      explanations: string[];
    };
  };
  contextMappings: {
    queryTypes: {
      career: {
        keywords: string[];
        tone: string;
        content: string[];
      };
      technical: {
        keywords: string[];
        tone: string;
        content: string[];
      };
      personal: {
        keywords: string[];
        tone: string;
        content: string[];
      };
      advice: {
        keywords: string[];
        tone: string;
        content: string[];
      };
    };
  };
  _metadata?: {
    lastUpdated?: string;
  };
}

// Cache for personal context data
let personalContextCache: PersonalContextData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load personal context data with caching
const loadPersonalContext = (): PersonalContextData => {
  const now = Date.now();

  // Return cached data if still valid
  if (personalContextCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return personalContextCache;
  }

  try {
    const raw = readFileSync(PERSONAL_CONTEXT_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as PersonalContextData;

    // Cache the parsed data
    personalContextCache = parsed;
    cacheTimestamp = now;

    return parsed;
  } catch (error) {
    console.error('Failed to load personal context:', error);
    throw new Error('Personal context database not available');
  }
};

// Query analysis for intelligent content selection
type QueryTypeKey = keyof PersonalContextData['contextMappings']['queryTypes'];

export interface QueryAnalysis {
  intent: QueryTypeKey | 'general';
  entities: string[];
  tone: 'professional' | 'casual' | 'technical' | 'mentor';
  confidence: number;
  keywords: string[];
}

export const analyzeQuery = (query: string): QueryAnalysis => {
  const context = loadPersonalContext();
  const normalizedQuery = query.toLowerCase();
  const keywords = normalizedQuery.split(' ').filter(word => word.length > 3);

  let bestMatch: { type: QueryAnalysis['intent']; score: number } = { type: 'general', score: 0 };
  const entities: string[] = [];
  const queryTypes = context.contextMappings.queryTypes;

  // Check each query type for keyword matches
  (Object.entries(queryTypes) as Array<[QueryTypeKey, (typeof queryTypes)[QueryTypeKey]]>).forEach(([type, config]) => {
    let score = 0;
    const matchedKeywords: string[] = [];

    config.keywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    });

    if (score > bestMatch.score) {
      bestMatch = { type, score };
    }

    if (matchedKeywords.length > 0) {
      entities.push(...matchedKeywords);
    }
  });

  // Determine tone based on query type
  const matchedConfig =
    bestMatch.type === 'general' ? undefined : queryTypes[bestMatch.type];
  const allowedTones: QueryAnalysis['tone'][] = ['professional', 'casual', 'technical', 'mentor'];
  const tone: QueryAnalysis['tone'] =
    matchedConfig?.tone && allowedTones.includes(matchedConfig.tone as QueryAnalysis['tone'])
      ? (matchedConfig.tone as QueryAnalysis['tone'])
      : 'casual';

  return {
    intent: bestMatch.type,
    entities: [...new Set(entities)],
    tone,
    confidence: Math.min(bestMatch.score * 25, 100), // Convert to percentage
    keywords,
  };
};

// Content selection based on query analysis
export interface SelectedContent {
  primaryContent: string;
  supportingContent: string[];
  tone: QueryAnalysis['tone'];
  confidence: number;
  source: string;
}

export const selectPersonalContent = (query: string): SelectedContent => {
  const context = loadPersonalContext();
  const analysis = analyzeQuery(query);

  const queryTypes = context.contextMappings.queryTypes;
  const matchedConfig = analysis.intent === 'general' ? undefined : queryTypes[analysis.intent];
  const contentPaths = matchedConfig?.content ?? ['personal.introduction.shortBio'];

  let primaryContent = '';
  const supportingContent: string[] = [];

  // Extract content based on mapped paths
  contentPaths.forEach(path => {
    const content = getContentByPath(context, path);
    if (content) {
      if (!primaryContent) {
        primaryContent = content;
      } else {
        supportingContent.push(content);
      }
    }
  });

  // If no specific content found, use introduction as fallback
  if (!primaryContent) {
    primaryContent = context.personal.introduction.shortBio;
  }

  return {
    primaryContent,
    supportingContent,
    tone: analysis.tone,
    confidence: analysis.confidence,
    source: analysis.intent,
  };
};

// Get content by dot-notation path
const getContentByPath = (obj: unknown, path: string): string | null => {
  const segments = path.split('.');
  let current: unknown = obj;

  for (const key of segments) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }

  return typeof current === 'string' ? current : null;
};

// Generate context-aware prompt using personal content
export const buildPersonalContextPrompt = (userQuery: string): string => {
  const context = loadPersonalContext();
  const selectedContent = selectPersonalContent(userQuery);
  const toneConfig = context.communication.tones[selectedContent.tone];

  const sections = [
    `You are responding as Wally, using your authentic voice and experiences.`,
    ``,
    `COMMUNICATION STYLE: ${toneConfig?.description || 'Natural and authentic'}`,
    `Example of your communication: "${toneConfig?.example || 'Be genuine and helpful'}"`,
    ``,
    `RELEVANT CONTEXT: ${selectedContent.primaryContent}`,
  ];

  if (selectedContent.supportingContent.length > 0) {
    sections.push(`ADDITIONAL CONTEXT:`, ...selectedContent.supportingContent);
  }

  sections.push(
    ``,
    `USER QUERY: "${userQuery}"`,
    ``,
    `INSTRUCTIONS:`,
    `- Respond in your authentic voice using the context above`,
    `- Match the communication style specified`,
    `- Draw from your real experiences and philosophy`,
    `- Be genuine, helpful, and true to who you are`,
    `- If the query is about something specific, reference relevant experiences`,
    `- Keep responses conversational but substantive`
  );

  return sections.join('\n');
};

// Get tone information for UI
export const getToneInfo = (tone: QueryAnalysis['tone']) => {
  const context = loadPersonalContext();
  return context.communication.tones[tone];
};

// Get all available tones
export const getAvailableTones = () => {
  const context = loadPersonalContext();
  return Object.entries(context.communication.tones).map(([key, toneData]) => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    description: toneData.description,
    triggerScenarios: toneData.triggerScenarios
  }));
};

// Validate personal context data structure
export const validatePersonalContext = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const record = data as Record<string, unknown>;
  const required = ['personal', 'professional', 'stories', 'communication', 'contextMappings'];
  return required.every(section => section in record);
};

// Get content statistics
export const getContentStats = () => {
  const context = loadPersonalContext();

  return {
    experiences: Object.keys(context.professional.experiences).length,
    funFacts: context.personal.funFacts.personalQuirks.length + context.personal.funFacts.hobbies.length,
    stories: context.stories.challengeStories.length + context.stories.successStories.length,
    lastUpdated: context._metadata?.lastUpdated || 'Unknown',
  };
};

// Search personal content by keyword
export const searchPersonalContent = (keyword: string): Array<{ content: string; source: string; relevance: number }> => {
  const context = loadPersonalContext();
  const searchTerm = keyword.toLowerCase();

  // Flatten context into searchable content
  const flattenObject = (obj: unknown, prefix = ''): Array<{ content: string; path: string }> => {
    if (!obj || typeof obj !== 'object') {
      return [];
    }

    const entries = Object.entries(obj as Record<string, unknown>);
    return entries.flatMap(([key, value]) => {
      const currentPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
        return [{ content: value, path: currentPath }];
      }

      if (value && typeof value === 'object') {
        return flattenObject(value, currentPath);
      }

      return [];
    });
  };

  const matches = flattenObject(context);

  return matches.map(match => ({
    content: match.content,
    source: match.path,
    relevance: match.content.toLowerCase().split(searchTerm).length - 1,
  })).sort((a, b) => b.relevance - a.relevance);
};
