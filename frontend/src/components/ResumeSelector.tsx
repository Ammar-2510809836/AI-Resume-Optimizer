import { useState } from 'react'

interface Props {
  onUseDefault: () => void
  onParseText: (text: string) => void
  isLoading: boolean
}

export function ResumeSelector({ onUseDefault, onParseText, isLoading }: Props) {
  const [text, setText] = useState('')
  const [showPaste, setShowPaste] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0F4C81] rounded-full animate-spin" />
        <div>
          <h3 className="font-bold text-[#2c3e50] text-lg">AI Resume Parser Active</h3>
          <p className="text-sm text-gray-400 max-w-sm mt-1">
            Analyzing, structuring, and parsing your resume. This takes about 5-10 seconds.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 justify-center min-h-[450px]">
      <div className="text-center max-w-md mx-auto">
        <span className="text-5xl">🎯</span>
        <h2 className="text-xl font-bold text-[#2c3e50] mt-3">Welcome to Resume Tailor</h2>
        <p className="text-sm text-gray-400 mt-1.5">
          An AI-powered system that tailors resumes to target any job description perfectly using Groq LLaMA 3.3.
        </p>
      </div>

      {!showPaste ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full px-4">
          {/* Card 1: Default Master CV */}
          <button
            onClick={onUseDefault}
            className="flex flex-col text-left p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-[#0F4C81] hover:shadow-md transition-all group"
          >
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">💼</span>
            <h3 className="font-bold text-gray-800 text-base">Use Ammar Khalid's CV</h3>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Skip setup and instantly target job postings using Ammar's preloaded AI, Cloud, and DevOps master resume.
            </p>
            <span className="text-xs font-semibold text-[#0F4C81] mt-auto pt-4 group-hover:translate-x-1 transition-transform">
              Proceed to Job Description →
            </span>
          </button>

          {/* Card 2: Custom Resume Parser */}
          <button
            onClick={() => setShowPaste(true)}
            className="flex flex-col text-left p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-[#0F4C81] hover:shadow-md transition-all group"
          >
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">✨</span>
            <h3 className="font-bold text-gray-800 text-base">Paste Your Own Resume</h3>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Paste your raw CV details. Our AI will automatically structure, parse, and tailor your background dynamically.
            </p>
            <span className="text-xs font-semibold text-[#0F4C81] mt-auto pt-4 group-hover:translate-x-1 transition-transform">
              Parse your CV now →
            </span>
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto w-full px-4 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">Paste Your Unstructured Resume Text</h3>
            <button
              onClick={() => setShowPaste(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Back
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your skills, experience, projects, and contact info here. Format does not matter—our AI handles all raw structures."
            className="w-full h-64 p-3 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#0F4C81] focus:border-[#0F4C81] outline-none leading-relaxed resize-none"
          />
          <button
            disabled={!text.trim()}
            onClick={() => onParseText(text)}
            className="w-full py-3 bg-[#0F4C81] text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-[#0b3a61] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start AI Resume Parsing ⚡
          </button>
        </div>
      )}
    </div>
  )
}
