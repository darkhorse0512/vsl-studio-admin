import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../lib/supabase'
import Button from './ui/Button'
import { LoadingScreen } from './ui/Feedback'
import { Logo, Shield } from './Icons'

/**
 * Only approved administrators get past this gate.
 *
 * The check is a convenience, not the security boundary: the database's RLS
 * policies and the admin-users edge function both re-verify the caller's
 * role on every request.
 */
export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) return <LoadingScreen label="Verifying your access…" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // A missing profile is as good as no admin rights - never fall through.
  if (!isAdmin) return <NotAuthorized />

  return <Outlet />
}

function NotAuthorized() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md text-center">
        <Logo className="mx-auto h-11 w-11" />

        <div className="card mt-8 p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
            <Shield className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white">Administrator access only</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-400">
            The account <span className="font-medium text-ink-200">{profile?.email ?? user?.email}</span> does not
            have administrator rights on {APP_NAME}.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-500">
            An existing administrator can grant access from the Users page, or you can run{' '}
            <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono">
              select public.promote_to_admin(&apos;{profile?.email ?? user?.email}&apos;);
            </code>{' '}
            in the Supabase SQL editor.
          </p>

          <Button variant="secondary" className="mt-7 w-full" onClick={handleSignOut}>
            Sign in with a different account
          </Button>
        </div>
      </div>
    </div>
  )
}
