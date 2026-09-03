import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAuditLogs } from '../lib/api'
import { AUDIT_ACTION, formatDateTime, timeAgo } from '../lib/utils'
import Button from '../components/ui/Button'
import { Badge, Banner, EmptyState, Skeleton } from '../components/ui/Feedback'
import { Clock } from '../components/Icons'

const TONE = {
  approve: 'success',
  reinstate: 'success',
  reject: 'danger',
  suspend: 'danger',
  delete_user: 'danger',
  set_role: 'brand',
  set_notes: 'neutral',
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(100)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setLogs(await listAuditLogs(limit))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Audit log</h1>
          <p className="mt-1.5 text-ink-400">
            Every privileged action taken in this panel, recorded server-side.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && <Banner tone="danger">{error}</Banner>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nothing recorded yet"
          description="Approvals, suspensions, role changes and deletions will show up here."
        />
      ) : (
        <>
          <div className="card divide-y divide-ink-800">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center gap-4 p-4">
                <Badge tone={TONE[log.action] ?? 'neutral'}>
                  {AUDIT_ACTION[log.action] ?? log.action}
                </Badge>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-100">
                    {log.metadata?.email ? (
                      log.target_id ? (
                        <Link
                          to={`/users/${log.target_id}`}
                          className="font-medium hover:text-brand-300"
                        >
                          {log.metadata.email}
                        </Link>
                      ) : (
                        <span className="font-medium">{log.metadata.email}</span>
                      )
                    ) : (
                      <span className="text-ink-400">{log.target_type ?? 'system'}</span>
                    )}
                    {log.metadata?.role && (
                      <span className="text-ink-400"> → {log.metadata.role}</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-500">by {log.actor_email}</p>
                </div>

                <span
                  className="shrink-0 text-xs text-ink-500"
                  title={formatDateTime(log.created_at)}
                >
                  {timeAgo(log.created_at)}
                </span>
              </div>
            ))}
          </div>

          {logs.length >= limit && (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => setLimit((current) => current + 100)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
