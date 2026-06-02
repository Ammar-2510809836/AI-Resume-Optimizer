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

export interface TailorResponse {
  tailored_skills: Record<string, string[]>
  diffs: DiffResult[]
  extracted_keywords?: string[]
}

export interface ApprovedSections {
  summary?: string
  tagline?: string
  skills?: Record<string, string[]>
  bullets?: Record<string, string>
  excluded_projects?: string[]
}

export type AppState = 'idle' | 'loading' | 'reviewing'
