import contentData from './content.json';
import { chatPills, chatPillMap } from './chatPills';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface Contact {
  email: string;
  socials: SocialLink[];
}

export interface SuggestionChip {
  id: string;
  text: string;
  category: string;
}

export interface ExperienceSuggestionChip extends SuggestionChip {
  experienceLevel?: string[];
  hasAchievements?: boolean;
  hasTechnologies?: boolean;
}

export interface FeaturedProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnail: string;
  url: string;
  detailRoute?: string;
}

export interface Branding {
  name: string;
  tagline: string;
  greeting: string;
}

export interface Metadata {
  version: string;
  lastUpdated: string;
  contentSchema: string;
}

export interface MockResponses {
  [key: string]: string;
}

export interface ContentConfig {
  branding: Branding;
  navigation: NavigationItem[];
  contact: Contact;
  suggestionChips: SuggestionChip[];
  experienceSuggestionChips: ExperienceSuggestionChip[];
  mockResponses: MockResponses;
  featuredProjects: FeaturedProject[];
  resume: import('@/types').ResumeData;
  metadata: Metadata;
}

const baseContent = contentData as ContentConfig;

const baseSuggestionChipMap = new Map(baseContent.suggestionChips.map((chip) => [chip.id, chip]));

const hydratedSuggestionChips: SuggestionChip[] = baseContent.suggestionChips.map((chip) => {
  const pill = chatPillMap.get(chip.id);
  if (!pill) {
    return chip;
  }

  return {
    ...chip,
    text: pill.prompt,
  };
});

chatPills.forEach((pill) => {
  if (!baseSuggestionChipMap.has(pill.id)) {
    hydratedSuggestionChips.push({
      id: pill.id,
      text: pill.prompt,
      category: 'general',
    });
  }
});

const hydratedMockResponses: MockResponses = {
  ...baseContent.mockResponses,
};

chatPills.forEach((pill) => {
  hydratedMockResponses[pill.id] = pill.response;
});

const content: ContentConfig = {
  ...baseContent,
  suggestionChips: hydratedSuggestionChips,
  mockResponses: hydratedMockResponses,
};

export const {
  branding,
  navigation,
  contact,
  suggestionChips,
  experienceSuggestionChips,
  mockResponses,
  resume,
  metadata
} = content;

export const featuredProjects: FeaturedProject[] = content.featuredProjects;
export { chatPills, chatPillMap };

export const getAllSuggestionChips = (): SuggestionChip[] => suggestionChips;

export const getSuggestionChipById = (chipId: string): SuggestionChip | undefined =>
  suggestionChips.find((chip) => chip.id === chipId);

export const getExperienceSuggestionChips = (
  experience: import('@/types').Experience,
): ExperienceSuggestionChip[] => {
  const filtered = experienceSuggestionChips.filter((chip) => {
    if (
      chip.experienceLevel &&
      !chip.experienceLevel.includes(experience.experienceLevel)
    ) {
      return false;
    }

    if (chip.hasAchievements && experience.achievements.length === 0) {
      return false;
    }

    if (chip.hasTechnologies && (!experience.technologies || experience.technologies.length === 0)) {
      return false;
    }

    return true;
  });

  return filtered.slice(0, 4);
};

export const validateContent = (): void => {
  const warnings: string[] = [];

  if (content.branding.tagline.includes('[')) {
    warnings.push('Branding tagline still contains placeholder copy.');
  }

  if (content.contact.email.includes('[your-email@example.com]')) {
    warnings.push('Contact email is still using the placeholder value.');
  }

  content.contact.socials.forEach((social) => {
    if (social.url.includes('[username]')) {
      warnings.push(`Social link for ${social.platform} still contains a placeholder username.`);
    }
  });

  Object.entries(content.mockResponses).forEach(([key, response]) => {
    if (response.includes('[') || response.toLowerCase().includes('placeholder')) {
      warnings.push(`Mock response for "${key}" contains placeholder text.`);
    }
  });

  if (suggestionChips.length < 4) {
    warnings.push('Suggestion chip pool has fewer than 4 entries.');
  }

  const chipIds = new Set<string>();
  suggestionChips.forEach((chip) => {
    if (chip.id.trim().length === 0) {
      warnings.push('Suggestion chip detected with missing id.');
    }

    if (chip.text.trim().length === 0) {
      warnings.push(`Suggestion chip "${chip.id}" has empty text.`);
    }

    if (chip.category.trim().length === 0) {
      warnings.push(`Suggestion chip "${chip.id}" has empty category.`);
    }

    if (chipIds.has(chip.id)) {
      warnings.push(`Duplicate suggestion chip id detected: "${chip.id}".`);
    } else {
      chipIds.add(chip.id);
    }
  });

  if (warnings.length > 0) {
    warnings.forEach((message) => console.warn(`[content-warning] ${message}`));
  }
};

export default content;
