import { useState, useCallback, useEffect } from 'react'
import type { DiffResult, ApprovedSections, AppState, TailorResponse, ProjectRelevance, SuggestedProject } from '../types'

interface UseTailorReturn {
  state: AppState
  diffs: DiffResult[]
  approvals: Record<string, boolean>
  tailoredSkills: Record<string, string[]>
  editableSkills: Record<string, string[]>
  extractedKeywords: string[]
  projectRelevance: Record<string, ProjectRelevance>
  suggestedProjects: SuggestedProject[]
  customProjects: SuggestedProject[]
  manualEdits: Record<string, string>
  error: string | null
  templateId: string
  jobDescription: string
  excludedProjects: string[]
  projects: { title: string; project_slug: string }[]
  previewHtml: string | null
  isExportingPdf: boolean
  setTemplateId: (tplId: string) => void
  submitJD: (jd: string, instructions?: string) => Promise<void>
  toggleApproval: (sectionId: string) => void
  approveAll: () => void
  updateManualEdit: (sectionId: string, value: string) => void
  updateSkills: (newSkills: Record<string, string[]>) => void
  addCustomProject: (project: SuggestedProject) => void
  addCustomBullet: (roleOrProjectSlug: string, bulletText: string) => void
  fetchPreviewHtml: () => Promise<string>
  generatePDF: () => Promise<void>
  reset: () => void
  toggleProjectSelection: (slug: string) => void
}

export function useTailor(): UseTailorReturn {
  const [state, setState] = useState<AppState>('idle')
  const [diffs, setDiffs] = useState<DiffResult[]>([])
  const [approvals, setApprovals] = useState<Record<string, boolean>>({})
  const [tailoredSkills, setTailoredSkills] = useState<Record<string, string[]>>({})
  const [editableSkills, setEditableSkills] = useState<Record<string, string[]>>({})
  const [originalSkills, setOriginalSkills] = useState<Record<string, string[]>>({})
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([])
  const [projectRelevance, setProjectRelevance] = useState<Record<string, ProjectRelevance>>({})
  const [suggestedProjects, setSuggestedProjects] = useState<SuggestedProject[]>([])
  const [customProjects, setCustomProjects] = useState<SuggestedProject[]>([])
  const [manualEdits, setManualEdits] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState<string>('modern')
  const [jobDescription, setJobDescription] = useState<string>('')
  const [excludedProjects, setExcludedProjects] = useState<string[]>([])
  const [projects, setProjects] = useState<{ title: string; project_slug: string }[]>([])
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false)

  useEffect(() => {
    fetch('/api/resume')
      .then(res => res.json())
      .then(data => {
        if (data && data.projects) {
          setProjects(data.projects.map((p: any) => ({ title: p.title, project_slug: p.project_slug })))
          setEditableSkills(data.skills ?? {})
        }
      })
      .catch(err => console.error("Failed to fetch resume projects:", err))
  }, [])

  const toggleProjectSelection = useCallback((projectSlug: string) => {
    setExcludedProjects(prev =>
      prev.includes(projectSlug)
        ? prev.filter(p => p !== projectSlug)
        : [...prev, projectSlug]
    )
  }, [])

  const updateManualEdit = useCallback((sectionId: string, value: string) => {
    setManualEdits(prev => ({ ...prev, [sectionId]: value }))
    if (sectionId.startsWith('skills_')) {
      const cat = sectionId.slice('skills_'.length)
      const list = value.split(',').map(s => s.trim()).filter(Boolean)
      setEditableSkills(prev => ({ ...prev, [cat]: list }))
    }
  }, [])

  const updateSkills = useCallback((newSkills: Record<string, string[]>) => {
    setEditableSkills(newSkills)
    const newManuals: Record<string, string> = {}
    Object.entries(newSkills).forEach(([cat, list]) => {
      newManuals[`skills_${cat}`] = list.join(', ')
    })
    setManualEdits(prev => ({ ...prev, ...newManuals }))
  }, [])

  const addCustomProject = useCallback((project: SuggestedProject) => {
    setCustomProjects(prev => [...prev, project])
  }, [])

  const addCustomBullet = useCallback((roleOrProjectSlug: string, bulletText: string) => {
    setManualEdits(prev => {
      let idx = 0
      while (`${roleOrProjectSlug}_custom_${idx}` in prev) {
        idx++
      }
      return { ...prev, [`${roleOrProjectSlug}_custom_${idx}`]: bulletText }
    })
  }, [])

  const submitJD = useCallback(async (jd: string, instructions?: string) => {
    setJobDescription(jd)
    setState('loading')
    setError(null)
    setManualEdits({})
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jd,
          user_instructions: instructions || undefined
        }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(detail.detail ?? `HTTP ${res.status}`)
      }
      const data: TailorResponse = await res.json()
      setDiffs(data.diffs)
      setTailoredSkills(data.tailored_skills)
      setEditableSkills(data.tailored_skills)
      setExtractedKeywords(data.extracted_keywords ?? [])
      setProjectRelevance(data.project_relevance ?? {})
      
      const suggested = (data.suggested_new_projects ?? []).map(p => ({ ...p, is_ai_generated: true }))
      setSuggestedProjects(suggested)

      // Auto-exclude low relevance projects if score < 50
      if (data.project_relevance) {
        const toExclude: string[] = []
        Object.entries(data.project_relevance).forEach(([slug, rel]) => {
          if (rel.score < 50) {
            toExclude.push(slug)
          }
        })
        setExcludedProjects(toExclude)
      }

      const origSkills: Record<string, string[]> = {}
      data.diffs.forEach(d => {
        if (d.section_id.startsWith('skills_')) {
          const cat = d.section_id.slice('skills_'.length)
          origSkills[cat] = d.original.split(', ')
        }
      })
      setOriginalSkills(origSkills)
      setApprovals(Object.fromEntries(data.diffs.map(d => [d.section_id, true])))
      setState('reviewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('idle')
    }
  }, [])

  const toggleApproval = useCallback((sectionId: string) => {
    setApprovals(prev => {
      const nextApproved = !prev[sectionId]
      if (sectionId.startsWith('skills_')) {
        const cat = sectionId.slice('skills_'.length)
        if (nextApproved) {
          if (tailoredSkills[cat]) {
            setEditableSkills(es => ({ ...es, [cat]: tailoredSkills[cat] }))
          }
        } else {
          if (originalSkills[cat]) {
            setEditableSkills(es => ({ ...es, [cat]: originalSkills[cat] }))
          }
        }
      }
      return { ...prev, [sectionId]: nextApproved }
    })
  }, [tailoredSkills, originalSkills])

  const approveAll = useCallback(() => {
    setApprovals(prev => Object.fromEntries(Object.keys(prev).map(k => [k, true])))
  }, [])

  const getApprovedSections = useCallback(() => {
    return buildApprovedSections(
      diffs,
      approvals,
      editableSkills,
      originalSkills,
      excludedProjects,
      manualEdits,
      [...suggestedProjects, ...customProjects]
    )
  }, [diffs, approvals, editableSkills, originalSkills, excludedProjects, manualEdits, suggestedProjects, customProjects])

  const fetchPreviewHtml = useCallback(async (): Promise<string> => {
    try {
      const approved = getApprovedSections()
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved_sections: approved,
          template_id: templateId
        }),
      })
      if (!res.ok) throw new Error('Preview fetch failed')
      const html = await res.text()
      setPreviewHtml(html)
      return html
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load preview'
      setError(msg)
      return `<html><body><p style="color:red">${msg}</p></body></html>`
    }
  }, [getApprovedSections, templateId])

  const generatePDF = useCallback(async () => {
    setIsExportingPdf(true)
    setError(null)
    try {
      const approved = getApprovedSections()
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved_sections: approved,
          template_id: templateId
        }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(detail.detail ?? 'PDF generation failed')
      }
      
      const contentType = res.headers.get('content-type') || ''
      const isFallback = res.headers.get('X-PDF-Fallback') === 'true' || contentType.includes('text/html')

      if (isFallback) {
        const html = await res.text()
        const win = window.open('', '_blank')
        if (win) {
          win.document.write(html)
          win.document.close()
        } else {
          const blob = new Blob([html], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'Ammar_Khalid_Tailored_Resume.html'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      } else {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'Ammar_Khalid_Tailored_Resume.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } catch (err) {
      setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsExportingPdf(false)
    }
  }, [getApprovedSections, templateId])

  const reset = useCallback(() => {
    setState('idle')
    setDiffs([])
    setApprovals({})
    setTailoredSkills({})
    setEditableSkills({})
    setOriginalSkills({})
    setExtractedKeywords([])
    setProjectRelevance({})
    setSuggestedProjects([])
    setCustomProjects([])
    setManualEdits({})
    setError(null)
    setJobDescription('')
    setExcludedProjects([])
    setTemplateId('modern')
    setPreviewHtml(null)
  }, [])

  return {
    state, diffs, approvals, tailoredSkills, editableSkills, extractedKeywords,
    projectRelevance, suggestedProjects, customProjects, manualEdits, error,
    templateId, jobDescription, excludedProjects, projects, previewHtml, isExportingPdf,
    setTemplateId, submitJD, toggleApproval, approveAll, updateManualEdit,
    updateSkills, addCustomProject, addCustomBullet, fetchPreviewHtml, generatePDF, reset,
    toggleProjectSelection
  }
}

function buildApprovedSections(
  diffs: DiffResult[],
  approvals: Record<string, boolean>,
  editableSkills: Record<string, string[]>,
  originalSkills: Record<string, string[]>,
  excludedProjects: string[],
  manualEdits: Record<string, string>,
  allCustomProjects: SuggestedProject[]
): ApprovedSections {
  const sections: ApprovedSections = { bullets: {}, custom_projects: allCustomProjects }
  sections.excluded_projects = excludedProjects
  sections.skills = editableSkills

  for (const diff of diffs) {
    const isApproved = approvals[diff.section_id] ?? true
    let text = ''

    // If user provided a manual edit override
    if (manualEdits[diff.section_id] !== undefined) {
      text = manualEdits[diff.section_id].trim()
    } else if (isApproved) {
      text = diff.tailored.trim()
    } else {
      // If user clicked ❌ (rejected/crossed), set text to empty string so bullet is completely removed
      text = ''
    }

    if (diff.section_id === 'summary') {
      sections.summary = manualEdits['summary'] ?? (isApproved ? diff.tailored : diff.original)
    } else if (diff.section_id === 'tagline') {
      sections.tagline = manualEdits['tagline'] ?? (isApproved ? diff.tailored : diff.original)
    } else if (diff.section_id.startsWith('skills_')) {
      // handled via sections.skills = editableSkills
    } else {
      sections.bullets![diff.section_id] = text
    }
  }

  // Include user-added custom bullets (e.g. fhk_custom_0) if not empty
  Object.entries(manualEdits).forEach(([key, val]) => {
    if (key.includes('_custom_') && val.trim()) {
      sections.bullets![key] = val.trim()
    }
  })

  return sections
}
