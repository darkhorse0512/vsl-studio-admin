import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { Check, ChevronDown } from '../Icons'
import { FieldError, Label } from './Form'

/**
 * Accessible listbox select.
 *
 * The native <select> renders an OS dropdown we cannot style: the arrow sits
 * hard against the edge and the option list ignores the app's palette. This
 * replaces it with a real listbox - full keyboard support, type-ahead, and a
 * popover that matches the rest of the interface.
 */
export default function Select({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabled = false,
  className,
  id,
  align = 'left',
}) {
  const generatedId = useId()
  const buttonId = id ?? generatedId
  const listboxId = `${buttonId}-listbox`

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const buttonRef = useRef(null)
  const typeahead = useRef({ term: '', timer: null })

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  )
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  const close = useCallback((focusButton = true) => {
    setOpen(false)
    setActiveIndex(-1)
    if (focusButton) buttonRef.current?.focus()
  }, [])

  const commit = useCallback(
    (index) => {
      const option = options[index]
      if (!option || option.disabled) return
      onChange?.(option.value)
      close()
    },
    [options, onChange, close],
  )

  /* Open with the current value highlighted. */
  const openList = useCallback(
    (startIndex) => {
      if (disabled) return
      setOpen(true)
      setActiveIndex(startIndex ?? (selectedIndex >= 0 ? selectedIndex : 0))
    },
    [disabled, selectedIndex],
  )

  /* Outside click ------------------------------------------------- */
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  /* Keep the highlighted option in view --------------------------- */
  useEffect(() => {
    if (!open || activeIndex < 0) return
    const node = listRef.current?.children?.[activeIndex]
    node?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const move = (delta) => {
    if (!options.length) return
    setActiveIndex((current) => {
      const from = current < 0 ? (selectedIndex >= 0 ? selectedIndex : 0) : current
      let next = from
      for (let step = 0; step < options.length; step++) {
        next = (next + delta + options.length) % options.length
        if (!options[next]?.disabled) break
      }
      return next
    })
  }

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) openList()
        else move(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!open) openList()
        else move(-1)
        break
      case 'Home':
        if (open) {
          event.preventDefault()
          setActiveIndex(0)
        }
        break
      case 'End':
        if (open) {
          event.preventDefault()
          setActiveIndex(options.length - 1)
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!open) openList()
        else commit(activeIndex)
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          close()
        }
        break
      case 'Tab':
        if (open) close(false)
        break
      default: {
        // Type-ahead: jump to the first option starting with what was typed.
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return

        const state = typeahead.current
        state.term += event.key.toLowerCase()
        clearTimeout(state.timer)
        state.timer = setTimeout(() => {
          state.term = ''
        }, 700)

        const match = options.findIndex((option) =>
          String(option.label).toLowerCase().startsWith(state.term),
        )
        if (match >= 0) {
          if (!open) openList(match)
          else setActiveIndex(match)
        }
      }
    }
  }

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={buttonId} hint={hint} required={required}>
          {label}
        </Label>
      )}

      <div ref={rootRef} className="relative">
        <button
          ref={buttonRef}
          id={buttonId}
          type="button"
          role="combobox"
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={error ? 'true' : undefined}
          disabled={disabled}
          onClick={() => (open ? close() : openList())}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex h-11 w-full items-center gap-2 rounded-xl border bg-ink-950/60 pl-4 pr-3 text-left text-[15px] transition-colors',
            'focus:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/50',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-red-500/70' : open ? 'border-brand-500' : 'border-ink-700 hover:border-ink-600',
          )}
        >
          <span className={cn('flex-1 truncate', selected ? 'text-ink-50' : 'text-ink-500')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={buttonId}
            tabIndex={-1}
            className={cn(
              'absolute z-50 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain rounded-xl border border-ink-700 bg-ink-900 p-1 shadow-2xl shadow-ink-950/60 animate-fade-up',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {options.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-ink-500">No options</li>
            )}

            {options.map((option, index) => {
              const isSelected = option.value === value
              const isActive = index === activeIndex

              return (
                <li
                  key={option.value ?? `option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(index)}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    option.disabled && 'cursor-not-allowed opacity-50',
                    isActive && !option.disabled ? 'bg-ink-800 text-white' : 'text-ink-200',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description && (
                      <span className="mt-0.5 block truncate text-xs text-ink-500">
                        {option.description}
                      </span>
                    )}
                  </span>

                  {isSelected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <FieldError>{error}</FieldError>
    </div>
  )
}
