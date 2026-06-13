'use client'

import { useState } from 'react'
import { X, Truck, Tag, Banknote, Clock, ShieldAlert, Calendar, User, DollarSign, Droplet, ShoppingBag } from 'lucide-react'

export interface RecentActivityItem {
  id?: string
  type: 'distribution' | 'sale' | 'submission'
  amount: number
  discount?: number
  date: string
  label: string
  isVerified: boolean
  customerName?: string
  staffName?: string
  agentName?: string
  saleType?: 'cash' | 'credit' | 'free'
  status?: string
  items?: {
    name: string
    quantity: number
    freeQuantity: number
    unitPrice: number
  }[]
}

interface RecentActivityListProps {
  initialActivity: RecentActivityItem[]
}

export function RecentActivityList({ initialActivity }: RecentActivityListProps) {
  const [selectedItem, setSelectedItem] = useState<RecentActivityItem | null>(null)

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date Unknown'
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <div className="divide-y divide-[#f8fafc]">
        {initialActivity.map((act, i) => (
          <button
            key={i}
            onClick={() => setSelectedItem(act)}
            className="w-full text-left p-5 flex items-center justify-between hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
                act.type === 'distribution' ? 'bg-[#eff6ff] text-[#3b82f6]' :
                act.type === 'sale' ? 'bg-[#ecfdf5] text-[#10b981]' :
                'bg-[#fefce8] text-[#ca8a04]'
              }`}>
                {act.type === 'distribution' ? <Truck size={18} /> : 
                 act.type === 'sale' ? <Tag size={18} /> : <Banknote size={18} />}
              </div>
              <div className="flex flex-col items-start gap-1">
                 <div className="flex items-center gap-2">
                   <span className="text-[13px] font-black text-[#0f172a] uppercase tracking-tight group-hover:text-[#3b82f6] transition-colors">{act.label}</span>
                   {act.discount && act.discount > 0 ? (
                     <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest uppercase">Discount (-${act.discount.toFixed(2)})</span>
                   ) : null}
                 </div>
                 <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#94a3b8]">
                      {formatDate(act.date)}
                    </span>
                    {act.isVerified ? (
                      <div className="flex items-center gap-1 text-[9px] font-black text-[#10b981] uppercase tracking-widest bg-emerald-50 px-1 rounded">
                         <ShieldAlert size={8} /> Verified
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-1 rounded">
                         <Clock size={8} /> Unaudited
                      </div>
                    )}
                 </div>
              </div>
            </div>
            <div className={`text-[15px] font-black ${ act.isVerified ? 'text-[#0f172a]' : 'text-[#94a3b8]' }`}>
              {act.type === 'distribution' ? `${act.amount} Units` : `$${act.amount.toLocaleString()}`}
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal Overlay */}
      {selectedItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedItem(null)} 
          />
          
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Header */}
            <div className="px-6 pt-6 pb-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-[15px] flex items-center justify-center text-white ${
                  selectedItem.type === 'distribution' ? 'bg-[#3b82f6]' :
                  selectedItem.type === 'sale' ? 'bg-[#10b981]' :
                  'bg-[#ca8a04]'
                }`}>
                  {selectedItem.type === 'distribution' ? <Truck size={20} /> : 
                   selectedItem.type === 'sale' ? <Tag size={20} /> : <Banknote size={20} />}
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-[#0f172a] leading-tight uppercase tracking-tight">
                    {selectedItem.type === 'sale' ? `Sale (${selectedItem.saleType})` : selectedItem.label}
                  </h3>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                    {selectedItem.isVerified ? (
                      <span className="text-[#10b981]">Verified / Audited</span>
                    ) : (
                      <span className="text-orange-500">Pending Review</span>
                    )}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)} 
                className="p-2 text-[#94a3b8] hover:bg-[#eff6ff] hover:text-[#3b82f6] rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Common Metadata Section */}
              <div className="bg-[#f8fafc] p-4 rounded-[20px] border border-[#e2e8f0] grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-wider block">Timestamp</label>
                  <span className="text-[12px] font-bold text-[#3f4e65] mt-1 flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#64748b]" />
                    {formatDate(selectedItem.date)}
                  </span>
                </div>
                <div>
                  <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-wider block">Staff member</label>
                  <span className="text-[12px] font-bold text-[#3f4e65] mt-1 flex items-center gap-1.5">
                    <User size={13} className="text-[#64748b]" />
                    {selectedItem.staffName || 'N/A'}
                  </span>
                </div>
              </div>

              {/* SALE TYPE Details */}
              {selectedItem.type === 'sale' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-wider block">Customer Name</label>
                      <span className="text-[13px] font-black text-[#0f172a] mt-1 block">
                        {selectedItem.customerName || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-wider block">Sale Type</label>
                      <span className="text-[13px] font-black text-[#0f172a] mt-1 block uppercase">
                        {selectedItem.saleType}
                      </span>
                    </div>
                  </div>

                  {/* Items sold table */}
                  <div>
                    <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-wider block mb-2">Items Sold</label>
                    <div className="border border-[#e2e8f0] rounded-2xl overflow-hidden divide-y divide-[#e2e8f0]">
                      {selectedItem.items && selectedItem.items.length > 0 ? (
                        selectedItem.items.map((item, idx) => {
                          const grossTotal = selectedItem.amount + (selectedItem.discount || 0)
                          const displayUnitPrice = item.quantity > 0 ? grossTotal / item.quantity : item.unitPrice
                          const formatUnitPrice = (price: number) => {
                            if (price === 0) return '$0.00'
                            return price % 0.01 === 0 ? `$${price.toFixed(2)}` : `$${price.toFixed(4)}`
                          }

                          return (
                            <div key={idx} className="p-3 bg-white flex items-center justify-between text-[13px]">
                              <div>
                                <p className="font-black text-[#0f172a]">{item.name}</p>
                                <p className="text-[10px] font-bold text-[#64748b] mt-0.5">
                                  {item.quantity} units {item.freeQuantity > 0 ? `+ ${item.freeQuantity} Free` : ''}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-[#0f172a]">
                                  {formatCurrency(grossTotal)}
                                </p>
                                <p className="text-[10px] font-bold text-[#94a3b8] mt-0.5">
                                  {formatUnitPrice(displayUnitPrice)} each
                                </p>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="p-4 text-center text-[12px] text-[#94a3b8] font-bold">
                          No items registered for this sale.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-[#eff6ff] p-4 rounded-[20px] border border-[#bfdbfe]/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-[#3b82f6] uppercase tracking-wider">Total Amount</span>
                      <p className="text-[24px] font-black text-[#1e3a8a] mt-0.5 leading-none">
                        {formatCurrency(selectedItem.amount)}
                      </p>
                    </div>
                    {selectedItem.discount && selectedItem.discount > 0 ? (
                      <div className="text-right">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Discount applied</span>
                        <p className="text-[14px] font-bold text-red-600 mt-0.5">
                          -${selectedItem.discount.toFixed(2)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* SUBMISSION TYPE Details */}
              {selectedItem.type === 'submission' && (
                <div className="space-y-4">
                  <div className="bg-[#fefce8] p-4 rounded-[20px] border border-[#fef08a] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-[#ca8a04] uppercase tracking-wider block">Submitted Cash</span>
                      <p className="text-[28px] font-black text-[#854d0e] mt-0.5 leading-none">
                        {formatCurrency(selectedItem.amount)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-black text-[#854d0e]/60 uppercase tracking-widest">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        selectedItem.status === 'verified'
                          ? 'bg-[#ecfdf5] text-[#10b981] border-[#d1fae5]'
                          : 'bg-[#fff7ed] text-[#f59e0b] border-[#fed7aa]'
                      }`}>
                        {selectedItem.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* DISTRIBUTION TYPE Details */}
              {selectedItem.type === 'distribution' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-wider block">Agent (Source)</label>
                      <span className="text-[13px] font-black text-[#0f172a] mt-1 block">
                        {selectedItem.agentName || 'System'}
                      </span>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-wider block">Status</label>
                      <span className="text-[13px] font-black text-[#0f172a] mt-1 block uppercase">
                        {selectedItem.status || 'Completed'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#eff6ff] p-4 rounded-[20px] border border-[#bfdbfe]/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-[#3b82f6] uppercase tracking-wider block">Liters Distributed</span>
                      <p className="text-[28px] font-black text-[#1e3a8a] mt-0.5 leading-none flex items-baseline gap-2">
                        {selectedItem.amount.toLocaleString()}
                        <span className="text-[14px] font-bold uppercase tracking-widest text-[#3b82f6]">Liters</span>
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#3b82f6]">
                      <Droplet size={24} />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-6 py-3 bg-[#0f172a] text-white hover:bg-[#3b82f6] text-[12px] font-black rounded-[14px] transition-all uppercase tracking-widest active:scale-95 shadow-md hover:shadow-lg shadow-gray-900/10"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
