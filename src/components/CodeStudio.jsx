import { useEffect, useMemo, useState } from 'react'
import {
  cn,
  copyText,
  downloadFile,
  openInNewTab,
  printDocument,
  slugify,
} from '../lib/utils'
import { useToast } from '../context/ToastContext'
import Button from './ui/Button'
import {
  Check,
  Code,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Monitor,
  Phone,
  Printer,
  Refresh,
  Tablet,
  X,
} from './Icons'

const DEVICES = {
  desktop: { label: 'Desktop', icon: Monitor, width: '100%' },
  tablet: { label: 'Tablet', icon: Tablet, width: '820px' },
  mobile: { label: 'Mobile', icon: Phone, width: '390px' },
}

/**
 * Preview + source viewer for a generated asset.
 *
 * The preview runs in a sandboxed iframe with `allow-scripts` but WITHOUT
 * `allow-same-origin`, so generated JavaScript stays interactive while being
 * unable to reach this app's session, cookies or storage.
 */
export default function CodeStudio({
  code,
  title,
  downloadName = 'asset',
  meta = null,
  /** 'html' renders a live preview; 'markdown' is text only. */
  kind = 'html',
  /** Adds a print / save-as-PDF action (used by the product deliverable). */
  printable = false,
}) {
  const isMarkdown = kind === 'markdown'
  const [tab, setTab] = useState(kind === 'markdown' ? 'code' : 'preview')
  const [device, setDevice] = useState('desktop')
  const [reloadKey, setReloadKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const toast = useToast()

  const filename = useMemo(
    () => `${slugify(downloadName)}.${isMarkdown ? 'md' : 'html'}`,
    [downloadName, isMarkdown],
  )
  const sizeKb = useMemo(() => (new Blob([code ?? '']).size / 1024).toFixed(1), [code])
  const lines = useMemo(() => (code ? code.split('\n') : []), [code])

  useEffect(() => {
    if (!fullscreen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setFullscreen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [fullscreen])

  const handleCopy = async () => {
    const ok = await copyText(code)
    if (ok) {
      setCopied(true)
      toast.success('HTML copied to your clipboard.')
      setTimeout(() => setCopied(false), 2200)
    } else {
      toast.error('Could not access the clipboard. Select the code and copy it manually.')
    }
  }

  const handleDownload = () => {
    downloadFile(filename, code, isMarkdown ? 'text/markdown;charset=utf-8' : undefined)
    toast.success(`Downloaded ${filename}`)
  }

  const handlePrint = () => {
    if (!printDocument(code)) {
      toast.error('Your browser blocked the pop-up. Allow pop-ups for this site and try again.')
    }
  }

  const handleOpen = () => {
    if (!openInNewTab(code)) {
      toast.error('Your browser blocked the pop-up. Allow pop-ups for this site and try again.')
    }
  }

  const frame = (
    <div
      className={cn(
        'flex flex-col overflow-hidden',
        fullscreen
          ? 'fixed inset-0 z-[60] rounded-none bg-ink-950'
          : 'card rounded-2xl',
      )}
    >
      {/* Toolbar ------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 bg-ink-900/70 px-3 py-2.5 sm:px-4">
        {!isMarkdown && (
          <Segmented
            options={[
              { value: 'preview', label: 'Preview', icon: Eye },
              { value: 'code', label: 'Code', icon: Code },
            ]}
            value={tab}
            onChange={setTab}
          />
        )}

        {isMarkdown && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink-800 px-3 py-1.5 text-sm text-ink-300">
            <Code className="h-4 w-4" />
            Markdown
          </span>
        )}

        {tab === 'preview' && !isMarkdown && (
          <div className="hidden sm:block">
            <Segmented
              iconOnly
              options={Object.entries(DEVICES).map(([value, config]) => ({
                value,
                label: config.label,
                icon: config.icon,
              }))}
              value={device}
              onChange={setDevice}
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {tab === 'preview' && (
            <IconAction
              label="Reload preview"
              icon={Refresh}
              onClick={() => setReloadKey((key) => key + 1)}
            />
          )}
          <IconAction label="Open in a new tab" icon={ExternalLink} onClick={handleOpen} />
          {printable && (
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          )}
          <IconAction
            label={fullscreen ? 'Exit full screen' : 'Full screen'}
            icon={fullscreen ? X : ExpandIcon}
            onClick={() => setFullscreen((value) => !value)}
          />

          <span className="mx-1 hidden h-5 w-px bg-ink-800 sm:block" />

          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Body --------------------------------------------------------- */}
      {tab === 'preview' && !isMarkdown ? (
        <div
          className={cn(
            'flex-1 overflow-auto bg-gradient-to-b from-ink-950 to-ink-900/60 p-3 sm:p-5',
            !fullscreen && 'min-h-0',
          )}
        >
          <div
            className="mx-auto overflow-hidden rounded-xl border border-ink-700 bg-white shadow-2xl transition-[max-width] duration-300"
            style={{ maxWidth: DEVICES[device].width }}
          >
            {/* browser chrome */}
            <div className="flex items-center gap-2 border-b border-black/10 bg-ink-100 px-3 py-2">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="mx-auto max-w-[60%] truncate rounded-md bg-white px-3 py-0.5 text-[11px] text-ink-500">
                {filename}
              </span>
            </div>

            <iframe
              key={`${reloadKey}-${device}-${fullscreen}`}
              title={title ? `Preview of ${title}` : 'Generated asset preview'}
              srcDoc={code}
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
              loading="lazy"
              className={cn(
                'w-full border-0 bg-white',
                fullscreen ? 'h-[calc(100vh-9.5rem)]' : 'h-[72vh] min-h-[520px]',
              )}
            />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'flex-1 overflow-auto bg-ink-950/80',
            fullscreen ? 'h-[calc(100vh-6.5rem)]' : 'max-h-[72vh]',
          )}
        >
          <pre className="flex min-w-full text-[12.5px] leading-[1.65]">
            <span
              aria-hidden="true"
              className="sticky left-0 select-none border-r border-ink-800 bg-ink-950/90 px-3 py-4 text-right font-mono text-ink-700"
            >
              {lines.map((_, index) => (
                <span key={index} className="block">
                  {index + 1}
                </span>
              ))}
            </span>
            <code className="block flex-1 px-4 py-4 font-mono text-ink-200">{code}</code>
          </pre>
        </div>
      )}

      {/* Footer ------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-800 bg-ink-900/60 px-4 py-2.5 text-xs text-ink-500">
        <span className="font-mono">{filename}</span>
        <span>{lines.length.toLocaleString()} lines</span>
        <span>{sizeKb} KB</span>
        <span className="hidden sm:inline">Self-contained · no dependencies</span>
        {meta && <span className="ml-auto truncate">{meta}</span>}
      </div>
    </div>
  )

  if (!fullscreen) return frame

  return (
    <>
      <div className="card rounded-2xl p-10 text-center text-sm text-ink-500">
        Previewing in full screen — press <kbd className="font-mono text-ink-300">Esc</kbd> to
        return.
      </div>
      {frame}
    </>
  )
}

/* ------------------------------------------------------------------ */

function Segmented({ options, value, onChange, iconOnly = false }) {
  return (
    <div className="flex rounded-lg border border-ink-800 bg-ink-950/60 p-0.5">
      {options.map((option) => {
        const IconComponent = option.icon
        const active = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            title={iconOnly ? option.label : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-ink-700 text-white shadow-sm' : 'text-ink-400 hover:text-ink-100',
            )}
          >
            {IconComponent && <IconComponent className="h-4 w-4" />}
            {iconOnly ? <span className="sr-only">{option.label}</span> : option.label}
          </button>
        )
      })}
    </div>
  )
}

function IconAction({ label, icon: IconComponent, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-white"
    >
      <IconComponent className="h-4 w-4" />
    </button>
  )
}

function ExpandIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" />
    </svg>
  )
}
