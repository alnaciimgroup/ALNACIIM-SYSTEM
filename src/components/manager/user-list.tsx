'use client'

import { Mail, ChevronRight, Trash2, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { deleteSystemUser } from '@/app/dashboard/manager/users/actions'

export function UserList({ users }: { users: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete the account for ${name}? This action is irreversible.`)) {
      return
    }

    setDeletingId(id)
    setMessage(null)

    startTransition(async () => {
      const result = await deleteSystemUser(id)
      setMessage({ text: result.message, error: result.error })
      setDeletingId(null)
      if (!result.error) {
        // give it a second then clear message
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  return (
    <div className="bg-white border border-[#e5e7eb] shadow-sm rounded-[20px] p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[18px] font-bold text-[#0f172a] tracking-tight">Active System Registry</h3>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-[12px] text-[13px] font-bold border ${message.error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-[#10b981] border-[#10b981]/10'}`}>
          {message.text}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#f1f5f9]">
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">Account Identity</th>
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider text-center">Protocol Role</th>
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider text-center">Status</th>
              <th className="pb-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-black text-[#3b82f6] text-[14px]">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-[#0f172a] leading-none mb-1">{user.name}</p>
                      <p className="text-[12px] text-[#64748b] font-medium flex items-center gap-1"><Mail size={12}/> {user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-tighter ${
                    user.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-[#f1f5f9] text-[#0f172a]'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <span className={`px-3 py-1 text-[12px] font-bold rounded-full ${user.status === 'Active' ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#fff7ed] text-[#f59e0b]'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {user.role !== 'MANAGER' && (
                      <button 
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={isPending && deletingId === user.id}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all disabled:opacity-50"
                        title="Delete User"
                      >
                        {isPending && deletingId === user.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    )}
                    <button className="text-[#94a3b8] hover:text-[#3b82f6] p-2 rounded-lg transition-all" title="View Details">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-[#94a3b8] text-[14px]">No accounts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
