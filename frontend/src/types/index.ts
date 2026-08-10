export type DiffTokenType = 'added' | 'removed' | 'unchanged'

export interface DiffToken {
  text: string
  type: DiffTokenType
}

export interface DiffResult {
  section_id: string
  original: string
  tailored: string
  tokens: DiffToken[]
  keyword_match_score: number
}

export interface ProjectRelevance {
  score: number
  reason: string
  recommended: boolean
}

export interface SuggestedProject {
  title: string
  tech: string
  date: string
  project_slug: string
  bullets: string[]
  is_ai_generated?: boolean
}

export interface TailorResponse {
  tailored_skills: Record<string, string[]>
  diffs: DiffResult[]
  extracted_keywords?: string[]
  project_relevance?: Record<string, ProjectRelevance>
  suggested_new_projects?: SuggestedProject[]
}

export interface ApprovedSections {
  summary?: string
  tagline?: string
  skills?: Record<string, string[]>
  bullets?: Record<string, string>
  excluded_projects?: string[]
  custom_projects?: SuggestedProject[]
}

export type AppState = 'idle' | 'loading' | 'reviewing'
