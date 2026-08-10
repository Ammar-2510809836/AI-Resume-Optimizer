import { useState } from 'react'
import type { DiffResult, DiffToken, ProjectRelevance, SuggestedProject } from '../types'

function TokenSpan({ token }: { token: DiffToken }) {
  if (token.type === 'added') return <span className="bg-green-100 text-green-800 rounded px-0.5">{token.text} </span>
  if (token.type === 'removed') return <span className="bg-red-100 text-red-700 line-through rounded px-0.5">{token.text} </span>
  return <span>{token.text} </span>
}

function sectionLabel(id: string): string {
  if (id === 'tagline') return 'Professional Tagline'
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
  manualValue?: string
  onToggle: () => void
  onManualEdit: (val: string) => void
  isProjectExcluded?: boolean
}

function DiffCard({ diff, approved, manualValue, onToggle, onManualEdit, isProjectExcluded }: CardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editBuffer, setEditBuffer] = useState('')

  const hasChanges = diff.tokens.some(t => t.type !== 'unchanged')
  const score = Math.round(diff.keyword_match_score * 100)

  if (isProjectExcluded) {
    return (
      <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-100/50 opacity-60 relative select-none">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-xs text-gray-400">{sectionLabel(diff.section_id)}</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Dropped (Project Excluded)</span>
        </div>
        <p className="text-xs text-gray-400 italic mt-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: diff.original }} />
      </div>
    )
  }

  const currentDisplay = manualValue !== undefined ? manualValue : (approved ? diff.tailored : diff.original)

  return (
    <div
      className={`border rounded-xl p-4 transition-all ${
        manualValue !== undefined
          ? 'border-purple-300 bg-purple-50/20 shadow-xs'
          : approved
          ? 'border-gray-200 bg-white'
          : 'border-red-200 bg-red-50/40'
      }`}
    >
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-xs text-[#2c3e50]">{sectionLabel(diff.section_id)}</span>
          {manualValue !== undefined && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              ✍️ Manually Edited
            </span>
          )}
          {manualValue === undefined && hasChanges && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              {score}% match
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditBuffer(currentDisplay)
              setIsEditing(!isEditing)
            }}
            className="text-xs text-[#0F4C81] hover:underline font-semibold flex items-center gap-1"
          >
            <span>✏️</span> {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={onToggle}
            title={approved ? 'Reject this change' : 'Approve this change'}
            className="text-base hover:scale-110 transition-transform select-none ml-1"
          >
            {approved ? '✅' : '❌'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2 mt-2">
          <textarea
            value={editBuffer}
            onChange={(e) => setEditBuffer(e.target.value)}
            className="w-full p-2.5 border border-purple-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-purple-400 outline-none h-24 leading-relaxed"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onManualEdit(editBuffer)
                setIsEditing(false)
              }}
              className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700"
            >
              Save Manual Edit
            </button>
          </div>
        </div>
      ) : hasChanges && manualValue === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-1">
          <div className="bg-red-50/80 rounded-lg p-2.5 border border-red-100">
            <p className="font-bold text-red-600 mb-1 uppercase tracking-wide text-[9px]">Original</p>
            <p className="leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: diff.original }} />
          </div>
          <div className="bg-green-50/80 rounded-lg p-2.5 border border-green-100">
            <p className="font-bold text-green-700 mb-1 uppercase tracking-wide text-[9px]">AI Tailored</p>
            <p className="leading-relaxed text-gray-800">
              {diff.tokens.map((t, i) => <TokenSpan key={i} token={t} />)}
            </p>
          </div>
        </div>
      ) : (
        <p
          className="text-xs text-gray-700 leading-relaxed mt-1"
          dangerouslySetInnerHTML={{ __html: currentDisplay }}
        />
      )}
    </div>
  )
}

interface Props {
  diffs: DiffResult[]
  approvals: Record<string, boolean>
  manualEdits: Record<string, string>
  editableSkills: Record<string, string[]>
  extractedKeywords?: string[]
  projectRelevance?: Record<string, ProjectRelevance>
  suggestedProjects?: SuggestedProject[]
  projects?: { title: string; project_slug: string }[]
  excludedProjects?: string[]
  onToggle: (sectionId: string) => void
  onApproveAll: () => void
  onManualEdit: (sectionId: string, val: string) => void
  onUpdateSkills: (newSkills: Record<string, string[]>) => void
  onAddCustomProject: (proj: SuggestedProject) => void
  onAddCustomBullet: (roleOrProjectSlug: string, text: string) => void
  onToggleProject?: (slug: string) => void
}

export function DiffViewer({
  diffs,
  approvals,
  manualEdits,
  editableSkills,
  extractedKeywords = [],
  projectRelevance = {},
  suggestedProjects = [],
  projects = [],
  excludedProjects = [],
  onToggle,
  onApproveAll,
  onManualEdit,
  onUpdateSkills,
  onAddCustomProject,
  onAddCustomBullet,
  onToggleProject,
}: Props) {
  const [newSkillTag, setNewSkillTag] = useState<Record<string, string>>({})
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [customBulletRole, setCustomBulletRole] = useState('')
  const [customBulletText, setCustomBulletText] = useState('')
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [newProjTitle, setNewProjTitle] = useState('')
  const [newProjTech, setNewProjTech] = useState('')
  const [newProjBullet, setNewProjBullet] = useState('')

  const approvedCount = Object.values(approvals).filter(Boolean).length

  // Helper to remove a skill tag
  const handleRemoveSkill = (cat: string, index: number) => {
    const updated = { ...editableSkills }
    if (updated[cat]) {
      updated[cat] = updated[cat].filter((_, i) => i !== index)
      onUpdateSkills(updated)
    }
  }

  // Helper to add skill tag
  const handleAddSkill = (cat: string) => {
    const tag = newSkillTag[cat]?.trim()
    if (tag) {
      const updated = { ...editableSkills }
      if (!updated[cat]) updated[cat] = []
      updated[cat] = [...updated[cat], tag]
      onUpdateSkills(updated)
      setNewSkillTag(prev => ({ ...prev, [cat]: '' }))
    }
  }

  // Helper to add custom category
  const handleAddCategory = () => {
    const name = newCategoryName.trim()
    if (name && !editableSkills[name]) {
      onUpdateSkills({ ...editableSkills, [name]: [] })
      setNewCategoryName('')
      setShowAddCategory(false)
    }
  }

  // Helper to add custom project manually
  const handleCreateCustomProject = () => {
    if (newProjTitle.trim()) {
      const slug = `custom_proj_${Date.now()}`
      onAddCustomProject({
        title: newProjTitle.trim(),
        tech: newProjTech.trim() || 'Python, AWS, AI',
        date: '2025',
        project_slug: slug,
        bullets: newProjBullet.trim() ? [newProjBullet.trim()] : ['Engineered custom scalable system.'],
      })
      setNewProjTitle('')
      setNewProjTech('')
      setNewProjBullet('')
      setShowAddProjectModal(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Interactive Technical Skills Editor */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider flex items-center gap-1.5">
            <span>⚙️ Technical Skills Editor</span>
            <span className="text-[10px] font-normal text-gray-400 lowercase">(edit, add, or remove skill items directly)</span>
          </h3>
          <button
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="text-[11px] font-semibold text-[#0F4C81] hover:underline"
          >
            + Add Category
          </button>
        </div>

        {showAddCategory && (
          <div className="flex gap-2 mb-3 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
            <input
              type="text"
              placeholder="New Category Name (e.g. AI Agents & Workflows)"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              className="flex-1 p-1.5 text-xs bg-white border border-gray-300 rounded outline-none"
            />
            <button
              onClick={handleAddCategory}
              className="px-3 py-1 bg-[#0F4C81] text-white rounded text-xs font-semibold hover:bg-[#0b3a61]"
            >
              Add Category
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(editableSkills).map(([cat, skills]) => (
            <div key={cat} className="bg-gray-50/70 p-3 rounded-lg border border-gray-200/80 flex flex-col justify-between">
              <div>
                <p className="font-bold text-xs text-[#2c3e50] mb-2">{cat}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md shadow-2xs font-medium">
                      {s}
                      <button
                        onClick={() => handleRemoveSkill(cat, i)}
                        className="text-gray-400 hover:text-red-500 font-bold text-[10px] ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  placeholder="Add skill tag..."
                  value={newSkillTag[cat] || ''}
                  onChange={e => setNewSkillTag(prev => ({ ...prev, [cat]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSkill(cat) }}
                  className="flex-1 px-2 py-1 text-[11px] bg-white border border-gray-200 rounded outline-none focus:border-blue-400"
                />
                <button
                  onClick={() => handleAddSkill(cat)}
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[11px] font-semibold"
                >
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Matching & AI Suggested Projects Dashboard */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider flex items-center gap-1.5">
              <span>🛠️ Job Description Project Fit & Selection</span>
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Projects are ranked by AI match score against the target JD</p>
          </div>
          <button
            onClick={() => setShowAddProjectModal(true)}
            className="px-3 py-1.5 bg-[#0F4C81] text-white rounded-lg text-xs font-semibold hover:bg-[#0b3a61] transition-colors"
          >
            + Add Custom Project
          </button>
        </div>

        {/* Existing Projects List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {projects.map(proj => {
            const isIncluded = !excludedProjects.includes(proj.project_slug)
            const rel = projectRelevance[proj.project_slug]
            const score = rel?.score ?? 80

            return (
              <label
                key={proj.project_slug}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  isIncluded
                    ? 'border-blue-200 bg-blue-50/20 text-[#0F4C81]'
                    : 'border-gray-200 bg-gray-50/40 text-gray-400 opacity-65'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isIncluded}
                  onChange={() => onToggleProject?.(proj.project_slug)}
                  className="rounded border-gray-300 text-[#0F4C81] focus:ring-[#0F4C81] w-4 h-4 cursor-pointer mt-0.5"
                />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate font-bold">{proj.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${score >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {score}% JD Match
                    </span>
                  </div>
                  {rel?.reason && (
                    <span className="text-[10px] text-gray-400 font-normal truncate mt-0.5">{rel.reason}</span>
                  )}
                </div>
              </label>
            )
          })}
        </div>

        {/* AI Generated New Projects for JD */}
        {suggestedProjects.length > 0 && (
          <div className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50/40 rounded-xl p-3 border border-blue-100">
            <p className="text-[11px] font-bold text-[#0F4C81] mb-2 flex items-center gap-1.5">
              <span>⚡ AI-Generated Tailored Projects for this JD</span>
              <span className="text-[9px] font-normal text-gray-500">(created automatically because JD required specific skills)</span>
            </p>
            <div className="flex flex-col gap-2">
              {suggestedProjects.map(sproj => {
                const isIncluded = !excludedProjects.includes(sproj.project_slug)
                return (
                  <div key={sproj.project_slug} className="bg-white p-3 rounded-lg border border-blue-200 shadow-2xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={() => onToggleProject?.(sproj.project_slug)}
                          className="rounded text-[#0F4C81] focus:ring-[#0F4C81] w-4 h-4"
                        />
                        <div>
                          <p className="font-bold text-xs text-[#2c3e50]">{sproj.title}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{sproj.tech}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        ⚡ AI Created for JD
                      </span>
                    </div>
                    <ul className="mt-2 pl-4 list-disc text-xs text-gray-600 space-y-1">
                      {sproj.bullets.map((b, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal for adding custom project */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-xl border border-gray-200">
            <h3 className="font-bold text-sm text-[#2c3e50] mb-3">Add Custom Project Manually</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Project Title (e.g. Autonomous Multi-Agent Support Network)"
                value={newProjTitle}
                onChange={e => setNewProjTitle(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-xs outline-none"
              />
              <input
                type="text"
                placeholder="Tech Stack (e.g. Python, LangChain, FastAPI, Redis)"
                value={newProjTech}
                onChange={e => setNewProjTech(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-xs outline-none"
              />
              <textarea
                placeholder="Key Achievement Bullet Point (use <strong> for metrics)"
                value={newProjBullet}
                onChange={e => setNewProjBullet(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-xs outline-none h-20"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomProject}
                  className="px-4 py-1.5 bg-[#0F4C81] text-white rounded-lg text-xs font-semibold"
                >
                  Add Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Personal Bullet Bar */}
      <div className="bg-purple-50/40 rounded-xl p-3 border border-purple-100 flex flex-col md:flex-row gap-2 items-center">
        <div className="flex-1 flex gap-2 w-full">
          <select
            value={customBulletRole}
            onChange={e => setCustomBulletRole(e.target.value)}
            className="p-2 border border-purple-200 rounded-lg text-xs text-[#2c3e50] bg-white font-semibold outline-none"
          >
            <option value="">Select Section to Add Custom Bullet...</option>
            <option value="fhk">Experience: FH Kufstein</option>
            <option value="techbit">Experience: TechBit Systems</option>
            {projects.map(p => (
              <option key={p.project_slug} value={p.project_slug}>Project: {p.title}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Write custom personal bullet point..."
            value={customBulletText}
            onChange={e => setCustomBulletText(e.target.value)}
            className="flex-1 p-2 border border-purple-200 rounded-lg text-xs bg-white outline-none"
          />
        </div>
        <button
          onClick={() => {
            if (customBulletRole && customBulletText.trim()) {
              onAddCustomBullet(customBulletRole, customBulletText.trim())
              setCustomBulletText('')
            }
          }}
          disabled={!customBulletRole || !customBulletText.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-40 transition-colors shrink-0"
        >
          + Add Personal Bullet
        </button>
      </div>

      {/* ATS Keywords Pill Container */}
      {extractedKeywords.length > 0 && (
        <div className="bg-[#f0f4f8] rounded-xl p-3.5 border border-blue-100/50">
          <p className="font-semibold text-[10px] text-[#0F4C81] uppercase tracking-wider mb-2">🎯 Targeted ATS Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {extractedKeywords.map((kw, i) => (
              <span key={i} className="text-[11px] font-semibold bg-white text-[#0F4C81] px-2.5 py-0.5 rounded-full border border-blue-200/50 shadow-2xs">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Review Header Controls */}
      <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
        <span>{approvedCount} of {diffs.length} sections approved</span>
        <button onClick={onApproveAll} className="text-[#0F4C81] hover:underline text-xs font-semibold">
          Approve all
        </button>
      </div>

      {/* Cards list */}
      {diffs.map(diff => {
        const isBullet = !['summary', 'tagline'].includes(diff.section_id) && !diff.section_id.startsWith('skills_')
        const isProjectExcluded = isBullet && excludedProjects.some(slug => diff.section_id.startsWith(`${slug}_`))

        return (
          <DiffCard
            key={diff.section_id}
            diff={diff}
            approved={approvals[diff.section_id] ?? true}
            manualValue={manualEdits[diff.section_id]}
            onToggle={() => onToggle(diff.section_id)}
            onManualEdit={(val) => onManualEdit(diff.section_id, val)}
            isProjectExcluded={isProjectExcluded}
          />
        )
      })}
    </div>
  )
}
