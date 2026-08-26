'use client';
import { createContext, useContext } from 'react';

const AuthContext = createContext({ user: { role: 'Admin', full_name: 'Super Admin' } });

export function useAuth() {
  return useContext(AuthContext);
}
