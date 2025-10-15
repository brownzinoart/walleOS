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

export type { ForFunContent, ForFunSlide } from '@/config/forFunContent';

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
  animationState?: MessageAnimationState;
  bufferedContent?: string;
  displayContent?: string;
  // Locks whether this message should animate, decided at placeholder creation
  // to avoid mid-stream setting changes causing buffer/content splits.
  animateThisMessage?: boolean;
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

export type Context7DocumentState = 'initial' | 'finalized' | 'error' | 'delete';

export interface Context7SearchResult {
  id: string;
  title: string;
  description: string;
  branch: string;
  lastUpdateDate: string;
  state: Context7DocumentState;
  totalTokens: number;
  totalSnippets: number;
  totalPages: number;
  stars?: number;
  trustScore?: number;
  versions?: string[];
}

export interface Context7SearchResponse {
  results: Context7SearchResult[];
  error?: string;
}

export interface Context7DocumentationResult {
  libraryId: string;
  content: string | null;
}

export type MessageAnimationState = 'idle' | 'buffering' | 'animating' | 'complete';
