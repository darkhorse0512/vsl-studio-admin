import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
// Supabase's new-style publishable key (sb_publishable_...) or the legacy
// anon JWT - either works, both are public and protected by RLS.
const anonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.error(
    'Supabase is not configured. Copy .env.example to .env and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
  )
}

export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'missing-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // Distinct from the user app so the two never share a session.
      storageKey: 'vsl-studio.admin.auth',
    },
    global: {
      headers: { 'x-application-name': 'vsl-studio-admin' },
    },
  },
)

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'VSL Studio Admin'
export const USER_APP_URL = import.meta.env.VITE_USER_APP_URL || ''
