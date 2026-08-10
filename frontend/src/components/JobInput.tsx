import { useState, useCallback, useEffect } from 'react'

interface Props {
  onSubmit: (jd: string, instructions?: string) => void
  isLoading: boolean
}

export function JobInput({ onSubmit, isLoading }: Props) {
  const [jd, setJd] = useState('')
  const [instructions, setInstructions] = useState('')

  const handleSubmit = useCallback(() => {
    const trimmed = jd.trim()
    if (trimmed.length > 50) {
      onSubmit(trimmed, instructions.trim() || undefined)
    }
  }, [jd, instructions, onSubmit])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSubmit])

  return (
    <div className="flex flex-col h-full gap-3">
      <div>
        <h2 className="text-base font-bold text-[#2c3e50] mb-0.5">Target Job Description</h2>
        <p className="text-xs text-gray-500">Paste the job posting to analyze and tailor your resume</p>
      </div>

      <textarea
        className="flex-1 w-full p-3.5 border border-gray-200 rounded-xl resize-none text-xs
                   font-mono focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-gray-50/70
                   disabled:opacity-50 min-h-[220px]"
        placeholder="Paste the full job description here..."
        value={jd}
        onChange={e => setJd(e.target.value)}
        disabled={isLoading}
      />

      {/* Upfront AI Instructions Field */}
      <div className="bg-[#f0f4f8] p-3 rounded-xl border border-blue-100/80">
        <label className="block text-[10px] font-bold text-[#0F4C81] uppercase tracking-wider mb-1 flex items-center gap-1">
          <span>⚡ Special AI Directives / Instructions</span>
          <span className="text-[9px] text-gray-400 font-normal lowercase">(optional)</span>
        </label>
        <textarea
          placeholder="e.g. 'Emphasize Senior AI Engineer leadership', 'Highlight FastAPI and ChromaDB', 'Focus on FinTech domain'"
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          disabled={isLoading}
          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0F4C81] resize-none h-12 leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-400 font-medium">{jd.length} chars</span>
        <button
          onClick={handleSubmit}
          disabled={isLoading || jd.trim().length < 50}
          className="px-6 py-2.5 bg-[#0F4C81] text-white rounded-xl font-bold text-xs
                     hover:bg-[#0b3a61] disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors shadow-xs"
        >
          {isLoading ? 'Analyzing & Tailoring...' : 'Tailor Resume →'}
        </button>
      </div>
    </div>
  )
}
