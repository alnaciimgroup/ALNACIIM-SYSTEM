import { Droplet, Users, CalendarDays, TrendingUp } from 'lucide-react'

interface MetricsProps {
  distributedToday: number
  freeToday?: number
  staffServed: number
  totalThisWeek: number
  freeThisWeek?: number
  activeStaffCount: number
}

export function AgentMetricsCards({ metrics }: { metrics: MetricsProps }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Registered Staff */}
      <div className="p-6 rounded-[16px] bg-[#4B9EF9] shadow-lg shadow-blue-500/20 flex flex-col justify-between h-[160px] text-white">
        <div className="flex justify-between items-start">
          <h3 className="text-white font-medium text-[15px] leading-snug opacity-95 tracking-wide">Registered<br/>Operational Staff</h3>
        </div>
        <div className="mb-2">
          <span className="text-[44px] font-extrabold tracking-tight leading-none block mb-1.5">{metrics.activeStaffCount}</span>
          <p className="text-[12px] text-white font-medium opacity-80">Active identities in registry</p>
        </div>
      </div>

      {/* Tanks Distributed */}
      <div className="p-6 rounded-[20px] bg-white border border-[#e5e7eb] flex flex-col justify-between h-[160px] shadow-sm">
        <div className="flex justify-between items-start">
          <h3 className="text-[#64748b] font-medium text-[15px] leading-snug">Tanks Distributed<br/>Today</h3>
          <div className="text-[#3b82f6]">
            <Droplet size={24} strokeWidth={2} />
          </div>
        </div>
        <div className="mb-1 flex items-end gap-2">
          <span className="text-[38px] font-extrabold text-[#0f172a] tracking-tight leading-none block mb-2">{metrics.distributedToday}</span>
          <span className="text-[13px] font-black text-[#10b981] mb-3 uppercase tracking-widest">{metrics.freeToday || 0} Free</span>
        </div>
      </div>

      {/* Staff Served */}
      <div className="p-6 rounded-[20px] bg-white border border-[#e5e7eb] flex flex-col justify-between h-[160px] shadow-sm">
        <div className="flex justify-between items-start">
          <h3 className="text-[#64748b] font-medium text-[15px] leading-snug">Staff Served Today</h3>
          <div className="text-[#3b82f6]">
            <Users size={24} strokeWidth={2} />
          </div>
        </div>
        <div className="mb-1">
          <span className="text-[38px] font-extrabold text-[#0f172a] tracking-tight leading-none block mb-2">{metrics.staffServed}</span>
          <p className="text-[13px] text-[#94a3b8] font-medium">Distinct assignments made</p>
        </div>
      </div>

      {/* Total This Week */}
      <div className="p-6 rounded-[20px] bg-white border border-[#e5e7eb] flex flex-col justify-between h-[160px] shadow-sm">
        <div className="flex justify-between items-start">
          <h3 className="text-[#64748b] font-medium text-[15px] leading-snug">Total Distributed<br/>This Week</h3>
          <div className="text-[#3b82f6]">
            <CalendarDays size={24} strokeWidth={2} />
          </div>
        </div>
        <div className="mb-1 flex items-end gap-2">
          <span className="text-[38px] font-extrabold text-[#0f172a] tracking-tight leading-none block mb-2">{metrics.totalThisWeek}</span>
          <span className="text-[13px] font-black text-[#10b981] mb-3 uppercase tracking-widest">{metrics.freeThisWeek || 0} Free</span>
        </div>
      </div>
    </div>
  )
}
