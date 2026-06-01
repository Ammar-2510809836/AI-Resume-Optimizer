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

export interface ParsedResume {
  name: string
  tagline: string
  contact: {
    email: string
    phone: string
    location: string
    linkedin: string
    github: string
  }
  summary: string
  skills: Record<string, string[]>
  experience: {
    title: string
    company: string
    date: string
    location: string
    role_slug: string
    bullets: string[]
  }[]
  projects: {
    title: string
    tech: string
    date: string
    project_slug: string
    bullets: string[]
  }[]
  education: {
    degree: string
    school: string
    location: string
    date: string
  }[]
  certifications: {
    name: string
    url: string
  }[]
  languages: {
    language: string
    level: string
  }[]
}

export interface ApprovedSections {
  summary?: string
  skills?: Record<string, string[]>
  bullets?: Record<string, string>
  resume_data?: ParsedResume
}

export type AppState = 'idle' | 'parsing' | 'editing_parsed' | 'loading' | 'reviewing'
