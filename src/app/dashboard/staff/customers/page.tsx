import { Header } from '@/components/layout/header'
import { CustomerList } from '@/components/staff/customers/customer-list'
import { getCustomers } from './actions'
import Link from 'next/link'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default async function StaffCustomersPage({ searchParams }: { searchParams: Promise<{ filter?: string, viewProfile?: string }> }) {
  const { filter, viewProfile } = await searchParams
  const customers = await getCustomers()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full">
          <section className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-[28px] font-black text-[#0f172a] mb-1 tracking-tight">My Customers</h2>
              <p className="text-[15px] font-medium text-[#64748b]">Manage your dedicated customer accounts and statuses.</p>
            </div>
            
            <Link href="/dashboard/staff/customers/create" className="bg-[#4fa0ff] hover:bg-[#3b82f6] text-white font-bold h-[44px] px-6 rounded-[12px] flex items-center gap-2 transition-colors shadow-sm">
              <span className="text-[18px] leading-none mb-0.5">+</span> Add Customer
            </Link>
          </section>

          <CustomerList initialCustomers={customers} initialFilter={filter} initialViewProfileId={viewProfile} />
        </div>
      </main>
    </div>
  )
}
