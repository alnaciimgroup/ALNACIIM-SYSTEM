'use client'

import { useState } from 'react'
import { Download, ChevronRight } from 'lucide-react'
import { ExportModal } from './export-modal'

export function ExportDataButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-[#e2e8f0] rounded-[14px] text-[13px] font-black text-[#0f172a] hover:bg-[#f8fafc] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-all shadow-sm group active:scale-95 uppercase tracking-tight"
      >
        <div className="w-6 h-6 rounded-lg bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center group-hover:bg-[#3b82f6] group-hover:text-white transition-colors">
          <Download size={14} strokeWidth={3} />
        </div>
        Export Ledger
        <ChevronRight size={14} className="text-[#94a3b8] group-hover:translate-x-0.5 transition-transform" />
      </button>

      <ExportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
