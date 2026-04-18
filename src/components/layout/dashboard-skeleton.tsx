export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc] animate-pulse">
      {/* Header Skeleton */}
      <header className="h-[72px] min-h-[72px] bg-white border-b border-[#e2e8f0] px-8 flex items-center justify-between z-10 w-full relative">
        <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
        <div className="flex items-center gap-4">
          <div className="h-9 w-[180px] bg-slate-200 rounded-md hidden lg:block"></div>
          <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full">
          {/* Top Section / Title Area */}
          <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-10">
            <div>
              <div className="h-10 w-64 bg-slate-200 rounded-md mb-2"></div>
              <div className="h-5 w-40 bg-slate-200 rounded-md"></div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-[48px] w-[200px] bg-slate-200 rounded-[14px]"></div>
              <div className="h-[48px] w-[200px] bg-slate-200 rounded-[14px]"></div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-[24px] p-6 border border-[#e2e8f0] h-[160px]">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-4 w-24 bg-slate-200 rounded"></div>
                  <div className="h-10 w-10 bg-slate-200 rounded-[12px]"></div>
                </div>
                <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 w-16 bg-slate-200 rounded mt-4"></div>
              </div>
            ))}
          </div>

          {/* Table / List Section */}
          <div className="bg-white rounded-[24px] border border-[#e2e8f0] overflow-hidden">
            <div className="p-6 border-b border-[#e2e8f0]">
              <div className="h-6 w-48 bg-slate-200 rounded"></div>
            </div>
            <div className="p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-[#e2e8f0] last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-200 rounded-[12px]"></div>
                    <div>
                      <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                      <div className="h-3 w-20 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-24 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
