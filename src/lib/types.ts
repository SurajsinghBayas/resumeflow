export type Impact = "high" | "medium" | "low";

export type Strength = {
  title: string;
  detail: string;
};

export type Critique = {
  title: string;
  detail: string;
  impact: Impact;
};

export type Suggestion = {
  section: string;
  issue: string;
  before: string;
  after: string;
  why: string;
};

export type AgentTrace = {
  id: string;
  label: string;
  model: string;
  note: string;
};

export type Report = {
  summary: string;
  alignment: string;
  matchScore: number;
  matchLabel: string;
  targetRole: string;
  strengths: Strength[];
  constructive: Critique[];
  suggestions: Suggestion[];
  presentKeywords: string[];
  missingKeywords: string[];
  agents: AgentTrace[];
};

export type AnalysisRecord = {
  id: string;
  filename: string;
  model: string;
  jobDescription: string;
  report: Report;
  createdAt: string;
};

export type Profile = {
  jobTitle: string;
  linkedin: string;
  seniority: string;
  workStyle: string;
  industries: string[];
  skills: string[];
  expertise: string;
  onboarded: boolean;
};

export type LeaderboardEntry = {
  rank: number;
  linkedinName: string;
  linkedinHref: string | null;
  role: string;
  score: number;
  isYou: boolean;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export type AgentId = "reader" | "role" | "reviewer" | "editor";

export type AgentModels = Record<AgentId, string>;
