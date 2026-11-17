import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** False until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set (see .env.example). */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR-PROJECT'))

export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url!, anonKey!) : null

/** Use inside admin code, which is only reachable when Supabase is configured. */
export const db = (): SupabaseClient => {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin).replace(/\/$/, '')
