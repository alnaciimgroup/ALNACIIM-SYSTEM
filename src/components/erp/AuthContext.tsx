'use client';
import { createContext, useContext, ReactNode } from 'react';

type UserType = { role: string; full_name: string };

const AuthContext = createContext<{ user: UserType | null }>({ user: null });

export function AuthProvider({ user, children }: { user: UserType; children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): { user: UserType } {
  const context = useContext(AuthContext);
  // Fallback to Admin for backwards compatibility if used outside of provider
  if (!context.user) return { user: { role: 'Admin', full_name: 'Super Admin' } };
  return context as { user: UserType };
}
