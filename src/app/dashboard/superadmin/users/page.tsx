'use client'

import { Header } from '@/components/layout/header'
import { UserPlus, Mail, Lock, ShieldCheck, ArrowLeft, Loader2, CheckCircle2, User, Key, Shield, Truck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { createSystemUser } from '@/app/dashboard/superadmin/users/actions'

export default function CreateUserPage() {
  const [role, setRole] = useState('staff')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setLoading(true)
    setMessage(null)

    const formData = new FormData(form)
    const result = await createSystemUser(formData)

    if (result.error) {
      setMessage({ text: result.message, error: true })
    } else {
      setMessage({ text: result.message, error: false })
      form.reset()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Identity Management" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="w-full max-w-[800px] mx-auto text-[#0f172a]">
          
          <div className="mb-8">
            <Link href="/dashboard/superadmin" className="flex items-center gap-2 text-[#64748b] hover:text-[#3b82f6] font-bold text-[14px] mb-4 transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h2 className="text-[28px] font-black tracking-tight mb-1">Provision New Account</h2>
            <p className="text-[15px] font-medium text-[#64748b]">Configure and deploy new institutional credentials.</p>
          </div>

          <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {message && (
                <div className={`p-4 rounded-[12px] flex items-center gap-3 text-[14px] font-bold border ${message.error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  {message.error ? <ShieldCheck size={18} /> : <CheckCircle2 size={18} />}
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                       <Mail className="text-[#94a3b8]" size={18} strokeWidth={2.5} />
                    </div>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="e.g. name@alnaciim.com"
                      required
                      className="w-full h-[52px] pl-[44px] pr-4 bg-white border border-[#e2e8f0] rounded-[10px] text-[15px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Access Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                       <Lock className="text-[#94a3b8]" size={18} strokeWidth={2.5} />
                    </div>
                    <input 
                      type="password" 
                      name="password" 
                      placeholder="••••••••"
                      required
                      className="w-full h-[52px] pl-[44px] pr-4 bg-white border border-[#e2e8f0] rounded-[10px] text-[15px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">System Operational Role</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'agent', label: 'Field Agent', icon: Shield },
                    { id: 'staff', label: 'Warehouse Staff', icon: User },
                    { id: 'accountant', label: 'Accountant', icon: Key }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex flex-col items-center justify-center p-6 rounded-[16px] border-2 transition-all active:scale-[0.98] ${role === r.id ? 'border-[#3b82f6] bg-[#eff6ff] text-[#3b82f6]' : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${role === r.id ? 'bg-[#3b82f6] text-white' : 'bg-[#f8fafc]'}`}>
                        <r.icon size={20} strokeWidth={2.5} />
                      </div>
                      <span className="text-[13px] font-black uppercase tracking-tight">{r.label}</span>
                      <input type="radio" name="role" value={r.id} checked={role === r.id} className="hidden" readOnly />
                    </button>
                  ))}
                </div>
              </div>

              {role === 'staff' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#f8fafc] p-6 rounded-[16px] border border-[#e2e8f0]">
                  <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Truck Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                         <Truck className="text-[#94a3b8]" size={18} strokeWidth={2.5} />
                      </div>
                      <input 
                        type="text" 
                        name="truck_plate" 
                        placeholder="e.g. TRK-001"
                        required
                        className="w-full h-[52px] pl-[44px] pr-4 bg-white border border-[#e2e8f0] rounded-[10px] text-[15px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-bold text-[#1e293b] uppercase tracking-wider">Truck Capacity (Liters)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                         <span className="text-[#94a3b8] font-black text-[14px]">L</span>
                      </div>
                      <input 
                        type="number" 
                        name="truck_capacity" 
                        placeholder="e.g. 10000"
                        min="1"
                        required
                        className="w-full h-[52px] pl-[44px] pr-4 bg-white border border-[#e2e8f0] rounded-[10px] text-[15px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-col gap-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-[52px] bg-[#4fa0ff] hover:bg-[#3b82f6] text-white font-bold text-[16px] rounded-[10px] flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} strokeWidth={2.5} />}
                  {loading ? 'Processing Provisioning...' : 'Provision Account Identity'}
                </button>
                
                <p className="text-[13px] font-medium text-[#94a3b8] text-center max-w-[600px] mx-auto leading-relaxed">
                  Upon creation, the user will be instantly eligible for login. Access permissions are strictly enforced by the centralized institutional protocol.
                </p>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
