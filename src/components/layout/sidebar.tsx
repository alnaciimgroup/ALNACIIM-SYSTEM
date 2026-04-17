'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Calculator, Droplet, History, LogOut, BarChart2, Settings, User as UserIcon, Banknote, List, X } from 'lucide-react'

export function Sidebar({ 
  role, 
  onMobileClose, 
  logoutAction 
}: { 
  role: string, 
  onMobileClose?: () => void,
  logoutAction: () => Promise<void>
}) {
  const pathname = usePathname()
  
  const getNavItems = () => {
    switch (role) {
      case 'agent':
        return [
          { name: 'Dashboard', href: '/dashboard/agent', icon: LayoutDashboard },
          { name: 'Tank Distribution', href: '/dashboard/agent/distribution', icon: Droplet },
          { name: 'Staff List', href: '/dashboard/agent/staff', icon: Users },
          { name: 'Distribution History', href: '/dashboard/agent/history', icon: History },
          { name: 'Reports', href: '/dashboard/agent/reports', icon: BarChart2 },
        ]
      case 'superadmin':
        return [
          { name: 'Dashboard', href: '/dashboard/superadmin', icon: LayoutDashboard },
          { name: 'Manage Users', href: '/dashboard/superadmin/users', icon: Users },
          { name: 'System Logs', href: '/dashboard/superadmin/logs', icon: History },
          { name: 'Settings', href: '/dashboard/superadmin/settings', icon: Settings },
        ]
      case 'staff':
        return [
          { name: 'Dashboard', href: '/dashboard/staff', icon: LayoutDashboard },
          { name: 'Customers', href: '/dashboard/staff/customers', icon: Users },
          { name: 'Record Sales', href: '/dashboard/staff/record-sales', icon: Calculator },
          { name: 'My Tanks', href: '/dashboard/staff/tanks', icon: Droplet },
          { name: 'Daily Report', href: '/dashboard/staff/daily-report', icon: BarChart2 },
          { name: 'Sales History', href: '/dashboard/staff/history', icon: History },
        ]
      case 'accountant':
        return [
          { name: 'Dashboard', href: '/dashboard/accountant', icon: LayoutDashboard },
          { name: 'Customers', href: '/dashboard/accountant/customers', icon: Users },
          { name: 'Staff Reports', href: '/dashboard/accountant/staff-reports', icon: Users },
          { name: 'Financial Overview', href: '/dashboard/accountant/financials', icon: Calculator },
          { name: 'Transactions', href: '/dashboard/accountant/transactions', icon: History },
          { name: 'Staff List', href: '/dashboard/accountant/staff', icon: List },
          { name: 'Reports', href: '/dashboard/accountant/reports', icon: BarChart2 },
        ]
      default:
        return [
          { name: 'Dashboard', href: '/dashboard/staff', icon: LayoutDashboard },
        ]
    }
  }

  const items = getNavItems()

  return (
    <aside className="w-[260px] h-full bg-white border-r border-[#e5e7eb] flex flex-col shrink-0 text-[#0f172a]">
      <div className="h-[90px] flex items-center justify-between px-6">
        <div className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center text-white shrink-0 shadow-sm border-[2px] border-[#bfdbfe]">
            <Droplet fill="currentColor" size={18} className="text-white" />
          </div>
          <div className="flex flex-col mt-1">
            <span className="font-extrabold text-[16px] text-[#0f172a] tracking-tight leading-none mb-1">ALNACIIM</span>
            <span className="text-[9px] text-[#94a3b8] font-bold tracking-[0.05em] uppercase leading-none">Water Distribution</span>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        {onMobileClose && (
          <button 
            onClick={onMobileClose}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      <nav className="flex-1 overflow-y-auto pt-4 pb-4 flex flex-col gap-1 px-4">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href 

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={`flex items-center gap-3.5 px-4 py-[11px] rounded-[8px] transition-all duration-200 ${isActive ? 'bg-[#eff6ff] text-[#3b82f6] font-bold border-l-[3px] border-[#3b82f6] ml-[2px]' : 'text-[#64748b] hover:bg-gray-50 hover:text-[#0f172a] font-medium border-l-[3px] border-transparent ml-[2px]'}`}
            >
              <Icon size={18} className={isActive ? 'text-[#3b82f6]' : 'text-[#94a3b8]'} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[13.5px]">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="pl-6 pr-4 pt-4 mb-8">
        <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-3 block">System</span>
        <div className="flex flex-col gap-1">
          <Link href="/dashboard/profile" className="flex items-center gap-3.5 px-3 py-2.5 rounded-[12px] text-[#64748b] hover:bg-gray-50 hover:text-[#0f172a] font-medium transition-colors">
            <UserIcon size={18} className="text-[#94a3b8]" />
            <span className="text-[14px]">Profile</span>
          </Link>
          <button 
            onClick={async () => {
              await logoutAction()
            }}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[12px] text-[#64748b] hover:bg-gray-50 hover:text-[#0f172a] font-medium transition-colors text-left"
          >
            <LogOut size={18} className="text-[#94a3b8]" />
            <span className="text-[14px]">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
