import { useMemo, useState } from 'react'
import { cn, copyText, downloadFile, openInNewTab, slugify } from '../lib/utils'
import { useToast } from '../context/ToastContext'
import Button from './ui/Button'
import { Check, Code, Copy, Download, ExternalLink, Eye, Monitor, Phone, Refresh } from './Icons'

/**
 * Preview + source viewer for a generated asset.
 *
 * The preview runs in a sandboxed iframe with `allow-scripts` but WITHOUT
 * `allow-same-origin`, so generated JavaScript stays interactive while being
 * unable to reach this app's session, cookies or storage.
 */
export default function CodeStudio({ code, title, downloadName = 'asset', meta = null }) {
  const [tab, setTab] = useState('preview')
  const [device, setDevice] = useState('desktop')
  const [reloadKey, setReloadKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  const filename = useMemo(() => `${slugify(downloadName)}.html`, [downloadName])
  const sizeKb = useMemo(() => (new Blob([code ?? '']).size / 1024).toFixed(1), [code])
  const lineCount = useMemo(() => (code ? code.split('\n').length : 0), [code])

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
    downloadFile(filename, code)
    toast.success(`Downloaded ${filename}`)
  }

  const handleOpen = () => {
    if (!openInNewTab(code)) {
      toast.error('Your browser blocked the pop-up. Allow pop-ups for this site and try again.')
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Toolbar ------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-800 bg-ink-900/80 px-4 py-3">
        <div className="flex rounded-lg border border-ink-700 bg-ink-950/60 p-0.5">
          <TabButton active={tab === 'preview'} onClick={() => setTab('preview')} icon={Eye}>
            Preview
          </TabButton>
          <TabButton active={tab === 'code'} onClick={() => setTab('code')} icon={Code}>
            Code
          </TabButton>
        </div>

        {tab === 'preview' && (
          <div className="hidden rounded-lg border border-ink-700 bg-ink-950/60 p-0.5 sm:flex">
            <TabButton active={device === 'desktop'} onClick={() => setDevice('desktop')} icon={Monitor}>
              <span className="sr-only">Desktop preview</span>
            </TabButton>
            <TabButton active={device === 'mobile'} onClick={() => setDevice('mobile')} icon={Phone}>
              <span className="sr-only">Mobile preview</span>
            </TabButton>
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {tab === 'preview' && (
            <Button variant="ghost" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
              <Refresh className="h-4 w-4" />
              <span className="hidden sm:inline">Reload</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleOpen}>
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Open</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy code'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export HTML</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Body --------------------------------------------------------- */}
      {tab === 'preview' ? (
        <div className="bg-ink-950/60 p-3 sm:p-5">
          <div
            className={cn(
              'mx-auto overflow-hidden rounded-xl border border-ink-700 bg-white shadow-2xl transition-all duration-300',
              device === 'mobile' ? 'w-full max-w-[390px]' : 'w-full',
            )}
          >
            <iframe
              key={reloadKey}
              title={title ? `Preview of ${title}` : 'Generated asset preview'}
              srcDoc={code}
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
              loading="lazy"
              className={cn(
                'w-full border-0 bg-white',
                device === 'mobile' ? 'h-[720px]' : 'h-[75vh] min-h-[560px]',
              )}
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <pre className="max-h-[75vh] overflow-auto bg-ink-950/80 p-5 text-[12.5px] leading-relaxed">
            <code className="font-mono text-ink-200">{code}</code>
          </pre>
        </div>
      )}

      {/* Footer ------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-800 bg-ink-900/60 px-4 py-2.5 text-xs text-ink-500">
        <span>{filename}</span>
        <span>{lineCount.toLocaleString()} lines</span>
        <span>{sizeKb} KB</span>
        {meta && <span className="ml-auto">{meta}</span>}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: IconComponent, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-ink-700 text-white shadow-sm' : 'text-ink-400 hover:text-ink-100',
      )}
    >
      {IconComponent && <IconComponent className="h-4 w-4" />}
      {children}
    </button>
  )
}
