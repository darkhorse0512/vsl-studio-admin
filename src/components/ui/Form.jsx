import { useId, useState } from 'react'
import { cn } from '../../lib/utils'
import { Eye } from '../Icons'

const CONTROL =
  'w-full rounded-xl border bg-ink-950/60 px-4 text-ink-50 placeholder:text-ink-500 ' +
  'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed'

export function Label({ htmlFor, children, hint, required }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-200">
        {children}
        {required && <span className="ml-1 text-brand-400">*</span>}
      </label>
      {hint && <span className="text-xs text-ink-500">{hint}</span>}
    </div>
  )
}

export function FieldError({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="mt-1.5 text-sm text-red-400">
      {children}
    </p>
  )
}

export function Input({ label, hint, error, required, className, id, ...rest }) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={inputId} hint={hint} required={required}>
          {label}
        </Label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        className={cn(CONTROL, 'h-11', error ? 'border-red-500/70' : 'border-ink-700')}
        {...rest}
      />
      <FieldError>{error}</FieldError>
    </div>
  )
}

export function PasswordInput({ label, hint, error, required, className, id, ...rest }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={inputId} hint={hint} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          className={cn(CONTROL, 'h-11 pr-12', error ? 'border-red-500/70' : 'border-ink-700')}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
        >
          <Eye className="h-4.5 w-4.5" />
        </button>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}

export function Textarea({ label, hint, error, required, className, id, rows = 6, ...rest }) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={inputId} hint={hint} required={required}>
          {label}
        </Label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          CONTROL,
          'py-3 leading-relaxed resize-y',
          error ? 'border-red-500/70' : 'border-ink-700',
        )}
        {...rest}
      />
      <FieldError>{error}</FieldError>
    </div>
  )
}
