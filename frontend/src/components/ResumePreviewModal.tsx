import { useEffect, useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onGeneratePdf: () => void
  fetchPreviewHtml: () => Promise<string>
  isExportingPdf: boolean
  templateId: string
}

export function ResumePreviewModal({
  isOpen,
  onClose,
  onGeneratePdf,
  fetchPreviewHtml,
  isExportingPdf,
  templateId,
}: Props) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      fetchPreviewHtml().then(html => {
        setHtmlContent(html)
        setIsLoading(false)
      })
    }
  }, [isOpen, fetchPreviewHtml, templateId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#f8fafc]">
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <div>
              <h2 className="font-bold text-[#2c3e50] text-base">Final Resume Visual Preview</h2>
              <p className="text-xs text-gray-500">Review your final layout before generating your official PDF document</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onGeneratePdf}
              disabled={isExportingPdf || isLoading}
              className="px-5 py-2.5 bg-[#0F4C81] text-white rounded-xl text-xs font-semibold
                         hover:bg-[#0b3a61] disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
            >
              {isExportingPdf ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <span>📥</span> Download PDF Document
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition-colors font-bold text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body: iFrame Preview */}
        <div className="flex-1 bg-gray-100/70 p-4 overflow-hidden relative">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500">
              <div className="w-8 h-8 border-3 border-[#0F4C81]/20 border-t-[#0F4C81] rounded-full animate-spin" />
              <p className="text-xs font-medium">Rendering final resume template...</p>
            </div>
          ) : (
            <iframe
              title="Resume Live Preview"
              srcDoc={htmlContent}
              className="w-full h-full bg-white rounded-xl shadow-md border border-gray-200"
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-[#f8fafc] flex justify-between items-center text-xs text-gray-400">
          <span>Format: <strong className="text-gray-600 uppercase">{templateId}</strong> template style</span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 font-medium"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  )
}
