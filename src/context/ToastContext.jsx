import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Alert, CheckCircle, Info, X } from '../components/Icons'
import { cn } from '../lib/utils'

const ToastContext = createContext(null)

const TONES = {
  success: { icon: CheckCircle, ring: 'border-emerald-500/40', accent: 'text-emerald-400' },
  error: { icon: Alert, ring: 'border-red-500/40', accent: 'text-red-400' },
  info: { icon: Info, ring: 'border-brand-500/40', accent: 'text-brand-400' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message, tone = 'info', duration = 5000) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current.slice(-3), { id, message, tone }])
      if (duration) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toast: push,
      success: (message, duration) => push(message, 'success', duration),
      error: (message, duration) => push(message, 'error', duration ?? 8000),
      info: (message, duration) => push(message, 'info', duration),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] ?? TONES.info
          const IconComponent = tone.icon

          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-ink-900/95 p-4 shadow-xl backdrop-blur animate-fade-up',
                tone.ring,
              )}
            >
              <IconComponent className={cn('mt-0.5 h-5 w-5 shrink-0', tone.accent)} />
              <p className="min-w-0 flex-1 text-sm leading-snug text-ink-100">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
