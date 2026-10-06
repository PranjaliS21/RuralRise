export type Role = "YOUTH" | "EMPLOYER" | "ADMIN";

export type WorkType =
  | "LOCAL_JOB"
  | "REMOTE_JOB"
  | "PART_TIME"
  | "APPRENTICESHIP"
  | "INTERNSHIP"
  | "FREELANCE"
  | "GIG"
  | "SELF_EMPLOYMENT"
  | "SELL_PRODUCT_SERVICE";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "DEMO";
export type ListingStatus = "ACTIVE" | "PAUSED" | "EXPIRED" | "REMOVED";
export type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface MatchReason {
  type: "positive" | "improve";
  text: string;
}
export interface MatchResult {
  score: number;
  reasons: MatchReason[];
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
}
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface Organization {
  id: string;
  name: string;
  about?: string | null;
  district?: string | null;
  state?: string | null;
  website?: string | null;
  verified: boolean;
}

export interface Opportunity {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: Category;
  organization?: { name: string; verified: boolean } | null;
  workType: WorkType;
  isRemote: boolean;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  compensationMin?: number | null;
  compensationMax?: number | null;
  paymentBasis?: string | null;
  eligibility?: string | null;
  requiredEducation?: string | null;
  timeCommitment?: string | null;
  applicationInstructions?: string | null;
  sourceUrl?: string | null;
  sourceLabel?: string | null;
  deadline?: string | null;
  expiresAt?: string | null;
  verification: VerificationStatus;
  isDemo: boolean;
  skills: { skill: Skill; required: boolean }[];
  match?: MatchResult | null;
  viewCount?: number;
}

export interface YouthProfile {
  id: string;
  userId: string;
  education?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  preferredRadiusKm: number;
  interests: string[];
  skills: string[];
  availability?: string | null;
  experience?: string | null;
  languages: string[];
  careerGoals?: string | null;
  profileVisible: boolean;
  completion: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  phone?: string | null;
  district?: string | null;
  state?: string | null;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  coverNote?: string | null;
  external: boolean;
  employerNote?: string | null;
  createdAt: string;
  updatedAt: string;
  opportunity: Opportunity & { category: Category };
}

export interface TrainingProgram {
  id: string;
  slug: string;
  title: string;
  description: string;
  providerName: string;
  providerVerified: boolean;
  isDemo: boolean;
  duration?: string | null;
  mode?: string | null;
  fee?: string | null;
  certification: boolean;
  link?: string | null;
  skills: { skill: Skill }[];
}

export interface TrainingEnrollment {
  id: string;
  progress: number;
  completed: boolean;
  trainingProgram: TrainingProgram;
}

export interface Scheme {
  id: string;
  slug: string;
  title: string;
  ministry?: string | null;
  category?: string | null;
  description: string;
  eligibility?: string | null;
  benefits?: string | null;
  applySteps: string[];
  officialLink?: string | null;
  deadline?: string | null;
  lastChecked?: string | null;
  isDemo: boolean;
}

export interface BusinessIdea {
  id: string;
  slug: string;
  title: string;
  description: string;
  skills: string[];
  startupCostMin?: number | null;
  startupCostMax?: number | null;
  monthlyIncomeMin?: number | null;
  monthlyIncomeMax?: number | null;
  isDemo: boolean;
  category?: Category | null;
}

export interface BusinessPlan {
  id: string;
  title: string;
  ideaId?: string | null;
  targetCustomers?: string | null;
  resources?: string | null;
  startupCost?: string | null;
  pricingNotes?: string | null;
  marketingPlan?: string | null;
  milestones: { label: string; done: boolean }[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price?: string | null;
  village?: string | null;
  district?: string | null;
  imageUrl?: string | null;
  contactMethod?: string | null;
  contactValue?: string | null;
  verification: VerificationStatus;
  status: ListingStatus;
  category?: Category | null;
  seller?: { name: string };
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
