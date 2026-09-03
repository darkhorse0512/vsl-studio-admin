import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { approveUser, fetchStats, listAllProjects, listAuditLogs, listUsers, rejectUser } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { AUDIT_ACTION, PROJECT_STATUS, formatDateTime, initials, timeAgo } from '../lib/utils'
import Button from '../components/ui/Button'
import { Badge, Banner, Dot, EmptyState, Skeleton } from '../components/ui/Feedback'
import { Check, Clock, FileText, Grid, Layers, Puzzle, Sparkles, User, X } from '../components/Icons'

export default function Overview() {
  const toast = useToast()
  const { refreshPending } = useOutletContext() ?? {}

  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])
  const [projects, setProjects] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsData, pendingUsers, recentProjects, recentLogs] = await Promise.all([
        fetchStats(),
        listUsers({ status: 'pending' }),
        listAllProjects(),
        listAuditLogs(6),
      ])

      setStats(statsData)
      setPending(pendingUsers)
      setProjects(recentProjects.slice(0, 6))
      setLogs(recentLogs)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const decide = async (user, approve) => {
    setWorking(user.id)
    try {
      await (approve ? approveUser(user.id) : rejectUser(user.id))
      setPending((current) => current.filter((item) => item.id !== user.id))
      setStats((current) =>
        current
          ? {
              ...current,
              users_pending: Math.max(0, (current.users_pending ?? 1) - 1),
              users_approved: (current.users_approved ?? 0) + (approve ? 1 : 0),
            }
          : current,
      )
      refreshPending?.()
      toast.success(`${user.email} was ${approve ? 'approved' : 'rejected'}.`)
    } catch (actionError) {
      toast.error(actionError.message)
    } finally {
      setWorking(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
          <p className="mt-1.5 text-ink-400">Account approvals and platform activity at a glance.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <Banner tone="danger" title="Could not load the dashboard">
          {error}
        </Banner>
      )}

      {/* Stats -------------------------------------------------------- */}
      {loading && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : (
        stats && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={User}
                label="Total users"
                value={stats.users_total}
                sub={`${stats.signups_7d} new this week`}
              />
              <StatCard
                icon={Clock}
                label="Awaiting approval"
                value={stats.users_pending}
                sub={stats.users_pending > 0 ? 'Needs your attention' : 'All caught up'}
                tone={stats.users_pending > 0 ? 'warning' : 'success'}
              />
              <StatCard
                icon={Layers}
                label="Projects"
                value={stats.projects_total}
                sub={`${stats.projects_7d} created this week`}
              />
              <StatCard
                icon={Sparkles}
                label="Assets generated"
                value={stats.assets_total}
                sub={`${stats.sales_pages} pages · ${stats.quizzes} quizzes`}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat label="Approved users" value={stats.users_approved} />
              <MiniStat label="Administrators" value={stats.admins} />
              <MiniStat label="Suspended / rejected" value={stats.users_suspended + stats.users_rejected} />
              <MiniStat
                label="Failed analyses"
                value={stats.projects_failed}
                tone={stats.projects_failed > 0 ? 'danger' : 'neutral'}
              />
            </div>
          </>
        )
      )}

      {/* Approval queue ----------------------------------------------- */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Approval queue</h2>
          <Link to="/users?status=pending" className="text-sm link-muted">
            View all users
          </Link>
        </div>

        {loading ? (
          <Skeleton className="h-32" />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={Check}
            title="No accounts waiting"
            description="Every signup has been reviewed. New requests will appear here automatically."
          />
        ) : (
          <div className="card divide-y divide-ink-800">
            {pending.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-ink-900"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-800 text-sm font-semibold text-ink-200">
                  {initials(user.full_name || user.email)}
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/users/${user.id}`}
                    className="block truncate font-medium text-white hover:text-brand-300"
                  >
                    {user.full_name || user.email}
                  </Link>
                  <p className="truncate text-sm text-ink-500">
                    {user.email}
                    {user.company ? ` · ${user.company}` : ''} · requested {timeAgo(user.created_at)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => decide(user, true)}
                    loading={working === user.id}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => decide(user, false)}
                    disabled={working === user.id}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity ---------------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Latest projects</h2>
            <Link to="/projects" className="text-sm link-muted">
              View all
            </Link>
          </div>

          {loading ? (
            <Skeleton className="h-64" />
          ) : projects.length === 0 ? (
            <EmptyState icon={Grid} title="No projects yet" />
          ) : (
            <div className="card divide-y divide-ink-800">
              {projects.map((project) => {
                const status = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.draft
                const assets = project.assets ?? []

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-ink-900"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{project.name}</p>
                      <p className="truncate text-sm text-ink-500">
                        {project.owner?.email ?? 'Unknown owner'} · {timeAgo(project.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {assets.some((asset) => asset.type === 'sales_page') && (
                        <FileText className="h-4 w-4 text-brand-400" />
                      )}
                      {assets.some((asset) => asset.type === 'quiz') && (
                        <Puzzle className="h-4 w-4 text-accent-400" />
                      )}
                      <Badge tone={status.tone}>
                        <Dot tone={status.tone} />
                        {status.label}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent admin actions</h2>
            <Link to="/audit" className="text-sm link-muted">
              Full audit log
            </Link>
          </div>

          {loading ? (
            <Skeleton className="h-64" />
          ) : logs.length === 0 ? (
            <EmptyState icon={Clock} title="No admin actions recorded yet" />
          ) : (
            <div className="card divide-y divide-ink-800">
              {logs.map((log) => (
                <div key={log.id} className="p-4">
                  <p className="text-sm text-ink-100">
                    <span className="font-medium">
                      {AUDIT_ACTION[log.action] ?? log.action}
                    </span>
                    {log.metadata?.email ? ` — ${log.metadata.email}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {log.actor_email} · {formatDateTime(log.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon: IconComponent, label, value, sub, tone = 'neutral' }) {
  const toneClass = {
    neutral: 'text-ink-500',
    warning: 'text-amber-400',
    success: 'text-emerald-400',
    danger: 'text-red-400',
  }[tone]

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-400">{label}</p>
        <IconComponent className={`h-4.5 w-4.5 ${toneClass}`} />
      </div>
      <p className="mt-2 text-3xl font-bold text-white">{value ?? 0}</p>
      {sub && <p className={`mt-1 text-xs ${toneClass}`}>{sub}</p>}
    </div>
  )
}

function MiniStat({ label, value, tone = 'neutral' }) {
  return (
    <div className="card flex items-center justify-between p-4">
      <span className="text-sm text-ink-400">{label}</span>
      <span
        className={`text-xl font-semibold ${tone === 'danger' ? 'text-red-400' : 'text-white'}`}
      >
        {value ?? 0}
      </span>
    </div>
  )
}
