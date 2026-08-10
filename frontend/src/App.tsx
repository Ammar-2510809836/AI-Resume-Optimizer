import { useState } from 'react'
import { useTailor } from './hooks/useTailor'
import { JobInput } from './components/JobInput'
import { DiffViewer } from './components/DiffViewer'
import { LoadingState } from './components/LoadingState'
import { ResumePreviewModal } from './components/ResumePreviewModal'

export default function App() {
  const {
    state, diffs, approvals, tailoredSkills, editableSkills, extractedKeywords,
    projectRelevance, suggestedProjects, customProjects, manualEdits, error,
    templateId, jobDescription, excludedProjects, projects, isExportingPdf,
    setTemplateId, submitJD, toggleApproval, approveAll, updateManualEdit,
    updateSkills, addCustomProject, addCustomBullet, fetchPreviewHtml, generatePDF, reset,
    toggleProjectSelection
  } = useTailor()

  const [refinementPrompt, setRefinementPrompt] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f4f7f6] p-4 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#2c3e50] tracking-tight flex items-center gap-2">
                <span>⚡ Resume Tailor</span>
                <span className="text-xs bg-[#0F4C81] text-white px-2.5 py-0.5 rounded-full font-medium">Pro</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1">Powered by LLaMA 3.3 70B via Groq & Edge Headless PDF</p>
            </div>
            {state !== 'idle' && (
              <button
                onClick={reset}
                className="text-xs font-semibold text-gray-500 hover:text-[#0F4C81] transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs"
              >
                ← Start over
              </button>
            )}
          </div>
          <div className="mt-3 h-1 bg-[#0F4C81] rounded-full" />
        </header>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
            Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left panel: Job Input */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 min-h-[520px] flex flex-col">
            <JobInput onSubmit={submitJD} isLoading={state === 'loading'} />
          </div>

          {/* Right panel: Loading / Diffs */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 min-h-[520px]">
            {state === 'idle' && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-gray-400">
                <span className="text-5xl">📋</span>
                <p className="text-sm font-medium">Paste a target job description on the left to get started</p>
              </div>
            )}

            {state === 'loading' && <LoadingState />}

            {state === 'reviewing' && (
              <div className="flex flex-col gap-4 h-full">
                
                {/* Header Action Bar */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 flex-wrap gap-2">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-bold text-[#2c3e50] text-base">Section Review</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Style:</label>
                      <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="p-1 border border-gray-300 rounded-md text-[11px] font-bold text-[#0F4C81] outline-none cursor-pointer bg-white"
                      >
                        <option value="modern">Modern Blue (Default)</option>
                        <option value="minimalist">Minimalist Serif</option>
                        <option value="tech">Tech Bold</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPreviewOpen(true)}
                      className="px-3.5 py-2 bg-white text-[#0F4C81] border border-[#0F4C81] rounded-xl text-xs font-bold
                                 hover:bg-blue-50 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>👁️</span> Live Preview
                    </button>
                    <button
                      onClick={generatePDF}
                      disabled={isExportingPdf}
                      className="px-4 py-2 bg-[#0F4C81] text-white rounded-xl text-xs font-bold
                                 hover:bg-[#0b3a61] disabled:opacity-50 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {isExportingPdf ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Exporting PDF...
                        </>
                      ) : (
                        <>
                          <span>📥</span> Generate PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Refinement Feedback Box */}
                <div className="bg-[#f0f4f8] rounded-xl p-3 border border-blue-100 shadow-2xs">
                  <p className="font-bold text-[10px] text-[#0F4C81] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span>⚡ Refine with AI Instruction</span>
                    <span className="text-[9px] text-gray-400 lowercase font-normal">(instruct LLM to reword, emphasize, or modify sections)</span>
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      placeholder="e.g., 'Make the dairy sentinel project sound more senior', 'Ensure FastAPI is prominent', 'Emphasize AI agent orchestrations'"
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
                      className="px-4 py-2 bg-[#0F4C81] text-white rounded-lg text-xs font-semibold hover:bg-[#0b3a61] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                      Refine
                    </button>
                  </div>
                </div>

                {/* Diff Viewer Component */}
                <div className="overflow-y-auto flex-1 pr-1">
                  <DiffViewer
                    diffs={diffs}
                    approvals={approvals}
                    manualEdits={manualEdits}
                    editableSkills={editableSkills}
                    extractedKeywords={extractedKeywords}
                    projectRelevance={projectRelevance}
                    suggestedProjects={suggestedProjects}
                    projects={projects}
                    excludedProjects={excludedProjects}
                    onToggle={toggleApproval}
                    onApproveAll={approveAll}
                    onManualEdit={updateManualEdit}
                    onUpdateSkills={updateSkills}
                    onAddCustomProject={addCustomProject}
                    onAddCustomBullet={addCustomBullet}
                    onToggleProject={toggleProjectSelection}
                  />
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Live Resume Preview Modal */}
      <ResumePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onGeneratePdf={() => {
          setIsPreviewOpen(false)
          generatePDF()
        }}
        fetchPreviewHtml={fetchPreviewHtml}
        isExportingPdf={isExportingPdf}
        templateId={templateId}
      />
    </div>
  )
}
