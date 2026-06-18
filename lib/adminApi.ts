import { supabase } from './supabase'

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Jeton de l'admin connecté (pour que la base sache QUI écrit). Repli sur la clé publique.
async function adminToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || KEY
  } catch {
    return KEY
  }
}

// Journalise une action admin (qui/quoi/quand). L'email est rempli côté base depuis le jeton.
export async function logAdmin(action: string, cible: string, details?: any) {
  try {
    const token = await adminToken()
    if (token === KEY) return // pas d'admin connecté → on ne journalise pas
    await fetch(`${BASE}/rest/v1/admin_logs`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ action, cible, details: details ?? null }),
    })
  } catch { /* la journalisation ne doit jamais bloquer l'action */ }
}

// Appel REST authentifié admin (mêmes retours que l'ancienne aide api()).
// Journalise automatiquement les écritures (POST/PATCH/PUT/DELETE).
export async function apiAdmin(path: string, opts: any = {}) {
  const token = await adminToken()
  const method = (opts.method || 'GET').toUpperCase()
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(opts.headers || {}),
    },
  })
  if (res.ok && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && !path.startsWith('admin_logs')) {
    let body: any = null
    try { body = opts.body ? JSON.parse(opts.body) : null } catch {}
    logAdmin(method, path.split('?')[0], { path, body })
  }
  return res.ok ? res.json().catch(() => null) : null
}

// En-têtes authentifiés admin, pour les fetch personnalisés (ex. dashboard).
export async function adminHeaders(extra: Record<string, string> = {}) {
  const token = await adminToken()
  return { apikey: KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...extra }
}
