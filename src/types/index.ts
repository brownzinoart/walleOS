import type { ExperienceSuggestionChip as ExperienceSuggestionChipType } from '@/config/content';

export type {
  NavigationItem,
  SocialLink,
  Contact,
  SuggestionChip,
  FeaturedProject,
  Branding,
  Metadata,
  ContentConfig,
} from '@/config/content';

export interface LayoutState {
  isSidebarOpen: boolean;
  activeNavItem: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  experienceContext?: {
    experienceId: string;
    experienceTitle: string;
  };
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  inputValue: string;
}

export interface ExperienceContext {
  experienceId: string | null;
  experience: Experience | null;
  timestamp: Date;
}

export type ExperienceContextListener = (
  context: ExperienceContext,
  previousContext: ExperienceContext,
) => void;

export interface ComponentProps {
  className?: string;
  ariaLabel?: string;
}

export type EventHandler = (event: Event) => void;

export type RenderFunction = () => string;

export type Nullable<T> = T | null;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

export interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
  skills: string[];
  experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';
  technologies?: string[];
}

export type ExperienceSuggestionChip = ExperienceSuggestionChipType;

export interface ResumeData {
  experiences: Experience[];
  summary: string;
  resumeFileUrl?: string;
  skills: string[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
}
