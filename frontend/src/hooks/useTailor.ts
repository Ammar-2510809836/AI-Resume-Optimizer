import { useState, useCallback } from 'react'
import type { DiffResult, ApprovedSections, AppState, TailorResponse } from '../types'

interface UseTailorReturn {
  state: AppState
  diffs: DiffResult[]
  approvals: Record<string, boolean>
  tailoredSkills: Record<string, string[]>
  extractedKeywords: string[]
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
  const [originalSkills, setOriginalSkills] = useState<Record<string, string[]>>({})
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([])
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
      setExtractedKeywords(data.extracted_keywords ?? [])
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
    setApprovals(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }, [])

  const approveAll = useCallback(() => {
    setApprovals(prev => Object.fromEntries(Object.keys(prev).map(k => [k, true])))
  }, [])

  const generatePDF = useCallback(async () => {
    // Open a blank new tab immediately on click to bypass the browser's popup blocker
    let pdfWindow = window.open('', '_blank')
    if (pdfWindow) {
      pdfWindow.document.write(`
        <html>
          <head>
            <title>Generating PDF...</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f4f7f6;
                color: #2c3e50;
                text-align: center;
              }
              .spinner {
                border: 4px solid rgba(0,0,0,0.1);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border-left-color: #0F4C81;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h2>Generating your tailored resume...</h2>
            <p style="color: #7f8c8d; font-size: 14px;">This will open the print preview shortly.</p>
          </body>
        </html>
      `)
      pdfWindow.document.close()
    }

    try {
      const approved = buildApprovedSections(diffs, approvals, tailoredSkills, originalSkills)
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_sections: approved }),
      })
      if (!res.ok) throw new Error('Preview generation failed')
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.location.href = url
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } else {
        // Fallback: If new tab was blocked by browser's popup blocker, trigger a direct file download
        const a = document.createElement('a')
        a.href = url
        a.download = 'Ammar_Khalid_Tailored_Resume.html'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } catch (err) {
      if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.document.write(`
          <html>
            <body style="font-family: sans-serif; padding: 20px; color: #c0392b;">
              <h2>Error generating preview</h2>
              <p>${err instanceof Error ? err.message : 'Unknown error'}</p>
            </body>
          </html>
        `)
        pdfWindow.document.close()
      } else {
        setError(`Failed to generate resume: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  }, [diffs, approvals, tailoredSkills, originalSkills])

  const reset = useCallback(() => {
    setState('idle')
    setDiffs([])
    setApprovals({})
    setTailoredSkills({})
    setOriginalSkills({})
    setExtractedKeywords([])
    setError(null)
  }, [])

  return { state, diffs, approvals, tailoredSkills, extractedKeywords, error, submitJD, toggleApproval, approveAll, generatePDF, reset }
}

function buildApprovedSections(
  diffs: DiffResult[],
  approvals: Record<string, boolean>,
  tailoredSkills: Record<string, string[]>,
  originalSkills: Record<string, string[]>,
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
        : (originalSkills[cat] ?? text.split(', '))
    } else {
      sections.bullets![diff.section_id] = text
    }
  }
  return sections
}
