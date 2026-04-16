'use client'

import { ReactNode, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { HeaderClient } from './header-client'
import { logout } from '@/app/login/actions'

export function Header({ title, actions }: { title: string | ReactNode; actions?: ReactNode }) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: (user.user_metadata?.role || 'staff').toUpperCase()
        })
      }
    }
    fetchUser()
  }, [supabase.auth])

  // Provide a skeleton/empty state while loading user for a smooth UX
  const displayUser = user || { name: '...', role: '...' }

  return (
    <HeaderClient 
      title={title} 
      actions={actions}
      user={displayUser} 
      logoutAction={logout}
    />
  )
}
