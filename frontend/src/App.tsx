import { useTailor } from './hooks/useTailor'
import { JobInput } from './components/JobInput'
import { DiffViewer } from './components/DiffViewer'
import { LoadingState } from './components/LoadingState'

import { useState } from 'react'

export default function App() {
  const {
    state, diffs, approvals, extractedKeywords, error,
    templateId, jobDescription, excludedProjects, projects,
    setTemplateId, submitJD, toggleApproval, approveAll, generatePDF, reset,
    toggleProjectSelection
  } = useTailor()

  const [refinementPrompt, setRefinementPrompt] = useState('')

  return (
    <div className="min-h-screen bg-[#f4f7f6] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2c3e50] tracking-tight">Resume Tailor</h1>
              <p className="text-sm text-gray-400 mt-0.5">Powered by LLaMA 3.3 70B via Groq</p>
            </div>
            {state !== 'idle' && (
              <button
                onClick={reset}
                className="text-sm text-gray-400 hover:text-[#0F4C81] transition-colors"
              >
                ← Start over
              </button>
            )}
          </div>
          <div className="mt-3 h-1 bg-[#0F4C81] rounded-full" />
        </header>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left panel: Job Input */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 min-h-[520px] flex flex-col">
            <JobInput onSubmit={submitJD} isLoading={state === 'loading'} />
          </div>

          {/* Right panel: Loading / Diffs */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 min-h-[520px]">
            {state === 'idle' && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-gray-400">
                <span className="text-5xl">📋</span>
                <p className="text-sm">Paste a job description on the left to get started</p>
              </div>
            )}

            {state === 'loading' && <LoadingState />}

            {state === 'reviewing' && (
              <div className="flex flex-col gap-3 h-full">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-bold text-[#2c3e50]">Section Review</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Style:</label>
                      <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="p-1 border border-gray-200 rounded text-[10px] font-bold text-[#0F4C81] outline-none cursor-pointer"
                      >
                        <option value="modern">Modern Blue (Default)</option>
                        <option value="minimalist">Minimalist Serif</option>
                        <option value="tech">Tech Bold</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={generatePDF}
                    className="px-5 py-2 bg-[#0F4C81] text-white rounded-lg text-sm font-semibold
                               hover:bg-[#0b3a61] transition-colors shadow-sm"
                  >
                    Generate PDF →
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Opens in new tab → Ctrl+P → Save as PDF
                </p>

                {/* AI Refinement Feedback Box */}
                <div className="bg-[#f0f4f8] rounded-xl p-3 border border-blue-100">
                  <p className="font-semibold text-[10px] text-[#0F4C81] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span>⚡ Refine with AI Instruction</span>
                    <span className="text-[9px] text-gray-400 lowercase font-normal">(tell the LLM what to include, remove, or modify)</span>
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      placeholder="e.g., 'Make the dairy sentinel project sound more senior', 'Ensure FastAPI is prominent', 'Remove AWS Certified Developer Associate from certifications'"
                      value={refinementPrompt}
                      onChange={(e) => setRefinementPrompt(e.target.value)}
                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F4C81] outline-none leading-relaxed resize-none h-12"
                    />
                    <button
                      onClick={() => {
                        if (refinementPrompt.trim()) {
                          submitJD(jobDescription, refinementPrompt.trim())
                          setRefinementPrompt('')
                        }
                      }}
                      disabled={!refinementPrompt.trim()}
                      className="px-4 py-2 bg-[#0F4C81] text-white rounded-lg text-xs font-semibold hover:bg-[#0b3a61] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Refine
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 pr-1">
                  <DiffViewer
                    diffs={diffs}
                    approvals={approvals}
                    extractedKeywords={extractedKeywords}
                    onToggle={toggleApproval}
                    onApproveAll={approveAll}
                    projects={projects}
                    excludedProjects={excludedProjects}
                    onToggleProject={toggleProjectSelection}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
