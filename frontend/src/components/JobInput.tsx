import { useState, useCallback, useEffect } from 'react'

interface Props {
  onSubmit: (jd: string) => void
  isLoading: boolean
}

export function JobInput({ onSubmit, isLoading }: Props) {
  const [jd, setJd] = useState('')

  const handleSubmit = useCallback(() => {
    const trimmed = jd.trim()
    if (trimmed.length > 50) onSubmit(trimmed)
  }, [jd, onSubmit])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSubmit])

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <h2 className="text-lg font-bold text-[#2c3e50] mb-1">Paste Job Description</h2>
        <p className="text-sm text-gray-500">Ctrl+Enter to analyse, or click the button</p>
      </div>
      <textarea
        className="flex-1 w-full p-4 border border-gray-200 rounded-lg resize-none text-sm
                   font-mono focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-gray-50
                   disabled:opacity-50"
        placeholder="Paste the full job description here..."
        value={jd}
        onChange={e => setJd(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{jd.length} chars</span>
        <button
          onClick={handleSubmit}
          disabled={isLoading || jd.trim().length < 50}
          className="px-6 py-2.5 bg-[#0F4C81] text-white rounded-lg font-semibold text-sm
                     hover:bg-[#0b3a61] disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isLoading ? 'Analysing...' : 'Tailor Resume →'}
        </button>
      </div>
    </div>
  )
}
