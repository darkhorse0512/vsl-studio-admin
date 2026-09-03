import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import { fetchProfile } from '../lib/api'

const AuthContext = createContext(null)

/**
 * Admin session provider.
 *
 * There is no sign-up here on purpose: administrators are promoted from
 * existing accounts, either from the SQL editor (`select
 * public.promote_to_admin('email')`) or by another admin in this panel.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        setSession(data.session ?? null)
        setAuthReady(true)
      })
      .catch(() => active && setAuthReady(true))

    // Never await Supabase calls inside this callback - it runs on the auth
    // lock. Profile loading happens in the effect below.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession ?? null)
        setAuthReady(true)
      },
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (!authReady) return

    if (!userId) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    let active = true
    setProfileLoading(true)

    fetchProfile(userId)
      .then((data) => active && setProfile(data))
      .catch((error) => {
        if (active) console.error('Failed to load profile:', error)
      })
      .finally(() => active && setProfileLoading(false))

    return () => {
      active = false
    }
  }, [userId, authReady, reloadKey])

  const refreshProfile = useCallback(() => setReloadKey((key) => key + 1), [])

  const signIn = useCallback(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw new Error(friendlyAuthError(error.message))
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }, [])

  const requestPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` },
    )
    if (error) throw new Error(friendlyAuthError(error.message))
  }, [])

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(friendlyAuthError(error.message))
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAuthenticated: Boolean(session),
      isAdmin: profile?.role === 'admin' && profile?.status === 'approved',
      loading: !authReady || (Boolean(userId) && profileLoading && !profile),
      refreshProfile,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
    }),
    [
      session,
      profile,
      authReady,
      userId,
      profileLoading,
      refreshProfile,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

function friendlyAuthError(message = '') {
  const lowered = message.toLowerCase()

  if (lowered.includes('invalid login credentials')) {
    return 'That email and password combination is not correct.'
  }
  if (lowered.includes('email not confirmed')) {
    return 'This email address has not been confirmed yet.'
  }
  if (lowered.includes('rate limit') || lowered.includes('too many requests')) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  if (lowered.includes('failed to fetch') || lowered.includes('network')) {
    return 'Could not reach the server. Check your connection and try again.'
  }

  return message || 'Something went wrong. Please try again.'
}
