import { useState, useCallback } from 'react'
import type { DiffResult, ApprovedSections, AppState, TailorResponse } from '../types'

interface UseTailorReturn {
  state: AppState
  diffs: DiffResult[]
  approvals: Record<string, boolean>
  tailoredSkills: Record<string, string[]>
  error: string | null
  submitJD: (jd: string) => Promise<void>
  toggleApproval: (sectionId: string) => void
  approveAll: () => void
  generatePDF: () => Promise<void>
  reset: () => void
}

export function useTailor(): UseTailorReturn {
  const [state, setState] = useState<AppState>('idle')
  const [diffs, setDiffs] = useState<DiffResult[]>([])
  const [approvals, setApprovals] = useState<Record<string, boolean>>({})
  const [tailoredSkills, setTailoredSkills] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)

  const submitJD = useCallback(async (jd: string) => {
    setState('loading')
    setError(null)
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jd }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(detail.detail ?? `HTTP ${res.status}`)
      }
      const data: TailorResponse = await res.json()
      setDiffs(data.diffs)
      setTailoredSkills(data.tailored_skills)
      setApprovals(Object.fromEntries(data.diffs.map(d => [d.section_id, true])))
      setState('reviewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('idle')
    }
  }, [])

  const toggleApproval = useCallback((sectionId: string) => {
    setApprovals(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }, [])

  const approveAll = useCallback(() => {
    setApprovals(prev => Object.fromEntries(Object.keys(prev).map(k => [k, true])))
  }, [])

  const generatePDF = useCallback(async () => {
    const approved = buildApprovedSections(diffs, approvals, tailoredSkills)
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_sections: approved }),
    })
    if (!res.ok) throw new Error('Preview generation failed')
    const html = await res.text()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }, [diffs, approvals, tailoredSkills])

  const reset = useCallback(() => {
    setState('idle')
    setDiffs([])
    setApprovals({})
    setTailoredSkills({})
    setError(null)
  }, [])

  return { state, diffs, approvals, tailoredSkills, error, submitJD, toggleApproval, approveAll, generatePDF, reset }
}

function buildApprovedSections(
  diffs: DiffResult[],
  approvals: Record<string, boolean>,
  tailoredSkills: Record<string, string[]>,
): ApprovedSections {
  const sections: ApprovedSections = { bullets: {} }

  for (const diff of diffs) {
    const useNew = approvals[diff.section_id] ?? true
    const text = useNew ? diff.tailored : diff.original

    if (diff.section_id === 'summary') {
      sections.summary = text
    } else if (diff.section_id.startsWith('skills_')) {
      if (!sections.skills) sections.skills = {}
      const cat = diff.section_id.slice('skills_'.length)
      sections.skills[cat] = useNew
        ? (tailoredSkills[cat] ?? text.split(', '))
        : text.split(', ')
    } else {
      sections.bullets![diff.section_id] = text
    }
  }
  return sections
}
