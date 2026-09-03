import { cn } from '../../lib/utils'
import { Alert as AlertIcon, CheckCircle, Info, Loader } from '../Icons'

const TONES = {
  neutral: 'bg-ink-800 text-ink-200 border-ink-700',
  info: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/10 text-red-300 border-red-500/30',
  brand: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
}

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Dot({ tone = 'neutral' }) {
  const colors = {
    neutral: 'bg-ink-400',
    info: 'bg-sky-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    brand: 'bg-brand-400',
  }
  return <span className={cn('h-1.5 w-1.5 rounded-full', colors[tone] ?? colors.neutral)} />
}

const BANNER_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertIcon,
  danger: AlertIcon,
  brand: Info,
  neutral: Info,
}

export function Banner({ tone = 'info', title, children, action, className }) {
  const IconComponent = BANNER_ICONS[tone] ?? Info

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-4', TONES[tone] ?? TONES.info, className)}
    >
      <IconComponent className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn('text-sm', title && 'mt-1 opacity-90')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}

export function EmptyState({ icon: IconComponent, title, description, action, className }) {
  return (
    <div className={cn('card flex flex-col items-center px-6 py-16 text-center', className)}>
      {IconComponent && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-700 bg-ink-800/70 text-brand-300">
          <IconComponent className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-400">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-ink-800/80', className)} />
}

export function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-400">
      <Loader className="h-7 w-7 text-brand-400" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
