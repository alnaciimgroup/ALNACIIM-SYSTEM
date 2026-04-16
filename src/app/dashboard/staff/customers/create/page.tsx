'use client'

import { Header } from '@/components/layout/header'
import { createCustomer } from '@/app/dashboard/staff/customers/actions'
import { useActionState } from 'react'
import Link from 'next/link'

export default function CreateCustomerPage() {
  const [state, formAction, isPending] = useActionState(createCustomer, null)

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[800px] mx-auto">
          
          <div className="mb-8">
            <h2 className="text-[28px] font-black text-[#0f172a] mb-1 tracking-tight">Add New Customer</h2>
            <p className="text-[15px] font-medium text-[#64748b]">Create a new customer profile attached to your staff account.</p>
          </div>

          <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-8">
            <form action={formAction} className="flex flex-col gap-6">
              
              {state?.errors && (
                <div className="p-4 bg-red-50 text-red-600 rounded-[12px] text-[14px] font-medium border border-red-100">
                  {state.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" id="name" name="name" required placeholder="e.g. Abdi Jama" className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all" />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></label>
                  <input type="tel" id="phone" name="phone" required placeholder="e.g. +252 61..." className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="address" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Zone / Address</label>
                <input type="text" id="address" name="address" placeholder="e.g. Hodan District, Maka Al-Mukarama Road" className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="tank_number" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider text-[#3b82f6]">Tank Number / Box ID <span className="text-red-500">*</span></label>
                <input type="text" id="tank_number" name="tank_number" required placeholder="e.g. T-800 or B-42" className="h-[48px] px-4 rounded-[12px] border border-[#3b82f6]/30 bg-blue-50/10 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all font-black text-[#3b82f6]" />
                <p className="text-[11px] font-medium text-[#64748b]">This number is permanent and will stay with the customer for all future tanks.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="guarantor" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Guarantor Name <span className="text-red-500">*</span></label>
                  <input type="text" id="guarantor" name="guarantor" required placeholder="e.g. Farax Ahmed" className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all" />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="guarantor_phone" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Guarantor Number <span className="text-red-500">*</span></label>
                  <input type="tel" id="guarantor_phone" name="guarantor_phone" required placeholder="e.g. +252 61..." className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all" />
                </div>
              </div>

              <hr className="border-[#f1f5f9] my-2" />

              <div className="flex items-center justify-end gap-4">
                <Link href="/dashboard/staff/customers" className="px-6 py-3 rounded-[12px] text-[15px] font-bold text-[#64748b] hover:bg-gray-100 transition-colors">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="bg-[#4fa0ff] hover:bg-[#3b82f6] text-white font-bold h-[48px] px-8 rounded-[12px] transition-colors shadow-sm disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Create Customer'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
