'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export default function ConnexionPartenaire() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('batishop_partenaire_token')
    if (!token) return
    // Ne rediriger que si le token est encore valide (sinon on le nettoie et on reste sur le formulaire)
    fetch(`${URL}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.ok) router.push('/partenaires/mon-espace')
        else {
          localStorage.removeItem('batishop_partenaire_token')
          localStorage.removeItem('batishop_partenaire_user')
        }
      })
      .catch(() => {})
  }, [router])

  const seConnecter = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErreur('')
    try {
      const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd })
      })
      const data = await res.json()
      if (data.access_token) {
        localStorage.setItem('batishop_partenaire_token', data.access_token)
        localStorage.setItem('batishop_partenaire_user', JSON.stringify(data.user))
        router.push('/partenaires/mon-espace')
      } else {
        setErreur(data.error_description || data.msg || 'Email ou mot de passe incorrect')
        setLoading(false)
      }
    } catch {
      setErreur('Connexion impossible. Vérifiez votre réseau et réessayez.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2ede8', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: 340, boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: '#1A2332', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>🏪</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#1A2332' }}>Espace Partenaire</div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>BatiShop Cameroun</div>
        </div>
        {erreur && <div style={{ background: '#fce8e8', border: '1px solid #f5c2c2', color: '#c62828', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>⚠️ {erreur}</div>}
        <form onSubmit={seConnecter} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 4 }}>EMAIL</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const }}/>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 4 }}>MOT DE PASSE</label>
            <input required type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const }}/>
          </div>
          <button type="submit" disabled={loading}
            style={{ padding: '11px 0', background: loading ? '#ccc' : '#C0392B', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
            {loading ? 'Connexion…' : 'Accéder à mon espace →'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#bbb' }}>
          Pas encore partenaire ?{' '}
          <a href="/partenaires" style={{ color: '#C0392B', textDecoration: 'none', fontWeight: 600 }}>Postuler ici</a>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#bbb' }}>
          Problème ? <a href="tel:+237600000000" style={{ color: '#C0392B', textDecoration: 'none' }}>+237 6XX XXX XXX</a>
        </div>
      </div>
    </div>
  )
}
