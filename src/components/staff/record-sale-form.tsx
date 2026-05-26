import { GlassWater } from 'lucide-react'

// Dummy action function for UI scaffolding
async function handleSale(formData: FormData) {
  'use server'
  // Server Action Simulation
}

export function RecordSaleForm() {
  return (
    <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-8 mb-6">
      <div className="mb-6">
        <h2 className="text-[18px] font-bold text-[#0f172a] tracking-tight mb-1">Record New Sale</h2>
        <p className="text-[13px] font-medium text-[#94a3b8]">Enter distribution details for the current shift.</p>
      </div>
      
      <hr className="border-[#f1f5f9] mb-6 block" />

      <form action={handleSale} className="flex flex-col gap-3">
        <label htmlFor="quantity" className="text-[14px] font-bold text-[#1e293b]">Number of Liters Sold</label>
        
        <div className="flex items-center gap-4 w-full">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <GlassWater size={18} className="text-[#94a3b8]" />
            </div>
            <input 
              type="number" 
              id="quantity" 
              name="quantity" 
              min="1"
              placeholder="e.g. 5"
              className="w-full h-[50px] pl-[44px] pr-4 bg-white border border-[#e2e8f0] rounded-[10px] text-[15px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="h-[50px] px-8 bg-[#4fa0ff] hover:bg-[#3b82f6] text-white font-bold text-[15px] rounded-[10px] transition-colors whitespace-nowrap shadow-sm"
          >
            Submit Entry
          </button>
        </div>
      </form>
    </div>
  )
}
