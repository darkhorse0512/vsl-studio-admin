import { useCallback, useEffect, useMemo, useState } from 'react'
import { listPrompts, resetPrompt, savePrompt } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { cn, formatDateTime } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Form'
import Select from '../components/ui/Select'
import { Badge, Banner, EmptyState, LoadingScreen } from '../components/ui/Feedback'
import { ConfirmDialog } from '../components/ui/Modal'
import { Check, Code, Copy, Refresh, Sparkles } from '../components/Icons'
import { copyText } from '../lib/utils'

const EFFORT_OPTIONS = [
  { value: '', label: 'Default (server setting)' },
  { value: 'none', label: 'None — fastest' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'xhigh', label: 'Extra high — slowest' },
]

/**
 * Prompt editor.
 *
 * Each generator's shipped default lives in the edge function code. This page
 * edits overrides only, so "Restore default" can never fail and a bad prompt
 * is always one click from being undone.
 */
export default function Prompts() {
  const toast = useToast()

  const [templates, setTemplates] = useState([])
  const [models, setModels] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [showDefault, setShowDefault] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listPrompts()
      setTemplates(data.templates ?? [])
      setModels(data.models ?? null)
      setSelectedId((current) => current ?? data.templates?.[0]?.id ?? null)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const selected = useMemo(
    () => templates.find((item) => item.id === selectedId) ?? null,
    [templates, selectedId],
  )

  // Reset the editor whenever a different template is opened.
  useEffect(() => {
    if (!selected) {
      setForm(null)
      return
    }

    const override = selected.override ?? {}
    setForm({
      system_prompt: override.system_prompt ?? selected.defaults.system_prompt,
      user_prompt: override.user_prompt ?? selected.defaults.user_prompt,
      model: override.model ?? '',
      temperature:
        override.temperature ?? selected.defaults.temperature ?? '',
      max_tokens: override.max_tokens ?? selected.defaults.max_tokens ?? '',
      reasoning_effort: override.reasoning_effort ?? selected.defaults.reasoning_effort ?? '',
    })
    setShowDefault(false)
  }, [selected])

  const isCustom = Boolean(
    selected?.override &&
      (selected.override.system_prompt ||
        selected.override.user_prompt ||
        selected.override.model ||
        selected.override.temperature !== null ||
        selected.override.max_tokens !== null ||
        selected.override.reasoning_effort),
  )

  const dirty = useMemo(() => {
    if (!selected || !form) return false
    const override = selected.override ?? {}
    return (
      form.system_prompt !== (override.system_prompt ?? selected.defaults.system_prompt) ||
      form.user_prompt !== (override.user_prompt ?? selected.defaults.user_prompt) ||
      form.model !== (override.model ?? '') ||
      String(form.temperature) !== String(override.temperature ?? selected.defaults.temperature ?? '') ||
      String(form.max_tokens) !== String(override.max_tokens ?? selected.defaults.max_tokens ?? '') ||
      form.reasoning_effort !== (override.reasoning_effort ?? selected.defaults.reasoning_effort ?? '')
    )
  }, [selected, form])

  const missingPlaceholders = useMemo(() => {
    if (!selected || !form) return []
    const required = selected.id === 'analysis' ? ['{{VSL_TEXT}}'] : ['{{ANALYSIS_JSON}}']
    return required.filter((token) => !form.user_prompt.includes(token))
  }, [selected, form])

  const update = (field) => (event) =>
    setForm((state) => ({ ...state, [field]: event.target.value }))

  const handleSave = async () => {
    if (!selected || !form) return
    setSaving(true)
    try {
      const data = await savePrompt({
        id: selected.id,
        system_prompt: form.system_prompt,
        user_prompt: form.user_prompt,
        model: form.model,
        temperature: form.temperature === '' ? null : Number(form.temperature),
        max_tokens: form.max_tokens === '' ? null : Number(form.max_tokens),
        reasoning_effort: form.reasoning_effort,
      })
      setTemplates(data.templates ?? [])
      toast.success(`"${selected.label}" prompt saved. It applies to the next generation.`)
    } catch (saveError) {
      toast.error(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!selected) return
    setResetting(true)
    try {
      const data = await resetPrompt(selected.id)
      setTemplates(data.templates ?? [])
      toast.success(`"${selected.label}" restored to the shipped default.`)
      setConfirmReset(false)
    } catch (resetError) {
      toast.error(resetError.message)
    } finally {
      setResetting(false)
    }
  }

  const handleRevertEditor = () => {
    if (!selected) return
    setForm((state) => ({
      ...state,
      system_prompt: selected.defaults.system_prompt,
      user_prompt: selected.defaults.user_prompt,
    }))
  }

  const insertPlaceholder = async (token) => {
    const ok = await copyText(token)
    toast[ok ? 'success' : 'error'](
      ok ? `${token} copied — paste it into the prompt.` : 'Could not copy.',
    )
  }

  if (loading && !templates.length) return <LoadingScreen label="Loading prompts…" />

  return (
    <>
      <PageHeader
        title="Prompts"
        description="Every generator's instructions. Edits apply to the next generation — no deploy needed."
        actions={
          <Button variant="secondary" size="sm" onClick={load} loading={loading}>
            <Refresh className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {error && (
        <Banner tone="danger" title="Could not load the prompts" className="mb-6">
          {error}
        </Banner>
      )}

      {models && (
        <Banner tone="neutral" className="mb-6">
          Current models — analysis:{' '}
          <span className="font-mono text-ink-100">{models.analysis}</span> · assets:{' '}
          <span className="font-mono text-ink-100">{models.assets}</span>. Leave a prompt's model
          field empty to follow these.
        </Banner>
      )}

      {templates.length === 0 && !loading ? (
        <EmptyState icon={Sparkles} title="No prompt templates registered" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Template list ------------------------------------------- */}
          <nav className="space-y-2 lg:sticky lg:top-6 lg:self-start">
            {templates.map((item) => {
              const custom = Boolean(
                item.override &&
                  (item.override.system_prompt || item.override.user_prompt ||
                    item.override.model || item.override.temperature !== null ||
                    item.override.max_tokens !== null || item.override.reasoning_effort),
              )

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'w-full rounded-xl border p-3.5 text-left transition-colors',
                    selectedId === item.id
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-ink-800 hover:border-ink-600 hover:bg-ink-900',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-white">{item.label}</span>
                    {custom ? (
                      <Badge tone="brand">Custom</Badge>
                    ) : (
                      <Badge>Default</Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">
                    {item.description}
                  </p>
                </button>
              )
            })}
          </nav>

          {/* Editor -------------------------------------------------- */}
          {selected && form && (
            <div className="min-w-0 space-y-5">
              <div className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-white">{selected.label}</h2>
                    <p className="mt-1 text-sm text-ink-400">{selected.description}</p>
                  </div>
                  <Badge tone={selected.outputKind === 'markdown' ? 'warning' : 'info'}>
                    <Code className="h-3.5 w-3.5" />
                    {selected.outputKind}
                  </Badge>
                </div>

                {isCustom && selected.override?.updated_at && (
                  <p className="mt-3 text-xs text-ink-500">
                    Customised · last saved {formatDateTime(selected.override.updated_at)}
                  </p>
                )}

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-500">
                    Available placeholders
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.placeholders.map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => insertPlaceholder(token)}
                        title="Copy to clipboard"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-950/60 px-2.5 py-1 font-mono text-xs text-brand-300 transition-colors hover:border-brand-500 hover:text-brand-200"
                      >
                        <Copy className="h-3 w-3" />
                        {token}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">
                    These are replaced with the project's real data at generation time. Removing
                    the required one is blocked.
                  </p>
                </div>
              </div>

              {missingPlaceholders.length > 0 && (
                <Banner tone="danger" title="Required placeholder missing">
                  The user prompt must still contain{' '}
                  <span className="font-mono">{missingPlaceholders.join(', ')}</span> — without it
                  the model never receives the project's data.
                </Banner>
              )}

              {/* System prompt --------------------------------------- */}
              <div className="card p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="system-prompt" className="text-sm font-medium text-ink-200">
                    System prompt
                  </label>
                  <span className="text-xs text-ink-600">
                    {form.system_prompt.length.toLocaleString()} chars
                  </span>
                </div>
                <textarea
                  id="system-prompt"
                  value={form.system_prompt}
                  onChange={update('system_prompt')}
                  rows={8}
                  spellCheck={false}
                  className="w-full resize-y rounded-xl border border-ink-700 bg-ink-950/60 p-4 font-mono text-[13px] leading-relaxed text-ink-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>

              {/* User prompt ----------------------------------------- */}
              <div className="card p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="user-prompt" className="text-sm font-medium text-ink-200">
                    User prompt template
                  </label>
                  <span className="text-xs text-ink-600">
                    {form.user_prompt.length.toLocaleString()} chars
                  </span>
                </div>
                <textarea
                  id="user-prompt"
                  value={form.user_prompt}
                  onChange={update('user_prompt')}
                  rows={22}
                  spellCheck={false}
                  className="w-full resize-y rounded-xl border border-ink-700 bg-ink-950/60 p-4 font-mono text-[13px] leading-relaxed text-ink-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowDefault((v) => !v)}>
                    {showDefault ? 'Hide shipped default' : 'Show shipped default'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRevertEditor}>
                    Copy default into the editor
                  </Button>
                </div>

                {showDefault && (
                  <pre className="mt-3 max-h-96 overflow-auto rounded-xl border border-ink-800 bg-ink-950/80 p-4 text-[12px] leading-relaxed text-ink-400">
                    {selected.defaults.user_prompt}
                  </pre>
                )}
              </div>

              {/* Model settings -------------------------------------- */}
              <div className="card p-5">
                <h3 className="mb-4 text-sm font-medium text-ink-200">Model settings</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Model"
                    hint="Empty = server default"
                    placeholder={selected.id === 'analysis' ? models?.analysis : models?.assets}
                    value={form.model}
                    onChange={update('model')}
                  />

                  <Select
                    label="Reasoning effort"
                    hint="Higher = slower"
                    value={form.reasoning_effort}
                    onChange={(next) =>
                      setForm((state) => ({ ...state, reasoning_effort: next }))
                    }
                    options={EFFORT_OPTIONS}
                  />

                  <Input
                    label="Temperature"
                    hint="0 – 2"
                    type="number"
                    step="0.05"
                    min="0"
                    max="2"
                    value={form.temperature}
                    onChange={update('temperature')}
                  />

                  <Input
                    label="Max output tokens"
                    hint="500 – 64000"
                    type="number"
                    step="500"
                    min="500"
                    max="64000"
                    value={form.max_tokens}
                    onChange={update('max_tokens')}
                  />
                </div>

                <p className="mt-4 text-xs leading-relaxed text-ink-500">
                  Reasoning models ignore temperature. Raising max tokens or effort increases
                  latency — edge functions time out at around 170 seconds.
                </p>
              </div>

              {/* Actions --------------------------------------------- */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSave}
                  loading={saving}
                  disabled={!dirty || missingPlaceholders.length > 0}
                >
                  <Check className="h-4 w-4" />
                  Save prompt
                </Button>

                {isCustom && (
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmReset(true)}
                    disabled={saving}
                  >
                    <Refresh className="h-4 w-4" />
                    Restore default
                  </Button>
                )}

                {dirty && <span className="text-sm text-amber-400">Unsaved changes</span>}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        loading={resetting}
        title="Restore the shipped default?"
        confirmLabel="Restore default"
        variant="danger"
        message={`Your customised "${selected?.label}" prompt will be deleted and the version that ships with the app takes over immediately.`}
      />
    </>
  )
}
