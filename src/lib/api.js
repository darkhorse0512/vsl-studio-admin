import { supabase } from './supabase'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Invoke an edge function and surface its JSON error message. */
export async function callFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    let message = error.message || 'Request failed'
    let code

    const response = error.context
    if (response && typeof response.json === 'function') {
      try {
        const payload = await response.json()
        if (payload?.error) message = payload.error
        if (payload?.code) code = payload.code
      } catch {
        /* not JSON */
      }
    }

    const thrown = new Error(message)
    thrown.code = code
    throw thrown
  }

  return data
}

function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

const PROFILE_COLUMNS =
  'id, email, full_name, company, role, status, approved_at, approved_by, notes, created_at, updated_at'

/* ------------------------------------------------------------------ */
/* Session profile                                                     */
/* ------------------------------------------------------------------ */

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export async function fetchStats() {
  return unwrap(await supabase.rpc('admin_dashboard_stats'))
}


/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export async function listUsers({ status = 'all', role = 'all', search = '' } = {}) {
  let query = supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(500)

  if (status !== 'all') query = query.eq('status', status)
  if (role !== 'all') query = query.eq('role', role)

  const term = search.trim()
  if (term) {
    const escaped = term.replace(/[%,()]/g, '')
    query = query.or(`email.ilike.%${escaped}%,full_name.ilike.%${escaped}%,company.ilike.%${escaped}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getUser(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Every privileged mutation goes through the admin-users edge function so it
 * can be validated (last-admin protection, self-action guards) and written
 * to the audit log with the service role.
 */
export function adminAction(action, userId, payload = {}) {
  return callFunction('admin-users', { action, userId, ...payload })
}

export const approveUser = (userId) => adminAction('approve', userId)
export const rejectUser = (userId) => adminAction('reject', userId)
export const suspendUser = (userId) => adminAction('suspend', userId)
export const reinstateUser = (userId) => adminAction('reinstate', userId)
export const setUserRole = (userId, role) => adminAction('set_role', userId, { role })
export const setUserNotes = (userId, notes) => adminAction('set_notes', userId, { notes })
export const deleteUser = (userId) => adminAction('delete_user', userId)

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

const PROJECT_COLUMNS =
  'id, user_id, name, status, source_type, source_filename, analyzed_at, error_message, created_at, updated_at'

const OWNER_EMBED = 'owner:profiles!projects_user_id_profiles_fkey(id, email, full_name, status)'

export async function listAllProjects({ status = 'all', search = '', userId = null } = {}) {
  let query = supabase
    .from('projects')
    .select(`${PROJECT_COLUMNS}, ${OWNER_EMBED}, assets(id, type, version)`)
    .order('created_at', { ascending: false })
    .limit(300)

  if (status !== 'all') query = query.eq('status', status)
  if (userId) query = query.eq('user_id', userId)

  const term = search.trim()
  if (term) {
    const escaped = term.replace(/[%,()]/g, '')
    query = query.ilike('name', `%${escaped}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProjectDetail(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `id, user_id, name, status, source_type, source_filename, vsl_text, analysis, analysis_model, analyzed_at, error_message, generation_settings, created_at, updated_at, ${OWNER_EMBED}`,
    )
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function listProjectAssets(projectId) {
  const { data, error } = await supabase
    .from('assets')
    .select('id, project_id, type, version, title, code, model, created_at')
    .eq('project_id', projectId)
    .order('version', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function deleteProjectAsAdmin(projectId) {
  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) throw new Error(error.message)
}

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

export async function listAuditLogs(limit = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, actor_id, actor_email, action, target_type, target_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}
