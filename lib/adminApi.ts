import { supabase } from './supabase'

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Récupère le jeton de l'admin connecté (pour que la base sache qui écrit).
// Repli sur la clé publique si pas de session (lectures publiques uniquement).
async function adminToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || KEY
  } catch {
    return KEY
  }
}

// Appel REST authentifié en tant qu'admin (mêmes retours que l'ancienne aide api()).
export async function apiAdmin(path: string, opts: any = {}) {
  const token = await adminToken()
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
  return res.ok ? res.json().catch(() => null) : null
}

// En-têtes authentifiés admin, pour les appels fetch personnalisés (ex. dashboard).
export async function adminHeaders(extra: Record<string, string> = {}) {
  const token = await adminToken()
  return { apikey: KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...extra }
}
