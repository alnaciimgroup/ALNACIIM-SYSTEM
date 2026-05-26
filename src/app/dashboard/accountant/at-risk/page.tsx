import { Header } from '@/components/layout/header'
import { getAtRiskCustomers } from '../actions'
import { CustomerAlerts } from '@/components/staff/customer-alerts'

export default async function AtRiskCustomersPage() {
  const atRiskCustomers = await getAtRiskCustomers()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="At-Risk Customers (Churn Report)" />
      
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-[24px] font-black text-[#0f172a] tracking-tight mb-2">Company-Wide Churn Report</h1>
            <p className="text-[14px] font-medium text-[#64748b]">
              This is the master list of all customers who have not ordered water recently. 
              Regular customers appear after 10 days of inactivity. Irregular customers appear after 90 days.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <CustomerAlerts inactiveCustomers={atRiskCustomers} />
          </div>
        </div>
      </main>
    </div>
  )
}
