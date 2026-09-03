import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteProjectAsAdmin, getProjectDetail, listProjectAssets } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { PROJECT_STATUS, cn, formatDateTime, timeAgo, wordCount } from '../lib/utils'
import AnalysisPanel from '../components/AnalysisPanel'
import CodeStudio from '../components/CodeStudio'
import Button from '../components/ui/Button'
import { Badge, Banner, Dot, EmptyState, LoadingScreen } from '../components/ui/Feedback'
import { ConfirmDialog } from '../components/ui/Modal'
import { ArrowLeft, FileText, Layers, Puzzle, Sparkles, Target, Trash } from '../components/Icons'

const TABS = [
  { id: 'analysis', label: 'Analysis', icon: Sparkles },
  { id: 'sales_page', label: 'Sales page', icon: FileText },
  { id: 'quiz', label: 'Quiz', icon: Puzzle },
  { id: 'source', label: 'VSL source', icon: Layers },
]

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [project, setProject] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('analysis')
  const [selected, setSelected] = useState({ sales_page: null, quiz: null })
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [projectData, assetData] = await Promise.all([
        getProjectDetail(id),
        listProjectAssets(id),
      ])

      if (!projectData) {
        setError('This project no longer exists.')
        return
      }

      setProject(projectData)
      setAssets(assetData)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const byType = useMemo(
    () => ({
      sales_page: assets.filter((asset) => asset.type === 'sales_page'),
      quiz: assets.filter((asset) => asset.type === 'quiz'),
    }),
    [assets],
  )

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProjectAsAdmin(id)
      toast.success('Project deleted.')
      navigate('/projects', { replace: true })
    } catch (deleteError) {
      toast.error(deleteError.message)
      setDeleting(false)
    }
  }

  if (loading) return <LoadingScreen label="Loading project…" />

  if (error || !project) {
    return (
      <div className="mx-auto max-w-xl">
        <Banner tone="danger" title="Project unavailable">
          {error}
        </Banner>
        <Button to="/projects" variant="secondary" className="mt-5">
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Button>
      </div>
    )
  }

  const status = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.draft
  const activeAsset = (type) => {
    const list = byType[type]
    if (!list.length) return null
    return list.find((asset) => asset.id === selected[type]) ?? list[0]
  }

  return (
    <div className="space-y-7">
      <Button to="/projects" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Button>

      {/* Header ------------------------------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {project.name}
            </h1>
            <Badge tone={status.tone}>
              <Dot tone={status.tone} />
              {status.label}
            </Badge>
          </div>

          <p className="mt-2 text-sm text-ink-500">
            Owner:{' '}
            {project.owner ? (
              <Link to={`/users/${project.owner.id}`} className="text-ink-300 hover:text-brand-300">
                {project.owner.email}
              </Link>
            ) : (
              'unknown'
            )}{' '}
            · {wordCount(project.vsl_text).toLocaleString()} words · created{' '}
            {timeAgo(project.created_at)}
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash className="h-4 w-4 text-red-400/80" />
          Delete
        </Button>
      </div>

      {project.status === 'failed' && project.error_message && (
        <Banner tone="danger" title="Last analysis failed">
          {project.error_message}
        </Banner>
      )}

      {/* Tabs --------------------------------------------------------- */}
      <div className="flex gap-1 overflow-x-auto border-b border-ink-800 scrollbar-none">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              tab === item.id
                ? 'border-brand-500 text-white'
                : 'border-transparent text-ink-400 hover:text-ink-100',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {byType[item.id]?.length > 0 && (
              <span className="rounded-full bg-ink-700 px-1.5 text-[11px] text-ink-200">
                {byType[item.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panels ------------------------------------------------------- */}
      {tab === 'analysis' &&
        (project.analysis ? (
          <>
            <TargetProduct settings={project.generation_settings} />
            <AnalysisPanel analysis={project.analysis} />
            {project.analysis_model && (
              <p className="text-center text-xs text-ink-600">
                Analysed with {project.analysis_model} on {formatDateTime(project.analyzed_at)}
              </p>
            )}
          </>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No analysis stored"
            description="This project has not been analysed yet, so no assets can exist for it."
          />
        ))}

      {(tab === 'sales_page' || tab === 'quiz') && (
        <AssetViewer
          type={tab}
          assets={byType[tab]}
          active={activeAsset(tab)}
          projectName={project.name}
          onSelect={(assetId) => setSelected((current) => ({ ...current, [tab]: assetId }))}
        />
      )}

      {tab === 'source' && (
        <div className="card p-6">
          <h2 className="font-semibold text-white">VSL transcript</h2>
          <p className="mt-1 text-sm text-ink-500">
            {project.vsl_text.length.toLocaleString()} characters ·{' '}
            {project.source_type === 'file'
              ? project.source_filename || 'uploaded file'
              : 'pasted text'}
          </p>

          <pre className="mt-4 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl bg-ink-950/70 p-5 text-sm leading-relaxed text-ink-300">
            {project.vsl_text}
          </pre>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this project?"
        confirmLabel="Delete project"
        message="The VSL, its analysis and every generated asset will be permanently removed for the customer as well. This cannot be undone."
      />
    </div>
  )
}

/** Read-only view of the customer's target product overrides. */
function TargetProduct({ settings }) {
  const fields = [
    ['Product', settings?.product_name],
    ['Type', settings?.product_type],
    ['Price', settings?.price],
    ['Payment', settings?.payment_note],
    ['Language', settings?.language],
    ['Market', settings?.country],
    ['Guarantee', settings?.guarantee],
    ['CTA', settings?.cta_label],
  ].filter(([, value]) => Boolean(value))

  if (!fields.length && !settings?.custom_instructions) return null

  return (
    <section className="card p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-300">
        <Target className="h-4 w-4 text-accent-400" />
        Target product overrides
      </h3>
      <p className="mt-1 text-sm text-ink-500">
        Applied to both assets at generation time, replacing the offer described in the VSL.
      </p>

      {fields.length > 0 && (
        <dl className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
                {label}
              </dt>
              <dd className="mt-0.5 truncate text-sm text-ink-100" title={value}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {settings?.custom_instructions && (
        <div className="mt-3 rounded-lg border border-accent-500/25 bg-accent-500/5 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-accent-400">
            Custom instructions
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-200">
            {settings.custom_instructions}
          </p>
        </div>
      )}
    </section>
  )
}

function AssetViewer({ type, assets, active, projectName, onSelect }) {
  if (!assets.length) {
    return (
      <EmptyState
        icon={type === 'quiz' ? Puzzle : FileText}
        title={`No ${type === 'quiz' ? 'quiz' : 'sales page'} generated`}
        description="The customer has not generated this asset for the project yet."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-white">{active?.title || 'Generated asset'}</h2>
          <p className="text-sm text-ink-500">
            Version {active?.version} · generated {timeAgo(active?.created_at)}
          </p>
        </div>

        {assets.length > 1 && (
          <select
            value={active?.id}
            onChange={(event) => onSelect(event.target.value)}
            aria-label="Select version"
            className="h-9 rounded-lg border border-ink-700 bg-ink-950/60 px-3 text-sm text-ink-200 focus:border-brand-500 focus:outline-none"
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                Version {asset.version} — {timeAgo(asset.created_at)}
              </option>
            ))}
          </select>
        )}
      </div>

      {active && (
        <CodeStudio
          code={active.code}
          title={active.title}
          downloadName={`${projectName}-${type === 'quiz' ? 'quiz' : 'sales-page'}-v${active.version}`}
          meta={active.model ? `Generated with ${active.model}` : null}
        />
      )}
    </div>
  )
}
