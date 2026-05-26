export function InventoryAlerts() {
  return (
    <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-8 h-full">
      <h3 className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest mb-6 block">Inventory Alerts</h3>
      
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-[#f97316] shrink-0"></div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-[#0f172a] mb-1 leading-tight">Stock Reaching Minimum</span>
            <span className="text-[13px] text-[#64748b] leading-snug">20 liters remaining. Request delivery soon.</span>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-[#22c55e] shrink-0"></div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-[#0f172a] mb-1 leading-tight">Price Updated</span>
            <span className="text-[13px] text-[#64748b] leading-snug">Water liter price set to $0.025 per unit.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
