import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllProjects } from '../lib/api'
import { PROJECT_STATUS, cn, formatDate, timeAgo } from '../lib/utils'
import { Input } from '../components/ui/Form'
import { Badge, Banner, Dot, EmptyState, Skeleton } from '../components/ui/Feedback'
import { FileText, Layers, Puzzle } from '../components/Icons'

const STATUS_FILTERS = [
  ['all', 'All'],
  ['analyzed', 'Analysed'],
  ['draft', 'Draft'],
  ['analyzing', 'Analysing'],
  ['failed', 'Failed'],
]

export default function Projects() {
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProjects(await listAllProjects({ status, search: debouncedSearch }))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [status, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
        <p className="mt-1.5 text-ink-400">
          Every VSL analysis on the platform and the assets generated from it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Search project names…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:max-w-xs"
          aria-label="Search projects"
        />

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                status === value
                  ? 'bg-ink-700 text-white'
                  : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <Banner tone="danger">{error}</Banner>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No projects found"
          description="Nothing matches the current filters."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-ink-800 text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Assets</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-ink-800">
                {projects.map((project) => {
                  const statusMeta = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.draft
                  const assets = project.assets ?? []
                  const pages = assets.filter((asset) => asset.type === 'sales_page').length
                  const quizzes = assets.filter((asset) => asset.type === 'quiz').length

                  return (
                    <tr key={project.id} className="transition-colors hover:bg-ink-900/60">
                      <td className="px-5 py-4">
                        <Link
                          to={`/projects/${project.id}`}
                          className="font-medium text-white hover:text-brand-300"
                        >
                          {project.name}
                        </Link>
                        <p className="text-xs text-ink-500">
                          {project.source_type === 'file'
                            ? project.source_filename || 'Uploaded file'
                            : 'Pasted text'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {project.owner ? (
                          <Link
                            to={`/users/${project.owner.id}`}
                            className="text-ink-200 hover:text-brand-300"
                          >
                            {project.owner.full_name || project.owner.email}
                          </Link>
                        ) : (
                          <span className="text-ink-500">Unknown</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={statusMeta.tone}>
                          <Dot tone={statusMeta.tone} />
                          {statusMeta.label}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 text-ink-300">
                          <span className="inline-flex items-center gap-1.5" title="Sales pages">
                            <FileText className="h-4 w-4 text-brand-400" />
                            {pages}
                          </span>
                          <span className="inline-flex items-center gap-1.5" title="Quizzes">
                            <Puzzle className="h-4 w-4 text-accent-400" />
                            {quizzes}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-ink-400">
                        <span title={formatDate(project.created_at)}>
                          {timeAgo(project.created_at)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
