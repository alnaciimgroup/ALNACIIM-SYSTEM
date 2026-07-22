import { Header } from '@/components/layout/header'
import { getPendingBackdates } from './actions'
import { BackdatesClient } from './backdates-client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default async function BackdatesApprovalPage() {
  const requests = await getPendingBackdates()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Backdate Approvals" />

      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px] mb-6">
          <h2 className="text-[20px] font-black text-[#0f172a] mb-1 tracking-tight">Audit & Verify Missed Sales</h2>
          <p className="text-[14px] font-medium text-[#64748b]">Review sales recorded retroactively by staff members due to missed logging days.</p>
        </div>

        <BackdatesClient initialRequests={requests as any} />
      </main>
    </div>
  )
}
