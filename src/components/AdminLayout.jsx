import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, APP_NAME, USER_APP_URL } from '../lib/supabase'
import { cn, initials } from '../lib/utils'
import ThemePicker from './ThemePicker'
import Button from './ui/Button'
import {
  Clock,
  ExternalLink,
  Grid,
  Layers,
  Logo,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  User,
  X,
} from './Icons'

const NAV = [
  { to: '/', label: 'Overview', icon: Grid, end: true },
  { to: '/users', label: 'Users', icon: User, badge: 'pending' },
  { to: '/projects', label: 'Projects', icon: Layers },
  { to: '/prompts', label: 'Prompts', icon: Sparkles },
  { to: '/audit', label: 'Audit log', icon: Clock },
]

const PENDING_POLL_MS = 60_000

export default function AdminLayout() {
  const { profile, user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setMenuOpen(false), [location.pathname])

  const loadPending = useCallback(async () => {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (!error) setPendingCount(count ?? 0)
  }, [])

  useEffect(() => {
    loadPending()
    const timer = setInterval(loadPending, PENDING_POLL_MS)
    return () => clearInterval(timer)
  }, [loadPending, location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Mobile bar --------------------------------------------------- */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-ink-800 bg-ink-950/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          className="rounded-lg p-2 text-ink-300 hover:bg-ink-800 hover:text-white"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-semibold text-white">Admin</span>
        </Link>
        {pendingCount > 0 && (
          <span className="ml-auto rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
            {pendingCount} pending
          </span>
        )}
      </header>

      {/* Sidebar ------------------------------------------------------ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-ink-800 bg-ink-900/95 backdrop-blur transition-transform duration-300 lg:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <div>
              <p className="text-sm font-semibold leading-tight text-white">{APP_NAME}</p>
              <p className="flex items-center gap-1 text-xs text-brand-400">
                <Shield className="h-3 w-3" />
                Administrator
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-ink-400 hover:bg-ink-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-500/15 text-white'
                    : 'text-ink-300 hover:bg-ink-800 hover:text-white',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.badge === 'pending' && pendingCount > 0 && (
                <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-ink-800 p-3">
          {USER_APP_URL && (
            <a
              href={USER_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-400 transition-colors hover:bg-ink-800 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Open user app
            </a>
          )}

          <details className="rounded-xl border border-ink-800">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm text-ink-400 transition-colors hover:text-white">
              Appearance
            </summary>
            <ThemePicker compact />
          </details>

          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
              {initials(profile?.full_name || user?.email || '')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {profile?.full_name || 'Administrator'}
              </p>
              <p className="truncate text-xs text-ink-500">{user?.email}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
          <Outlet context={{ refreshPending: loadPending }} />
        </div>
      </main>
    </div>
  )
}
