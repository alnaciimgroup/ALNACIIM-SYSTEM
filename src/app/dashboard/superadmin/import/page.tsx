import { Header } from '@/components/layout/header'
import { verifySession } from '@/utils/auth'
import { getStaffList } from './actions'
import { ImportClient } from './import-client'
import { Database } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SuperadminImportPage() {
  await verifySession(['superadmin'])
  const staff = await getStaffList()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Import Data" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[1200px] mx-auto">
          
          <div className="mb-8">
            <h2 className="text-[22px] font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-3">
              <Database className="text-[#3b82f6]" size={24} strokeWidth={2.5} />
              Centralized Data Import Panel
            </h2>
            <p className="text-[14px] font-medium text-[#64748b]">
              Bootstrap your operational registry by importing bulk spreadsheet records directly into Supabase.
            </p>
          </div>

          <ImportClient staffList={staff} />

        </div>
      </main>
    </div>
  )
}
