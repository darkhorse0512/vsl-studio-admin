import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../lib/supabase'
import Button from '../components/ui/Button'
import { Input, PasswordInput } from '../components/ui/Form'
import { Banner, LoadingScreen } from '../components/ui/Feedback'
import { Logo, Shield } from '../components/Icons'

export default function Login() {
  const { signIn, isAuthenticated, loading, requestPasswordReset } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  if (loading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/" replace />

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.email.trim() || !form.password) {
      setError('Enter your email address and password.')
      return
    }

    setSubmitting(true)
    try {
      await signIn(form)
      navigate('/', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!form.email.trim()) {
      setError('Enter your email address first, then request a reset link.')
      return
    }

    try {
      await requestPasswordReset(form.email)
      setResetSent(true)
      setError('')
    } catch (resetError) {
      setError(resetError.message)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[700px] -translate-x-1/2 rounded-full bg-brand-600/15 blur-[120px]" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-12 w-12" />
          <h1 className="mt-4 text-2xl font-bold text-white">{APP_NAME}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-brand-400">
            <Shield className="h-4 w-4" />
            Restricted area
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="card space-y-5 p-7">
          {error && <Banner tone="danger">{error}</Banner>}
          {resetSent && (
            <Banner tone="success">
              If that address belongs to an account, a reset link is on its way.
            </Banner>
          )}

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="admin@company.com"
            value={form.email}
            onChange={update('email')}
            required
          />

          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={update('password')}
            required
          />

          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Sign in
          </Button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full text-center text-sm link-muted"
          >
            Forgot your password?
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-600">
          Administrator accounts are granted by an existing administrator, or from the Supabase SQL
          editor with{' '}
          <code className="font-mono">select public.promote_to_admin(&apos;email&apos;);</code>
        </p>
      </div>
    </div>
  )
}
