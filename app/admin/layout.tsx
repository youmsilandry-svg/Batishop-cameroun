'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [etat, setEtat] = useState<'check' | 'login' | 'refuse' | 'ok'>('check')
  const [adminEmail, setAdminEmail] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const verifier = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      if (typeof window !== 'undefined') localStorage.removeItem('batishop_admin_auth')
      setEtat('login'); return
    }
    const { data: adm } = await supabase.from('admins').select('email').eq('email', user.email).maybeSingle()
    if (adm) {
      if (typeof window !== 'undefined') localStorage.setItem('batishop_admin_auth', '1')
      setAdminEmail(user.email || '')
      setEtat('ok')
    } else {
      if (typeof window !== 'undefined') localStorage.removeItem('batishop_admin_auth')
      setEtat('refuse')
    }
  }

  useEffect(() => {
    verifier()
    const { data: sub } = supabase.auth.onAuthStateChange(() => verifier())
    return () => sub.subscription.unsubscribe()
  }, [])

  const connexion = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pwd })
    if (error) setErr('Email ou mot de passe incorrect')
    setBusy(false)
    // onAuthStateChange relance verifier()
  }

  const deconnexion = async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') localStorage.removeItem('batishop_admin_auth')
    setEtat('login')
  }

  // Déconnexion automatique après inactivité (et au réveil de l'ordinateur)
  useEffect(() => {
    if (etat !== 'ok') return
    const TIMEOUT = 30 * 60 * 1000 // 30 minutes — ajuste si besoin
    let last = Date.now()
    const reset = () => { last = Date.now() }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    const check = () => { if (Date.now() - last > TIMEOUT) deconnexion() }
    const id = window.setInterval(check, 30 * 1000)
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [etat])

  if (etat === 'ok') return (
    <>
      <div style={{ position: 'fixed', top: 10, right: 12, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #eee', borderRadius: 999, padding: '6px 8px 6px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <span style={{ fontSize: 12, color: '#888', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={adminEmail}>{adminEmail}</span>
        <button onClick={deconnexion} style={{ background: '#C0392B', color: '#fff', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Déconnexion</button>
      </div>
      {children}
    </>
  )

  const wrap: React.CSSProperties = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2EDE8', padding: 16, fontFamily: 'Inter, system-ui, sans-serif' }
  const card: React.CSSProperties = { width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }
  const input: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }
  const btn: React.CSSProperties = { width: '100%', padding: '12px', background: busy ? '#ccc' : '#C0392B', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: '"Roboto Condensed", sans-serif', fontWeight: 700, fontSize: 26, color: '#1A2332' }}>
            Bati<span style={{ color: '#C0392B' }}>Shop</span> · Admin
          </div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Espace réservé à l'administration</div>
        </div>

        {etat === 'check' && <div style={{ textAlign: 'center', color: '#888', fontSize: 14, padding: 20 }}>Vérification…</div>}

        {etat === 'refuse' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fde8e8', color: '#b91c1c', borderRadius: 10, padding: '12px 14px', fontSize: 14, marginBottom: 16 }}>
              ⛔ Ce compte n'a pas les droits d'administration.
            </div>
            <button onClick={deconnexion} style={{ ...btn, background: '#1A2332' }}>Se déconnecter</button>
          </div>
        )}

        {etat === 'login' && (
          <form onSubmit={connexion}>
            {err && <div style={{ background: '#fde8e8', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>⚠️ {err}</div>}
            <input style={input} type="email" placeholder="Email administrateur" value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={input} type="password" placeholder="Mot de passe" value={pwd} onChange={e => setPwd(e.target.value)} required />
            <button type="submit" style={btn} disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
