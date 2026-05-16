import { Header } from '@/components/layout/header'
import { DistributionForm } from '@/components/agent/distribution-form'
import { DistributionHistory } from '@/components/agent/distribution-history'
import { getAgentDashboardData } from '../actions'

export default async function TankDistributionPage() {
  let data;
  try {
    data = await getAgentDashboardData()
  } catch (err) {
    data = {
      staffList: [
        { id: '1', full_name: 'Mohamed' },
        { id: '2', full_name: 'Ali' },
        { id: '3', full_name: 'Abdi' },
        { id: '4', full_name: 'Hassan' },
        { id: '5', full_name: 'Yusuf' }
      ],
      distributions: []
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Tank Distribution" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full">
          <section className="mb-6">
            <h2 className="text-[18px] font-bold text-[#0f172a] mb-1">Record New Distribution</h2>
            <p className="text-[14px] font-medium text-[#64748b]">Assign tanks to staff members for the current shift.</p>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
            <DistributionForm staffList={data.staffList} />
            <DistributionHistory distributions={data.distributions} />
          </section>
        </div>
      </main>
    </div>
  )
}
