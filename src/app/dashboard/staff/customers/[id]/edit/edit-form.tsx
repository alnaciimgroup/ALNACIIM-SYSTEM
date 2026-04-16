'use client'

import { updateCustomer } from '@/app/dashboard/staff/customers/actions'
import { useActionState } from 'react'
import Link from 'next/link'

type EditCustomerFormProps = {
  customer: {
    id: string
    name: string
    phone: string
    address: string | null
    guarantor: string | null
    guarantor_phone: string | null
    tank_number: string | null
    status: string
  }
}

export default function EditCustomerForm({ customer }: EditCustomerFormProps) {
  // Bind the customer.id to the action so it knows which record to update
  const updateCustomerWithId = updateCustomer.bind(null, customer.id)
  const [state, formAction, isPending] = useActionState(updateCustomerWithId, null)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      
      {state?.errors && (
        <div className="p-4 bg-red-50 text-red-600 rounded-[12px] text-[14px] font-medium border border-red-100">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
          <input type="text" id="name" name="name" defaultValue={customer.name} required className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></label>
          <input type="tel" id="phone" name="phone" defaultValue={customer.phone} required className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="address" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Zone / Address</label>
        <input type="text" id="address" name="address" defaultValue={customer.address || ''} className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tank_number" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider text-[#3b82f6]">Tank Number / Box ID <span className="text-red-500">*</span></label>
        <input type="text" id="tank_number" name="tank_number" defaultValue={customer.tank_number || ''} required placeholder="e.g. T-800" className="h-[48px] px-4 rounded-[12px] border border-[#3b82f6]/30 bg-blue-50/10 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all font-black text-[#3b82f6]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="guarantor" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Guarantor Name <span className="text-red-500">*</span></label>
          <input type="text" id="guarantor" name="guarantor" defaultValue={customer.guarantor || ''} required className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="guarantor_phone" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Guarantor Number <span className="text-red-500">*</span></label>
          <input type="tel" id="guarantor_phone" name="guarantor_phone" defaultValue={customer.guarantor_phone || ''} required className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="status" className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Status <span className="text-red-500">*</span></label>
        <select id="status" name="status" defaultValue={customer.status} className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all appearance-none">
          <option value="active">Active (Eligible for sales)</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <hr className="border-[#f1f5f9] my-2" />

      <div className="flex items-center justify-end gap-4">
        <Link href="/dashboard/staff/customers" className="px-6 py-3 rounded-[12px] text-[15px] font-bold text-[#64748b] hover:bg-gray-100 transition-colors">
          Cancel
        </Link>
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-[#10b981] hover:bg-[#059669] text-white font-bold h-[48px] px-8 rounded-[12px] transition-colors shadow-sm disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

    </form>
  )
}
