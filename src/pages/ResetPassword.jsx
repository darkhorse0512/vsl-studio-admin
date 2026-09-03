import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../lib/supabase'
import Button from '../components/ui/Button'
import { PasswordInput } from '../components/ui/Form'
import { Banner, LoadingScreen } from '../components/ui/Feedback'
import { Logo } from '../components/Icons'

const MIN_PASSWORD_LENGTH = 8

export default function ResetPassword() {
  const { updatePassword, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const next = {}
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (confirmPassword !== password) {
      next.confirmPassword = 'The two passwords do not match.'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/', { replace: true }), 1800)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen label="Verifying your reset link…" />

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-12 w-12" />
          <h1 className="mt-4 text-2xl font-bold text-white">{APP_NAME}</h1>
        </div>

        <div className="card p-7">
          {!isAuthenticated ? (
            <Banner tone="warning" title="This link is no longer valid">
              Reset links expire after one hour and can only be used once. Request a new one from
              the sign-in page.
            </Banner>
          ) : done ? (
            <Banner tone="success" title="Password updated">
              Taking you to the dashboard…
            </Banner>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {formError && <Banner tone="danger">{formError}</Banner>}

              <PasswordInput
                label="New password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={errors.password}
              />

              <PasswordInput
                label="Confirm new password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={errors.confirmPassword}
              />

              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                Update password
              </Button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Button to="/login" variant="ghost" size="sm">
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
