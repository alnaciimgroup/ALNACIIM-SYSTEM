'use client'

import { useActionState } from 'react'
import { submitDistribution } from '@/app/dashboard/agent/actions'
import { Send, PlusCircle, AlignJustify } from 'lucide-react'

type StaffMember = {
  id: string
  full_name: string
}

const initialState = {
  message: '',
  errors: false,
}

import { useToast } from '@/components/ui/toast'
import { useEffect, useRef } from 'react'

export function DistributionForm({ staffList }: { staffList: StaffMember[] }) {
  const [state, formAction, isPending] = useActionState(submitDistribution, initialState)
  const { showToast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.message) {
      showToast(state.message, state.errors ? 'error' : 'success')
      if (!state.errors && formRef.current) {
        formRef.current.reset()
      }
    }
  }, [state, showToast])
  
  return (
    <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-full flex items-center justify-center">
          <PlusCircle size={24} className="text-[#3b82f6] fill-[#eff6ff]" strokeWidth={2.5} />
        </div>
        <h2 className="text-[18px] font-bold text-[#0f172a] tracking-tight">New Distribution</h2>
      </div>

      <form ref={formRef} action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="staff_id" className="text-[14px] font-bold text-[#1e293b]">Select Staff Member</label>
          <div className="relative">
            <select 
              id="staff_id" 
              name="staff_id" 
              className="w-full h-[46px] px-4 bg-white border border-[#e2e8f0] rounded-[10px] text-[14px] font-medium text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all appearance-none"
              required
              defaultValue=""
            >
              <option value="" disabled>Select staff...</option>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.full_name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="quantity" className="text-[14px] font-bold text-[#1e293b]">Number of Tanks (Total)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <AlignJustify size={14} className="text-[#94a3b8]" />
            </div>
            <input 
              type="number" 
              id="quantity" 
              name="quantity" 
              min="1"
              placeholder="50"
              className="w-full h-[46px] pl-[38px] pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] text-[15px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:bg-white focus:border-[#3b82f6] transition-all"
              required
            />
          </div>
        </div>



        <div className="flex flex-col gap-2">
          <label htmlFor="zone" className="text-[14px] font-bold text-[#1e293b]">Location / Zone</label>
          <div className="relative">
            <select 
              id="zone" 
              name="zone" 
              className="w-full h-[46px] px-4 bg-white border border-[#e2e8f0] rounded-[10px] text-[14px] font-medium text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all appearance-none"
              required
              defaultValue=""
            >
              <option value="" disabled>Select zone...</option>
              {['North District', 'South District', 'East District', 'West District'].map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full h-[46px] mt-2 bg-[#4fa0ff] hover:bg-[#3b82f6] text-white font-bold text-[15px] rounded-[10px] flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
        >
          {isPending ? 'Submitting...' : (
            <>
              <Send size={18} fill="currentColor" strokeWidth={0} />
              Submit Distribution
            </>
          )}
        </button>
      </form>
    </div>
  )
}
