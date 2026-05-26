import { Header } from '@/components/layout/header'
import { getDraftSales } from './actions'
import { DraftList } from './draft-list'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DraftsPage() {
  const drafts = await getDraftSales()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Pending Drafts" subtitle="Manage your unresolved sales" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-[16px] bg-[#fff7ed] flex items-center justify-center shrink-0">
                <AlertCircle className="text-[#f59e0b]" size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[20px] font-black text-[#0f172a] tracking-tight">Unresolved Drafts</h2>
                <p className="text-[#64748b] text-[14px] font-medium mt-1">
                  These sales have deducted inventory but are waiting for payment confirmation. 
                  You must resolve all drafts to Cash or Debt before submitting your daily report.
                </p>
              </div>
            </div>

            {drafts.length === 0 ? (
              <div className="text-center py-12 bg-[#f8fafc] rounded-[16px] border border-dashed border-[#cbd5e1]">
                <p className="text-[15px] font-bold text-[#64748b]">No pending drafts!</p>
                <p className="text-[13px] text-[#94a3b8] mt-1">You are all clear.</p>
              </div>
            ) : (
              <DraftList initialDrafts={drafts} />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
