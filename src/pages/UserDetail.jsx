import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import {
  approveUser,
  deleteUser,
  getUser,
  listAllProjects,
  reinstateUser,
  rejectUser,
  setUserNotes,
  setUserRole,
  suspendUser,
} from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PROJECT_STATUS, USER_ROLE, USER_STATUS, formatDateTime, initials, timeAgo } from '../lib/utils'
import Button from '../components/ui/Button'
import { Textarea } from '../components/ui/Form'
import { Badge, Banner, Dot, EmptyState, LoadingScreen } from '../components/ui/Feedback'
import { ConfirmDialog } from '../components/ui/Modal'
import { ArrowLeft, Check, Layers, Shield, Trash, X } from '../components/Icons'

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { profile: currentAdmin } = useAuth()
  const { refreshPending } = useOutletContext() ?? {}

  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [userData, projectData] = await Promise.all([
        getUser(id),
        listAllProjects({ userId: id }),
      ])

      if (!userData) {
        setError('This user no longer exists.')
        return
      }

      setUser(userData)
      setNotes(userData.notes ?? '')
      setProjects(projectData)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const run = async (action, successMessage) => {
    setWorking(true)
    try {
      const result = await action()
      if (result?.profile) {
        setUser(result.profile)
        setNotes(result.profile.notes ?? '')
      }
      refreshPending?.()
      toast.success(successMessage)

      if (result?.deleted) navigate('/users', { replace: true })
    } catch (actionError) {
      toast.error(actionError.message)
    } finally {
      setWorking(false)
      setConfirm(null)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      const result = await setUserNotes(id, notes)
      if (result?.profile) setUser(result.profile)
      toast.success('Notes saved.')
    } catch (saveError) {
      toast.error(saveError.message)
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) return <LoadingScreen label="Loading account…" />

  if (error || !user) {
    return (
      <div className="mx-auto max-w-xl">
        <Banner tone="danger" title="Account unavailable">
          {error}
        </Banner>
        <Button to="/users" variant="secondary" className="mt-5">
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Button>
      </div>
    )
  }

  const statusMeta = USER_STATUS[user.status] ?? USER_STATUS.pending
  const roleMeta = USER_ROLE[user.role] ?? USER_ROLE.user
  const isSelf = user.id === currentAdmin?.id

  return (
    <div className="space-y-7">
      <Button to="/users" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="h-4 w-4" />
        Users
      </Button>

      {/* Identity ----------------------------------------------------- */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg font-bold text-white">
            {initials(user.full_name || user.email)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {user.full_name || user.email}
              </h1>
              <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
              <Badge tone={roleMeta.tone}>
                {user.role === 'admin' && <Shield className="h-3 w-3" />}
                {roleMeta.label}
              </Badge>
              {isSelf && <Badge>This is you</Badge>}
            </div>

            <p className="mt-1.5 text-ink-400">{user.email}</p>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Fact label="Company" value={user.company || '—'} />
              <Fact label="Signed up" value={formatDateTime(user.created_at)} />
              <Fact
                label="Approved"
                value={user.approved_at ? formatDateTime(user.approved_at) : 'Not yet'}
              />
              <Fact label="Projects" value={String(projects.length)} />
            </dl>
          </div>
        </div>

        {/* Actions ---------------------------------------------------- */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-ink-800 pt-5">
          {user.status === 'pending' && (
            <>
              <Button
                loading={working}
                onClick={() => run(() => approveUser(user.id), `${user.email} approved.`)}
              >
                <Check className="h-4 w-4" />
                Approve account
              </Button>
              <Button
                variant="secondary"
                disabled={working}
                onClick={() => run(() => rejectUser(user.id), `${user.email} rejected.`)}
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </>
          )}

          {user.status === 'approved' && !isSelf && (
            <Button
              variant="secondary"
              disabled={working}
              onClick={() =>
                setConfirm({
                  title: 'Suspend this account?',
                  message: `${user.email} will lose access immediately. Projects are kept and access can be restored later.`,
                  confirmLabel: 'Suspend',
                  onConfirm: () => run(() => suspendUser(user.id), `${user.email} suspended.`),
                })
              }
            >
              Suspend access
            </Button>
          )}

          {(user.status === 'suspended' || user.status === 'rejected') && (
            <Button
              variant="secondary"
              loading={working}
              onClick={() => run(() => reinstateUser(user.id), `${user.email} reinstated.`)}
            >
              Reinstate access
            </Button>
          )}

          {!isSelf && (
            <Button
              variant="outline"
              disabled={working}
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
                      () => setUserRole(user.id, user.role === 'admin' ? 'user' : 'admin'),
                      `${user.email} is now ${user.role === 'admin' ? 'a standard user' : 'an administrator'}.`,
                    ),
                })
              }
            >
              <Shield className="h-4 w-4" />
              {user.role === 'admin' ? 'Remove admin' : 'Make admin'}
            </Button>
          )}

          {!isSelf && (
            <Button
              variant="ghost"
              disabled={working}
              className="ml-auto text-red-400"
              onClick={() =>
                setConfirm({
                  title: 'Delete this account permanently?',
                  message: `${user.email}, their ${projects.length} project(s) and every generated asset will be erased. This cannot be undone.`,
                  confirmLabel: 'Delete permanently',
                  onConfirm: () => run(() => deleteUser(user.id), `${user.email} was deleted.`),
                })
              }
            >
              <Trash className="h-4 w-4" />
              Delete account
            </Button>
          )}
        </div>
      </div>

      {/* Internal notes ----------------------------------------------- */}
      <div className="card p-6">
        <h2 className="font-semibold text-white">Internal notes</h2>
        <p className="mt-1 text-sm text-ink-500">
          Visible to administrators only. Useful for recording why an account was approved,
          rejected or suspended.
        </p>

        <Textarea
          rows={4}
          className="mt-4"
          value={notes}
          maxLength={2000}
          placeholder="e.g. Verified by email on 12 March — agency client."
          onChange={(event) => setNotes(event.target.value)}
        />

        <div className="mt-3 flex justify-end">
          <Button
            variant="secondary"
            loading={savingNotes}
            disabled={notes === (user.notes ?? '')}
            onClick={handleSaveNotes}
          >
            Save notes
          </Button>
        </div>
      </div>

      {/* Projects ------------------------------------------------------ */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Projects</h2>

        {projects.length === 0 ? (
          <EmptyState icon={Layers} title="This user has no projects yet" />
        ) : (
          <div className="card divide-y divide-ink-800">
            {projects.map((project) => {
              const status = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.draft
              const assets = project.assets ?? []

              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-ink-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{project.name}</p>
                    <p className="text-sm text-ink-500">
                      created {timeAgo(project.created_at)} · {assets.length} asset
                      {assets.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Badge tone={status.tone}>
                    <Dot tone={status.tone} />
                    {status.label}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        loading={working}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant ?? 'danger'}
      />
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-1 text-ink-100">{value}</dd>
    </div>
  )
}
