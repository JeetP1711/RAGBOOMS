import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'

interface AuthState {
  session: Session | null
  /** null while the admin check is still running. */
  isAdmin: boolean | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
const Ctx = createContext<AuthState | null>(null)
export const useAuth = () => useContext(Ctx)!

/**
 * Supabase Auth session + an authorisation check. Being signed in is not
 * enough: the user must also be listed in the admin_users table. The database
 * enforces the same rule through RLS, so this check only drives the UI.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return setLoading(false)
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!supabase || !userId) return setIsAdmin(userId ? null : false)
    let alive = true
    setIsAdmin(null)
    void supabase.rpc('is_admin').then(({ data, error }) => alive && setIsAdmin(!error && data === true))
    return () => {
      alive = false
    }
  }, [userId])

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }
  const signOut = async () => {
    await supabase?.auth.signOut()
  }

  return <Ctx.Provider value={{ session, isAdmin, loading, signIn, signOut }}>{children}</Ctx.Provider>
}
