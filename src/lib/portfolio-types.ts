export interface WriteupRecord {
  id: string;
  title?: string;
  competition?: string;
  category?: string;
  difficulty?: string;
  date?: string;
  summary?: string;
  content?: string;
  flag?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectRecord {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  category?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AchievementRecord {
  id: string;
  title?: string;
  issuer?: string;
  platform?: string;
  description?: string;
  imageUrl?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SecureMessageRecord {
  id: string;
  title?: string;
  content?: string;
  createdAt?: string;
  username?: string;
}

export interface AccessLogRecord {
  id: string;
  username?: string;
  accessedAt?: string;
  accessSuccessful?: boolean;
  ip?: string;
}

export interface LatestActivityRecord {
  type: 'WRITE-UP' | 'PROJECT' | 'ACHIEVEMENT';
  title: string;
  date: string;
}

export interface HomeSummaryResponse {
  writeupCount: number;
  projectCount: number;
  achievementCount: number;
  latestActivity: LatestActivityRecord | null;
}

export interface TechnicalArsenalItem {
  name?: string;
  level?: number;
}

export interface ProfessionalJourneyItem {
  role?: string;
  company?: string;
  period?: string;
  desc?: string;
}

export interface EducationHistoryItem {
  level?: string;
  school?: string;
  period?: string;
}

export interface SeoSettingsRecord {
  titleTemplate?: string;
  defaultTitle?: string;
  description?: string;
  canonicalUrl?: string;
  previewImageUrl?: string;
  siteName?: string;
  locale?: string;
  keywords?: string[];
  jobTitle?: string;
  sameAs?: string[];
}

export interface ProfileSettingsRecord {
  displayName?: string;
  alias?: string;
  navbarBrandMode?: 'default' | 'custom';
  navbarBrandName?: string;
  email?: string;
  websiteUrl?: string;
  githubUrl?: string;
  instagramUrl?: string;
  profileImageUrl?: string;
  aboutText?: string;
  philosophyText?: string;
  technicalArsenal?: TechnicalArsenalItem[];
  professionalJourney?: ProfessionalJourneyItem[];
  educationHistory?: EducationHistoryItem[];
  seo?: SeoSettingsRecord;
  updatedAt?: string;
}