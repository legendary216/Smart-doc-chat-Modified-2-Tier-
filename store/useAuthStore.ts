import { create } from 'zustand' //to store session and user id
import { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  user: User | null
  isInitialized: boolean
  setSession: (session: Session | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isInitialized: false,
  setSession: (session) => set({ 
    session,
     user: session?.user ?? null,
    isInitialized: true
    }),
}))