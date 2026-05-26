'use client'

import { useState } from 'react'
import { Search, Phone, UserCircle, MapPin, AlertCircle, Clock } from 'lucide-react'

export function DebtorsList({ debtors }: { debtors: any[] }) {
  const [search, setSearch] = useState('')

  const filteredDebtors = debtors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.phone.includes(search) ||
    d.staffName.toLowerCase().includes(search.toLowerCase())
  )

  const totalDebt = filteredDebtors.reduce((acc, d) => acc + Number(d.debt), 0)

  return (
    <div className="w-full max-w-[1200px]">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-3">
            <AlertCircle className="text-[#ef4444]" size={24} strokeWidth={2.5} />
            Global Debtors List
          </h2>
          <p className="text-[14px] font-medium text-[#64748b]">View and search all customers with an outstanding balance across all staff.</p>
        </div>
        
        <div className="bg-white px-5 py-3 rounded-[16px] border border-[#e2e8f0] shadow-sm flex items-center gap-4">
           <div>
             <div className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-0.5">Total Filtered Debt</div>
             <div className="text-[20px] font-black text-[#ef4444] leading-none">${totalDebt.toFixed(2)}</div>
           </div>
           <div className="w-[1px] h-8 bg-[#f1f5f9]"></div>
           <div>
             <div className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-0.5">Customers</div>
             <div className="text-[20px] font-black text-[#0f172a] leading-none">{filteredDebtors.length}</div>
           </div>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-[24px] shadow-sm mb-6 flex items-center px-4 h-14">
        <Search className="text-[#94a3b8] mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Search by customer name, phone number, or assigned staff..." 
          className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-[#0f172a] placeholder:text-[#94a3b8]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDebtors.map(debtor => (
          <div key={debtor.id} className="bg-white border border-[#e5e7eb] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden">
            {/* Top red indicator */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#ef4444]"></div>
            
            <div className="flex justify-between items-start mb-5 pt-2">
              <div>
                <h3 className="text-[18px] font-black text-[#0f172a] leading-tight mb-1">{debtor.name}</h3>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-1 rounded-[6px] inline-flex">
                  <UserCircle size={14} className="text-[#3b82f6]" /> {debtor.staffName}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest mb-1">Owed</div>
                <div className="text-[24px] font-black text-[#ef4444] leading-none tracking-tighter">${Number(debtor.debt).toFixed(2)}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 flex-1 mb-6 bg-[#f8fafc] p-4 rounded-[16px] border border-[#f1f5f9]">
              <div className="flex items-center gap-3 text-[13px] font-medium text-[#475569]">
                <Phone size={16} className="text-[#94a3b8] shrink-0" /> {debtor.phone}
              </div>
              {debtor.address && (
                <div className="flex items-start gap-3 text-[13px] font-medium text-[#475569]">
                  <MapPin size={16} className="text-[#94a3b8] shrink-0 mt-0.5" /> {debtor.address}
                </div>
              )}
              {debtor.lastActivity && (
                <div className="flex items-center gap-3 text-[13px] font-medium text-[#475569]">
                  <Clock size={16} className="text-[#94a3b8] shrink-0" /> Last Active: {new Date(debtor.lastActivity).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div className="mt-auto flex justify-between items-center text-[11px] font-bold">
               <span className={`px-2 py-1 rounded-full uppercase tracking-widest ${
                 debtor.status === 'active' ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#fef2f2] text-[#ef4444]'
               }`}>
                 {debtor.status}
               </span>
            </div>
          </div>
        ))}
        
        {filteredDebtors.length === 0 && (
           <div className="col-span-full py-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-[#f8fafc] rounded-full flex items-center justify-center mb-4">
               <AlertCircle className="text-[#94a3b8]" size={32} />
             </div>
             <h3 className="text-[18px] font-bold text-[#0f172a] mb-2">No debtors found</h3>
             <p className="text-[#64748b]">Try adjusting your search criteria.</p>
           </div>
        )}
      </div>
    </div>
  )
}
