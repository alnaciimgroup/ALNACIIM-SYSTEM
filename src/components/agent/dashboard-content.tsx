import { AgentMetricsCards } from '@/components/agent/metrics-cards'
import { DistributionHistory } from '@/components/agent/distribution-history'
import { getAgentDashboardData } from '@/app/dashboard/agent/actions'
import { ProductionTracker } from '@/components/agent/production-tracker'

export async function AgentDashboardContent({ date }: { date?: string }) {
  let data;
  try {
    data = await getAgentDashboardData(date)
  } catch (err) {
    data = {
      distributions: [],
      metrics: {
        distributedToday: 0,
        staffServed: 0,
        totalThisWeek: 0,
        activeStaffCount: 0
      }
    }
  }

  return (
    <>
      <section className="mb-10">
        <h2 className="text-[18px] font-bold text-[#0f172a] mb-4 tracking-tight">Main Reservoir Management</h2>
        <ProductionTracker totalInventory={data.metrics.availableLiters || 0} />
      </section>

      <section className="mb-8">
        <AgentMetricsCards metrics={data.metrics} />
      </section>

      <section className="grid grid-cols-1 gap-6">
        <DistributionHistory distributions={data.distributions} />
      </section>
    </>
  )
}
