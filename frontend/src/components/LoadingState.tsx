export function LoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[#0F4C81] font-medium animate-pulse">
        Analysing job description with LLaMA 3.3 70B...
      </p>
      {['Summary', 'Skills — AI & LLM', 'Experience Bullets', 'Project Bullets'].map(label => (
        <div key={label} className="border border-gray-100 rounded-lg p-4 animate-pulse">
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-6 bg-gray-100 rounded w-20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map(col => (
              <div key={col} className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-4/6" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
