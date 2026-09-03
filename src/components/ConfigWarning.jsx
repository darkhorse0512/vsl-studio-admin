import { isSupabaseConfigured } from '../lib/supabase'
import { Alert } from './Icons'

/**
 * Loud, unmissable banner when the environment variables are missing.
 * Without them every request fails with an opaque network error.
 */
export default function ConfigWarning() {
  if (isSupabaseConfigured) return null

  return (
    <div className="sticky top-0 z-[70] flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-center text-sm font-medium text-white">
      <Alert className="h-4 w-4 shrink-0" />
      <span>
        Supabase is not configured. Copy <code className="font-mono">.env.example</code> to{' '}
        <code className="font-mono">.env</code> and set VITE_SUPABASE_URL and
        VITE_SUPABASE_ANON_KEY.
      </span>
    </div>
  )
}
