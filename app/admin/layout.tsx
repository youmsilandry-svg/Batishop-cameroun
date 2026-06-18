'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const ROTATION_JOURS = 90 // rappel de changement de mot de passe (≈ 3 mois)
const IDLE_MS = 10 * 60 * 1000          // déconnexion après 10 min d'inactivité
const MAX_SESSION_MS = 8 * 60 * 60 * 1000 // durée max d'une session : 8 h
const CHECK_MS = 15 * 1000              // fréquence de vérification
const LS_LAST = 'admin_last_activity'
const LS_START = 'admin_session_start'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [etat, setEtat] = useState<'check' | 'login' | 'refuse' | 'ok'>('check')
  const [adminEmail, setAdminEmail] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [needRotation, setNeedRotation] = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [newPwd2, setNewPwd2] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState(false)

  const verifier = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      if (typeof window !== 'undefined') localStorage.removeItem('batishop_admin_auth')
      setEtat('login'); return
    }
    const { data: adm } = await supabase.from('admins').select('email, password_changed_at').eq('email', user.email).maybeSingle()
    if (adm) {
      // Session périmée : revenu après fermeture/veille au-delà de l'inactivité, ou session trop ancienne
      if (typeof window !== 'undefined') {
        const last = Number(localStorage.getItem(LS_LAST) || 0)
        const start = Number(localStorage.getItem(LS_START) || 0)
        const now = Date.now()
        if ((last && now - last > IDLE_MS) || (start && now - start > MAX_SESSION_MS)) {
          await supabase.auth.signOut()
          localStorage.removeItem('batishop_admin_auth')
          localStorage.removeItem(LS_LAST); localStorage.removeItem(LS_START)
          setEtat('login'); return
        }
      }
      if (typeof window !== 'undefined') localStorage.setItem('batishop_admin_auth', '1')
      setAdminEmail(user.email || '')
      const ref = adm.password_changed_at ? new Date(adm.password_changed_at).getTime() : 0
      setNeedRotation(!ref || (Date.now() - ref) > ROTATION_JOURS * 24 * 60 * 60 * 1000)
      setEtat('ok')
    } else {
      if (typeof window !== 'undefined') localStorage.removeItem('batishop_admin_auth')
      setEtat('refuse')
    }
  }

  useEffect(() => {
    verifier()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
        const now = String(Date.now())
        localStorage.setItem(LS_LAST, now)
        localStorage.setItem(LS_START, now)
      }
      verifier()
    })
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('batishop_admin_auth')
      localStorage.removeItem(LS_LAST)
      localStorage.removeItem(LS_START)
    }
    setEtat('login')
  }

  const changerMdp = async () => {
    setPwdMsg('')
    if (newPwd.length < 8) { setPwdMsg('8 caractères minimum'); return }
    if (newPwd !== newPwd2) { setPwdMsg('Les deux mots de passe ne correspondent pas'); return }
    setPwdBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) { setPwdMsg('Erreur : ' + error.message); setPwdBusy(false); return }
    await supabase.from('admins').update({ password_changed_at: new Date().toISOString() }).eq('email', adminEmail)
    setPwdMsg('✓ Mot de passe mis à jour')
    setNewPwd(''); setNewPwd2(''); setNeedRotation(false); setPwdBusy(false)
    setTimeout(() => { setShowChangePwd(false); setPwdMsg('') }, 1500)
  }

  // Déconnexion automatique : inactivité 10 min, réveil de veille, durée max de session.
  useEffect(() => {
    if (etat !== 'ok') return
    if (typeof window === 'undefined') return
    const now0 = Date.now()
    if (!localStorage.getItem(LS_START)) localStorage.setItem(LS_START, String(now0))
    localStorage.setItem(LS_LAST, String(now0))

    let lastWrite = now0
    const mark = () => {
      const now = Date.now()
      if (now - lastWrite > 5000) { localStorage.setItem(LS_LAST, String(now)); lastWrite = now }
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, mark, { passive: true }))

    const check = () => {
      const now = Date.now()
      const last = Number(localStorage.getItem(LS_LAST) || now)
      const start = Number(localStorage.getItem(LS_START) || now)
      if (now - last > IDLE_MS || now - start > MAX_SESSION_MS) {
        deconnexion()
      }
    }
    const id = window.setInterval(check, CHECK_MS)
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', check)

    return () => {
      events.forEach(e => window.removeEventListener(e, mark))
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', check)
    }
  }, [etat])

  if (etat === 'ok') return (
    <>
      <div style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 9999, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {menuOuvert && (
          <div style={{ position: 'absolute', bottom: 52, left: 0, width: 240, background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f3f3' }}>
              <div style={{ fontSize: 11, color: '#999' }}>Connecté en tant que</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={adminEmail}>{adminEmail}</div>
            </div>
            {needRotation && (
              <div style={{ padding: '10px 16px', background: '#fff8e1', fontSize: 12, color: '#8a6d00', borderBottom: '1px solid #f3f3f3' }}>
                🔒 Mot de passe &gt; 3 mois — à changer
              </div>
            )}
            <button onClick={() => { setShowChangePwd(true); setMenuOuvert(false); setPwdMsg('') }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', background: 'none', border: 'none', fontSize: 13, color: '#1A2332', cursor: 'pointer' }}>🔑 Changer le mot de passe</button>
            <Link href="/admin/journal" onClick={() => setMenuOuvert(false)}
              style={{ display: 'block', padding: '11px 16px', fontSize: 13, color: '#1A2332', textDecoration: 'none' }}>📜 Journal des actions</Link>
            <button onClick={deconnexion}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', background: 'none', border: 'none', borderTop: '1px solid #f3f3f3', fontSize: 13, fontWeight: 700, color: '#C0392B', cursor: 'pointer' }}>🚪 Déconnexion</button>
          </div>
        )}
        <button onClick={() => setMenuOuvert(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: needRotation ? '#fff8e1' : '#fff', border: `1px solid ${needRotation ? '#ffe082' : '#eee'}`, borderRadius: 999, padding: '8px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.12)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#1A2332', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
            {(adminEmail[0] || 'A').toUpperCase()}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A2332', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminEmail}</span>
          <span style={{ fontSize: 11, color: '#999', transform: menuOuvert ? 'rotate(180deg)' : 'none' }}>▲</span>
        </button>
      </div>

      {showChangePwd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1A2332', marginBottom: 14 }}>Changer le mot de passe</div>
            {pwdMsg && <div style={{ background: pwdMsg.startsWith('✓') ? '#e7f6e7' : '#fde8e8', color: pwdMsg.startsWith('✓') ? '#15803d' : '#b91c1c', borderRadius: 10, padding: '9px 12px', fontSize: 13, marginBottom: 12 }}>{pwdMsg}</div>}
            <input type="password" placeholder="Nouveau mot de passe (8+ caractères)" value={newPwd} onChange={e => setNewPwd(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
            <input type="password" placeholder="Confirmer le nouveau mot de passe" value={newPwd2} onChange={e => setNewPwd2(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowChangePwd(false); setPwdMsg(''); setNewPwd(''); setNewPwd2('') }} style={{ flex: 1, padding: '11px', background: '#eee', color: '#555', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={changerMdp} disabled={pwdBusy} style={{ flex: 1, padding: '11px', background: pwdBusy ? '#ccc' : '#C0392B', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: pwdBusy ? 'default' : 'pointer' }}>{pwdBusy ? '…' : 'Valider'}</button>
            </div>
          </div>
        </div>
      )}

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
