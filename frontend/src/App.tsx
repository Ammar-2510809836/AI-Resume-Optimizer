import { useTailor } from './hooks/useTailor'
import { JobInput } from './components/JobInput'
import { DiffViewer } from './components/DiffViewer'
import { LoadingState } from './components/LoadingState'

export default function App() {
  const {
    state, diffs, approvals, error,
    submitJD, toggleApproval, approveAll, generatePDF, reset,
  } = useTailor()

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
                  <h2 className="font-bold text-[#2c3e50]">Section Review</h2>
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
                <div className="overflow-y-auto flex-1 pr-1">
                  <DiffViewer
                    diffs={diffs}
                    approvals={approvals}
                    onToggle={toggleApproval}
                    onApproveAll={approveAll}
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
