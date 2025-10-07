import contentData from './content.json';

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

const content = contentData as ContentConfig;

export const {
  branding,
  navigation,
  contact,
  suggestionChips,
  experienceSuggestionChips,
  mockResponses,
  featuredProjects,
  resume,
  metadata
} = content;

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

  if (warnings.length > 0) {
    warnings.forEach((message) => console.warn(`[content-warning] ${message}`));
  }
};

export default content;
