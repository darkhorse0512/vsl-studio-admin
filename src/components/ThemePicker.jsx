import { useTheme } from '../context/ThemeContext'
import { cn } from '../lib/utils'
import { Check } from './Icons'

/**
 * Colour + surface picker.
 *
 * `compact` renders the swatch rows for the header dropdown; the default
 * renders the labelled version used on the Account page.
 */
export default function ThemePicker({ compact = false }) {
  const { theme, setTheme, surface, setSurface, themes, surfaces } = useTheme()

  if (compact) {
    return (
      <div className="px-4 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          Accent
        </p>
        <div className="flex flex-wrap gap-1.5">
          {themes.map((item) => (
            <Swatch
              key={item.id}
              colors={item.colors}
              label={item.name}
              selected={theme === item.id}
              onClick={() => setTheme(item.id)}
              size="sm"
            />
          ))}
        </div>

        <p className="mb-2 mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          Surface
        </p>
        <div className="flex flex-wrap gap-1.5">
          {surfaces.map((item) => (
            <Swatch
              key={item.id}
              colors={[item.color, item.color]}
              label={item.name}
              selected={surface === item.id}
              onClick={() => setSurface(item.id)}
              size="sm"
              bordered
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-medium text-ink-200">Accent colour</h3>
          <span className="text-xs text-ink-500">
            {themes.find((item) => item.id === theme)?.name}
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Accent colour"
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {themes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={theme === item.id}
              onClick={() => setTheme(item.id)}
              className={cn(
                'group flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                theme === item.id
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-ink-800 hover:border-ink-600 hover:bg-ink-900',
              )}
            >
              <span
                className="h-7 w-7 shrink-0 rounded-lg shadow-inner"
                style={{
                  background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})`,
                }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-ink-100">{item.name}</span>
              {theme === item.id && <Check className="h-4 w-4 shrink-0 text-brand-400" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-medium text-ink-200">Surface</h3>
          <span className="text-xs text-ink-500">
            {surfaces.find((item) => item.id === surface)?.name}
          </span>
        </div>

        <div role="radiogroup" aria-label="Surface" className="grid grid-cols-3 gap-2.5">
          {surfaces.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={surface === item.id}
              onClick={() => setSurface(item.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                surface === item.id
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-ink-800 hover:border-ink-600 hover:bg-ink-900',
              )}
            >
              <span
                className="h-7 w-7 shrink-0 rounded-lg border border-white/10"
                style={{ background: item.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-ink-100">{item.name}</span>
              {surface === item.id && <Check className="h-4 w-4 shrink-0 text-brand-400" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Swatch({ colors, label, selected, onClick, size = 'md', bordered = false }) {
  const dimension = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        'relative rounded-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900',
        dimension,
        selected && 'ring-2 ring-white ring-offset-2 ring-offset-ink-900',
        bordered && 'border border-white/15',
      )}
      style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
    >
      {selected && (
        <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />
      )}
    </button>
  )
}
