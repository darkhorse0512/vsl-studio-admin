import { Link } from 'react-router-dom'
import { ArrowLeft } from './Icons'

/**
 * Consistent page top: optional back link, eyebrow, title, supporting copy,
 * a meta row and right-aligned actions. Keeps every screen on the same rhythm.
 */
export default function PageHeader({
  back,
  eyebrow,
  title,
  description,
  meta,
  actions,
  badge,
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link
          to={back.to}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {back.label}
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-400">
              {eyebrow}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
            {badge}
          </div>

          {description && (
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-400">
              {description}
            </p>
          )}

          {meta && <div className="mt-3 text-sm text-ink-500">{meta}</div>}
        </div>

        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
