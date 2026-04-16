'use client'

import { Bell, Search, HelpCircle, Menu, User as UserIcon, LogOut, ChevronDown } from 'lucide-react'
import { ReactNode, useState } from 'react'

type UserInfo = {
  name: string
  role: string
}

export function HeaderClient({ 
  title, 
  actions,
  user,
  logoutAction
}: { 
  title: string | ReactNode, 
  actions?: ReactNode,
  user: UserInfo,
  logoutAction: () => Promise<void>
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <header className="h-[80px] flex-shrink-0 bg-[#f8fafc] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 w-full pt-4">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => {
            // We use a custom event to communicate with DashboardContainer
            window.dispatchEvent(new CustomEvent('toggle-sidebar'))
          }}
          className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>
        
        <h1 className={`text-[18px] lg:text-[20px] font-bold text-[#0f172a] tracking-tight truncate ${actions ? 'max-w-[120px] sm:max-w-[200px]' : 'max-w-[200px]'} lg:max-w-none`}>
          {title}
        </h1>

        {/* Global Actions Slot (e.g. Filters) */}
        {actions && (
          <div className="flex items-center ml-2 border-l border-[#e2e8f0] pl-3 lg:pl-6 py-1 shrink-0">
            {actions}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        {/* Responsive Search - Hidden on Small Screens or when Actions are provided */}
        {!actions && (
          <div className="hidden md:flex items-center px-4 py-2 rounded-[8px] bg-white border border-[#e2e8f0] text-[#94a3b8] w-[200px] lg:w-[280px] focus-within:ring-2 focus-within:ring-[#3b82f6]/20 transition-all shadow-sm">
            <Search size={14} className="text-[#94a3b8] shrink-0 mr-2.5" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-[13px] w-full text-[#0f172a] placeholder-[#94a3b8] font-medium appearance-none m-0 p-0"
            />
          </div>
        )}

        <div className="flex items-center gap-2 lg:gap-4 ml-auto">
          {/* Notifications */}
          <button className="relative hover:bg-white/80 p-2 rounded-full transition-colors border border-transparent hover:border-gray-200">
            <Bell size={20} className="text-[#64748b]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444] border-[1.5px] border-white"></span>
          </button>

          {/* User Profile Section */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-white border border-transparent hover:border-gray-200 transition-all group"
            >
              <div className="flex flex-col items-end mr-1 hidden sm:flex">
                <span className="text-[13px] font-bold text-[#0f172a] leading-none mb-0.5">{user.name}</span>
                <span className="text-[10px] font-black text-[#3b82f6] uppercase tracking-wider leading-none opacity-80">{user.role}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center text-[#3b82f6] group-hover:bg-[#eff6ff] transition-colors overflow-hidden">
                <UserIcon size={20} strokeWidth={2.5} />
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-50 mb-1 lg:hidden">
                  <p className="text-[14px] font-bold text-gray-900">{user.name}</p>
                  <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest leading-none mt-1">{user.role}</p>
                </div>
                <button 
                  onClick={() => window.location.href = '/dashboard/profile'}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserIcon size={18} className="text-gray-400" />
                  My Profile
                </button>
                <button 
                  onClick={() => { /* Help logic */ }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <HelpCircle size={18} className="text-gray-400" />
                  System Help
                </button>
                <div className="h-px bg-gray-50 my-2 mx-2"></div>
                <button 
                  onClick={async () => {
                    await logoutAction()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
