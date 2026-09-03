import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  approveUser,
  deleteUser,
  listUsers,
  reinstateUser,
  rejectUser,
  setUserRole,
  suspendUser,
} from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { USER_ROLE, USER_STATUS, cn, formatDate, initials, timeAgo } from '../lib/utils'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Form'
import { Badge, Banner, EmptyState, Skeleton } from '../components/ui/Feedback'
import { ConfirmDialog } from '../components/ui/Modal'
import { Check, Shield, Trash, User, X } from '../components/Icons'

const STATUS_FILTERS = [
  ['all', 'All'],
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['suspended', 'Suspended'],
  ['rejected', 'Rejected'],
]

export default function Users() {
  const { profile } = useAuth()
  const toast = useToast()
  const { refreshPending } = useOutletContext() ?? {}
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get('status') ?? 'all'
  const role = searchParams.get('role') ?? 'all'

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(null)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setUsers(await listUsers({ status, role, search: debouncedSearch }))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [status, role, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const applyUpdate = (updated) => {
    setUsers((current) =>
      current.map((user) => (user.id === updated.id ? { ...user, ...updated } : user)),
    )
  }

  const run = async (userId, action, successMessage) => {
    setWorking(userId)
    try {
      const result = await action()
      if (result?.profile) applyUpdate(result.profile)
      if (result?.deleted) setUsers((current) => current.filter((user) => user.id !== userId))
      refreshPending?.()
      toast.success(successMessage)
    } catch (actionError) {
      toast.error(actionError.message)
    } finally {
      setWorking(null)
      setConfirm(null)
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Users</h1>
        <p className="mt-1.5 text-ink-400">
          Approve new signups, manage access and grant administrator rights.
        </p>
      </div>

      {/* Filters ------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Search by name, email or company…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:max-w-xs"
          aria-label="Search users"
        />

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter('status', value)}
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

        <button
          type="button"
          onClick={() => setFilter('role', role === 'admin' ? 'all' : 'admin')}
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            role === 'admin'
              ? 'bg-brand-500/20 text-brand-200'
              : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100',
          )}
        >
          <Shield className="h-4 w-4" />
          Admins only
        </button>
      </div>

      {error && <Banner tone="danger">{error}</Banner>}

      {/* Table -------------------------------------------------------- */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={User}
          title="No users match these filters"
          description="Try clearing the search box or switching back to All."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-ink-800 text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-ink-800">
                {users.map((user) => {
                  const statusMeta = USER_STATUS[user.status] ?? USER_STATUS.pending
                  const roleMeta = USER_ROLE[user.role] ?? USER_ROLE.user
                  const isSelf = user.id === profile?.id
                  const busy = working === user.id

                  return (
                    <tr key={user.id} className="transition-colors hover:bg-ink-900/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-800 text-xs font-semibold text-ink-200">
                            {initials(user.full_name || user.email)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/users/${user.id}`}
                              className="block truncate font-medium text-white hover:text-brand-300"
                            >
                              {user.full_name || '—'}
                              {isSelf && <span className="ml-2 text-xs text-ink-500">(you)</span>}
                            </Link>
                            <p className="truncate text-xs text-ink-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={roleMeta.tone}>
                          {user.role === 'admin' && <Shield className="h-3 w-3" />}
                          {roleMeta.label}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-ink-400">
                        <span title={formatDate(user.created_at)}>{timeAgo(user.created_at)}</span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {user.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                loading={busy}
                                onClick={() =>
                                  run(user.id, () => approveUser(user.id), `${user.email} approved.`)
                                }
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={busy}
                                onClick={() =>
                                  run(user.id, () => rejectUser(user.id), `${user.email} rejected.`)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {user.status === 'approved' && !isSelf && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() =>
                                setConfirm({
                                  title: 'Suspend this account?',
                                  message: `${user.email} will lose access immediately. Their projects are kept and access can be restored later.`,
                                  confirmLabel: 'Suspend',
                                  onConfirm: () =>
                                    run(user.id, () => suspendUser(user.id), `${user.email} suspended.`),
                                })
                              }
                            >
                              Suspend
                            </Button>
                          )}

                          {(user.status === 'suspended' || user.status === 'rejected') && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={busy}
                              onClick={() =>
                                run(user.id, () => reinstateUser(user.id), `${user.email} reinstated.`)
                              }
                            >
                              Reinstate
                            </Button>
                          )}

                          {!isSelf && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() =>
                                setConfirm({
                                  title:
                                    user.role === 'admin'
                                      ? 'Remove administrator rights?'
                                      : 'Grant administrator rights?',
                                  message:
                                    user.role === 'admin'
                                      ? `${user.email} will lose access to this admin panel.`
                                      : `${user.email} will be able to approve accounts, view every project and manage other users. Granting admin also approves the account.`,
                                  confirmLabel: user.role === 'admin' ? 'Remove admin' : 'Make admin',
                                  variant: user.role === 'admin' ? 'danger' : 'primary',
                                  onConfirm: () =>
                                    run(
                                      user.id,
                                      () => setUserRole(user.id, user.role === 'admin' ? 'user' : 'admin'),
                                      `${user.email} is now ${user.role === 'admin' ? 'a standard user' : 'an administrator'}.`,
                                    ),
                                })
                              }
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}

                          {!isSelf && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              aria-label={`Delete ${user.email}`}
                              onClick={() =>
                                setConfirm({
                                  title: 'Delete this account permanently?',
                                  message: `${user.email}, their projects and every generated asset will be erased. This cannot be undone.`,
                                  confirmLabel: 'Delete permanently',
                                  onConfirm: () =>
                                    run(user.id, () => deleteUser(user.id), `${user.email} was deleted.`),
                                })
                              }
                            >
                              <Trash className="h-4 w-4 text-red-400/80" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        loading={Boolean(working)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant ?? 'danger'}
      />
    </div>
  )
}
