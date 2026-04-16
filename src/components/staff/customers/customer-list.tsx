'use client'

import { Search, Filter, Plus, Pencil, Power, User, Banknote, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition, useActionState, useEffect } from 'react'
import { toggleCustomerStatus, recordDebtPayment } from '@/app/dashboard/staff/customers/actions'

type Customer = {
  id: string
  name: string
  phone: string
  address: string | null
  guarantor: string | null
  status: string
  debt: number
  created_at: string
}

export function CustomerList({ initialCustomers }: { initialCustomers: Customer[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  const [paymentState, paymentAction, isPaymentPending] = useActionState(recordDebtPayment, null)

  // Close modal on success
  useEffect(() => {
    if (paymentState && !paymentState.error) {
      setSelectedCustomer(null)
    }
  }, [paymentState])

  const handleToggle = (id: string, currentStatus: string) => {
    startTransition(async () => {
      await toggleCustomerStatus(id, currentStatus)
    })
  }

  // Client-side filtering for immediate snappy UI
  const filteredCustomers = initialCustomers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          (c.phone && c.phone.includes(search))
    
    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = c.status === 'active'
    if (statusFilter === 'inactive') matchesStatus = c.status === 'inactive'
    if (statusFilter === 'debt') matchesStatus = c.debt > 0
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#f8fafc] border border-[#e2e8f0] text-[#94a3b8] w-full max-w-[320px] focus-within:ring-2 focus-within:ring-[#3b82f6]/20 transition-all">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search customers by name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] w-full text-[#0f172a] placeholder-[#94a3b8] font-medium"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] text-[13px] font-bold rounded-[12px] hover:bg-[#f1f5f9] transition-colors outline-none cursor-pointer appearance-none pr-8 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat' }}
          >
            <option value="all">Filter: All Records</option>
            <option value="debt">With Unpaid Debt</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-[#f1f5f9]">
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Customer Name</th>
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Phone</th>
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Zone / Address</th>
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Guarantor</th>
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Unpaid Debt</th>
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Status</th>
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-[#94a3b8]">
                    <User size={32} className="mb-3 opacity-50" />
                    <span className="text-[14px] font-bold text-[#0f172a] mb-1">No customers found</span>
                    <span className="text-[13px]">Try adjusting your search or add a new customer.</span>
                  </div>
                </td>
              </tr>
            ) : null}

            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="hover:bg-[#f8fafc]/50 transition-colors group">
                <td className="py-4">
                  <span className="font-bold text-[#0f172a] text-[15px] block">{customer.name}</span>
                  <span className="text-[11px] font-medium text-[#94a3b8]">Created {new Date(customer.created_at).toLocaleDateString()}</span>
                </td>
                <td className="py-4 text-[14px] text-[#0f172a] font-medium">{customer.phone}</td>
                <td className="py-4 text-[13px] text-[#64748b]">{customer.address || '-'}</td>
                <td className="py-4 text-[13px] text-[#64748b] font-medium">{customer.guarantor || '-'}</td>
                <td className="py-4 text-[14px] font-black text-[#ef4444]">${customer.debt || 0}</td>
                <td className="py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border ${
                    customer.status === 'active' 
                      ? 'bg-[#ecfdf5] text-[#10b981] border-[#10b981]/20' 
                      : 'bg-[#f1f5f9] text-[#94a3b8] border-[#94a3b8]/20'
                  }`}>
                    {customer.status}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {customer.debt > 0 && (
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 text-[#94a3b8] hover:text-[#10b981] hover:bg-[#ecfdf5] rounded-lg transition-colors"
                        title="Record Payment"
                      >
                        <Banknote size={18} strokeWidth={2.5} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleToggle(customer.id, customer.status)}
                      disabled={isPending}
                      className="p-2 text-[#94a3b8] hover:text-[#f59e0b] hover:bg-[#fffbeb] rounded-lg transition-colors"
                      title={customer.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                    >
                      <Power size={18} strokeWidth={2.5} />
                    </button>
                    <Link 
                      href={`/dashboard/staff/customers/${customer.id}/edit`}
                      className="p-2 text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#eff6ff] rounded-lg transition-colors"
                      title="Edit Customer"
                    >
                      <Pencil size={18} strokeWidth={2.5} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-black text-[#0f172a] uppercase tracking-tight">Record Debt Payment</h3>
                <p className="text-[13px] font-bold text-[#64748b]">For {selectedCustomer.name}</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] text-[#94a3b8] transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            <form action={paymentAction} className="p-6">
              <input type="hidden" name="customer_id" value={selectedCustomer.id} />
              
              <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[16px] p-4 mb-6 flex items-center justify-between">
                <span className="text-[12px] font-black text-[#ef4444] uppercase tracking-widest">Outstanding Debt</span>
                <span className="text-[20px] font-black text-[#ef4444] leading-none">${selectedCustomer.debt.toFixed(2)}</span>
              </div>

              {paymentState?.message && (
                <div className={`p-3 rounded-[12px] text-[13px] font-bold mb-6 border ${paymentState.error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  {paymentState.message}
                </div>
              )}

              <div className="flex flex-col gap-3 mb-8">
                <label htmlFor="amount" className="text-[12px] font-black uppercase tracking-widest text-[#1e293b]">Payment Amount ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#94a3b8]">
                    <Banknote size={20} strokeWidth={2.5} />
                  </div>
                  <input 
                    type="number" 
                    id="amount" 
                    name="amount" 
                    step="0.01"
                    min="0.01"
                    max={selectedCustomer.debt}
                    defaultValue={selectedCustomer.debt}
                    required
                    className="w-full h-[54px] pl-[56px] pr-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] text-[18px] font-black text-[#0f172a] focus:outline-none focus:ring-4 focus:ring-[#3b82f6]/10 focus:border-[#3b82f6] transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 h-[54px] bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#64748b] font-black text-[14px] rounded-[16px] transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isPaymentPending}
                  className="flex-1 h-[54px] bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-[14px] rounded-[16px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest"
                >
                  {isPaymentPending ? <Loader2 className="animate-spin" size={18} /> : <Banknote size={18} strokeWidth={2.5} />}
                  {isPaymentPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
