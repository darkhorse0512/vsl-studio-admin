import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Loader } from '../Icons'

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-900/40 hover:from-brand-500 hover:to-accent-500 focus-visible:ring-brand-400',
  secondary:
    'bg-ink-800 text-ink-100 border border-ink-700 hover:bg-ink-700 hover:text-white focus-visible:ring-ink-400',
  outline:
    'border border-ink-700 text-ink-200 hover:border-brand-500 hover:text-white focus-visible:ring-brand-400',
  ghost: 'text-ink-300 hover:bg-ink-800 hover:text-white focus-visible:ring-ink-500',
  danger:
    'bg-red-600/90 text-white hover:bg-red-500 focus-visible:ring-red-400',
  white: 'bg-white text-ink-950 hover:bg-ink-100 focus-visible:ring-white',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
  icon: 'h-9 w-9 justify-center',
}

const BASE =
  'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ' +
  'disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.985] whitespace-nowrap'

export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...rest
}) {
  const classes = cn(BASE, VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? SIZES.md, className)
  const content = (
    <>
      {loading && <Loader className="h-4 w-4" />}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    )
  }

  const Component = as ?? 'button'

  return (
    <Component
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {content}
    </Component>
  )
}
