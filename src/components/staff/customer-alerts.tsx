'use client'

import { AlertCircle, Phone, UserCheck, X, Loader2, MapPin, ShieldAlert, Banknote } from 'lucide-react'
import { useState, useActionState } from 'react'

// Placeholder for the backend action we will create next
import { logCustomerFollowup } from '@/app/dashboard/staff/customers/actions'

export function CustomerAlerts({ inactiveCustomers }: { inactiveCustomers: any[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  
  if (!inactiveCustomers || inactiveCustomers.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-red-100 shadow-sm shadow-red-100/50 rounded-[20px] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
          <AlertCircle size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-[16px] font-black text-[#0f172a] uppercase tracking-tight">Attention Required</h3>
          <p className="text-[13px] font-bold text-red-500">{inactiveCustomers.length} Customers at Risk</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {inactiveCustomers.slice(0, 3).map((customer) => (
          <div key={customer.id} className="bg-red-50/50 border border-red-100 rounded-[12px] p-4 flex flex-col gap-3 group transition-all hover:border-red-200 hover:shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[15px] font-black text-[#0f172a] block">{customer.name}</span>
                  {customer.staff_name && (
                    <span className="text-[10px] font-bold text-[#3b82f6] bg-[#eff6ff] px-2 py-0.5 rounded-full border border-[#bfdbfe]">
                      Agent: {customer.staff_name}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                  {customer.daysInactive} Days Inactive
                </span>
              </div>
              
              <div className="flex gap-2">
                <a 
                  href={`tel:${customer.phone}`}
                  className="w-9 h-9 flex items-center justify-center bg-white text-blue-500 border border-blue-100 rounded-[10px] hover:bg-blue-50 transition-colors shadow-sm"
                  title="Call Customer"
                >
                  <Phone size={16} strokeWidth={2.5} />
                </a>
                <button 
                  className="w-9 h-9 flex items-center justify-center bg-emerald-500 text-white border border-emerald-600 rounded-[10px] hover:bg-emerald-600 transition-colors shadow-sm"
                  title="Log Follow-up"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <UserCheck size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1 border-t border-red-100/50 pt-3">
              {customer.address && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#64748b]">
                  <MapPin size={12} className="text-red-400" />
                  <span className="truncate">{customer.address}</span>
                </div>
              )}
              {customer.guarantor && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#64748b]">
                  <ShieldAlert size={12} className="text-amber-500" />
                  <span className="truncate">{customer.guarantor} ({customer.guarantor_phone})</span>
                </div>
              )}
              {customer.debt > 0 && (
                <div className="col-span-2 flex items-center gap-1.5 text-[12px] font-black text-red-500 mt-1 bg-red-100/50 p-1.5 rounded-md">
                  <Banknote size={14} />
                  <span>OWES: ${customer.debt.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {inactiveCustomers.length > 3 && (
          <div className="text-center pt-2">
            <span className="text-[12px] font-bold text-[#64748b] hover:text-[#0f172a] cursor-pointer transition-colors">
              + {inactiveCustomers.length - 3} more customers in danger
            </span>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <FollowUpModal 
          customer={selectedCustomer} 
          onClose={() => setSelectedCustomer(null)} 
        />
      )}
    </div>
  )
}

function FollowUpModal({ customer, onClose }: { customer: any, onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(logCustomerFollowup, null)

  return (
    <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-center justify-between bg-[#f8fafc]">
          <div>
            <h3 className="text-[16px] font-black text-[#0f172a] uppercase tracking-tight">Log Interaction</h3>
            <p className="text-[13px] font-bold text-[#64748b]">For {customer.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e2e8f0] text-[#64748b] transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        
        <form action={formAction} className="p-6">
          <input type="hidden" name="customer_id" value={customer.id} />
          
          {state?.message && (
            <div className={`p-3 rounded-[12px] text-[13px] font-bold mb-6 border ${state.errors ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {state.message}
            </div>
          )}

          <div className="flex flex-col gap-5 mb-8">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-black uppercase tracking-widest text-[#1e293b]">Interaction Type</label>
              <select name="interaction_type" required className="h-[48px] px-4 rounded-[12px] border border-[#e2e8f0] text-[14px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]">
                <option value="phone_call">Phone Call</option>
                <option value="site_visit">Site Visit</option>
                <option value="whatsapp">WhatsApp / Message</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-black uppercase tracking-widest text-[#1e293b]">Outcome / Notes</label>
              <textarea 
                name="notes" 
                required 
                rows={3}
                placeholder="e.g. They were traveling, will order next week."
                className="p-4 rounded-[12px] border border-[#e2e8f0] text-[14px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 h-[48px] bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#64748b] font-black text-[13px] rounded-[14px] transition-colors uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isPending || (state && !state.errors)}
              className="flex-1 h-[48px] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[13px] rounded-[14px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 uppercase tracking-widest"
            >
              {isPending ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} strokeWidth={2.5} />}
              {isPending ? 'Saving...' : (state && !state.errors ? 'Saved!' : 'Save Log')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
