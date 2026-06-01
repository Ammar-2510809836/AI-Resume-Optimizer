import { useState } from 'react'
import type { ParsedResume } from '../types'

interface Props {
  parsedResume: ParsedResume
  onSave: (updated: ParsedResume) => void
  onCancel: () => void
}

export function ResumeEditor({ parsedResume, onSave, onCancel }: Props) {
  const [edited, setEdited] = useState<ParsedResume>({ ...parsedResume })

  const handleTextChange = (field: keyof ParsedResume, value: string) => {
    setEdited(prev => ({ ...prev, [field]: value }))
  }

  const handleContactChange = (field: string, value: string) => {
    setEdited(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }))
  }

  const handleExperienceBulletChange = (expIndex: number, bulletIndex: number, value: string) => {
    setEdited(prev => {
      const expList = [...prev.experience]
      const bullets = [...expList[expIndex].bullets]
      bullets[bulletIndex] = value
      expList[expIndex] = { ...expList[expIndex], bullets }
      return { ...prev, experience: expList }
    })
  }

  const handleProjectBulletChange = (projIndex: number, bulletIndex: number, value: string) => {
    setEdited(prev => {
      const projList = [...prev.projects]
      const bullets = [...projList[projIndex].bullets]
      bullets[bulletIndex] = value
      projList[projIndex] = { ...projList[projIndex], bullets }
      return { ...prev, projects: projList }
    })
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-[#2c3e50]">Verify Parsed Resume</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Review and adjust what our AI extracted from your resume.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 border border-gray-200 text-gray-400 hover:text-gray-600 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(edited)}
            className="px-4 py-1.5 bg-[#0F4C81] text-white hover:bg-[#0b3a61] rounded-lg text-xs font-semibold shadow-sm"
          >
            Confirm & Save Resume ✔
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[550px] pr-2 flex flex-col gap-5 text-xs">
        {/* Name & Tagline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gray-700">Full Name</label>
            <input
              type="text"
              value={edited.name}
              onChange={(e) => handleTextChange('name', e.target.value)}
              className="p-2 border border-gray-200 rounded-lg outline-none focus:border-[#0F4C81]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gray-700">Professional Tagline</label>
            <input
              type="text"
              value={edited.tagline}
              onChange={(e) => handleTextChange('tagline', e.target.value)}
              className="p-2 border border-gray-200 rounded-lg outline-none focus:border-[#0F4C81]"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
          <h3 className="font-bold text-[#0F4C81] uppercase tracking-wider text-[10px] mb-1">📞 Contact Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-gray-500 font-medium">Email</label>
              <input
                type="text"
                value={edited.contact.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
                className="p-1.5 bg-white border border-gray-200 rounded-md outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-500 font-medium">Phone</label>
              <input
                type="text"
                value={edited.contact.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                className="p-1.5 bg-white border border-gray-200 rounded-md outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-500 font-medium">Location</label>
              <input
                type="text"
                value={edited.contact.location}
                onChange={(e) => handleContactChange('location', e.target.value)}
                className="p-1.5 bg-white border border-gray-200 rounded-md outline-none"
              />
            </div>
          </div>
        </div>

        {/* Experience Bullets */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-[#0F4C81] uppercase tracking-wider text-[10px]">💼 Experience Highlights</h3>
          {edited.experience.map((exp, expIdx) => (
            <div key={expIdx} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-gray-800">{exp.title}</span>
                <span className="text-gray-400 text-[10px]">{exp.company}</span>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {exp.bullets.map((bullet, bulletIdx) => (
                  <textarea
                    key={bulletIdx}
                    value={bullet}
                    onChange={(e) => handleExperienceBulletChange(expIdx, bulletIdx, e.target.value)}
                    className="p-2 bg-gray-50/30 border border-gray-200 rounded-lg outline-none focus:bg-white resize-none text-[11px] leading-relaxed"
                    rows={2}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Projects Bullets */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-[#0F4C81] uppercase tracking-wider text-[10px]">🚀 Key Projects</h3>
          {edited.projects.map((proj, projIdx) => (
            <div key={projIdx} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2">
              <span className="font-bold text-gray-800">{proj.title}</span>
              <div className="flex flex-col gap-2 mt-1">
                {proj.bullets.map((bullet, bulletIdx) => (
                  <textarea
                    key={bulletIdx}
                    value={bullet}
                    onChange={(e) => handleProjectBulletChange(projIdx, bulletIdx, e.target.value)}
                    className="p-2 bg-gray-50/30 border border-gray-200 rounded-lg outline-none focus:bg-white resize-none text-[11px] leading-relaxed"
                    rows={2}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
