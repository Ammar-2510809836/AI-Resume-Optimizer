import type { DiffResult, DiffToken } from '../types'

function TokenSpan({ token }: { token: DiffToken }) {
  if (token.type === 'added') return <span className="bg-green-100 text-green-800 rounded px-0.5">{token.text} </span>
  if (token.type === 'removed') return <span className="bg-red-100 text-red-700 line-through rounded px-0.5">{token.text} </span>
  return <span>{token.text} </span>
}

function sectionLabel(id: string): string {
  if (id === 'summary') return 'Summary'
  if (id.startsWith('skills_')) return `Skills — ${id.slice('skills_'.length)}`
  const parts = id.split('_')
  const idx = parseInt(parts[parts.length - 1]) + 1
  const slug = parts.slice(0, -1).join('_')
  const labels: Record<string, string> = {
    fhk: 'FH Kufstein',
    techbit: 'TechBit Systems',
    dairy_sentinel: 'Dairy Sentinel',
    interview_copilot: 'Interview Copilot',
    receipt_bot: 'Receipt Bot',
    alpine_snow: 'Alpine Snow',
  }
  return `${labels[slug] ?? slug} — Bullet ${idx}`
}

interface CardProps {
  diff: DiffResult
  approved: boolean
  onToggle: () => void
}

function DiffCard({ diff, approved, onToggle }: CardProps) {
  const hasChanges = diff.tokens.some(t => t.type !== 'unchanged')
  const score = Math.round(diff.keyword_match_score * 100)

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        approved ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50/40'
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-[#2c3e50]">{sectionLabel(diff.section_id)}</span>
          {hasChanges && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
              {score}% match
            </span>
          )}
          {!hasChanges && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
              Unchanged
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          title={approved ? 'Reject this change' : 'Approve this change'}
          className="text-lg hover:scale-110 transition-transform select-none"
        >
          {approved ? '✅' : '❌'}
        </button>
      </div>

      {hasChanges ? (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-red-50 rounded p-2">
            <p className="font-semibold text-red-500 mb-1 uppercase tracking-wide text-[10px]">Original</p>
            <p
              className="leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: diff.original }}
            />
          </div>
          <div className="bg-green-50 rounded p-2">
            <p className="font-semibold text-green-600 mb-1 uppercase tracking-wide text-[10px]">Tailored</p>
            <p className="leading-relaxed text-gray-700">
              {diff.tokens.map((t, i) => <TokenSpan key={i} token={t} />)}
            </p>
          </div>
        </div>
      ) : (
        <p
          className="text-xs text-gray-500 italic leading-relaxed"
          dangerouslySetInnerHTML={{ __html: diff.original }}
        />
      )}
    </div>
  )
}

interface Props {
  diffs: DiffResult[]
  approvals: Record<string, boolean>
  extractedKeywords?: string[]
  onToggle: (sectionId: string) => void
  onApproveAll: () => void
}

export function DiffViewer({ diffs, approvals, extractedKeywords = [], onToggle, onApproveAll }: Props) {
  const approvedCount = Object.values(approvals).filter(Boolean).length

  return (
    <div className="flex flex-col gap-3">
      {/* ATS Keywords Pill Container */}
      {extractedKeywords.length > 0 && (
        <div className="bg-[#f0f4f8] rounded-lg p-3.5 border border-blue-100/50 mb-1">
          <p className="font-semibold text-[10px] text-[#0F4C81] uppercase tracking-wider mb-2">🎯 Targeted ATS Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {extractedKeywords.map((kw, i) => (
              <span key={i} className="text-[11px] font-semibold bg-white text-[#0F4C81] px-2.5 py-0.5 rounded-full border border-blue-200/50 shadow-sm">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
        <span>{approvedCount} of {diffs.length} sections approved</span>
        <button onClick={onApproveAll} className="text-[#0F4C81] hover:underline text-xs">
          Approve all
        </button>
      </div>
      {diffs.map(diff => (
        <DiffCard
          key={diff.section_id}
          diff={diff}
          approved={approvals[diff.section_id] ?? true}
          onToggle={() => onToggle(diff.section_id)}
        />
      ))}
    </div>
  )
}
