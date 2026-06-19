'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const PWD  = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

const api = async (path: string, opts: any = {}) => {
  const res = await fetch(`${BASE}/rest/v1/${path}`, { ...opts, headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(opts.headers || {}) } })
  return res.ok ? res.json().catch(() => null) : null
}

const S: any = {
  btn: (bg = '#C0392B', c = '#fff') => ({ padding: '7px 14px', background: bg, color: c, border: bg === '#fff' ? '1px solid #ddd' : 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }),
  inp: { padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const },
  lbl: { fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6, marginTop: 12 },
}

const VIDE: any = { emoji: '💡', titre: '', intro: '', pointsTexte: '', ancre: '', ordre: 0, visible: true }

export default function AdminConseils() {
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd]   = useState('')
  const [liste, setListe] = useState<any[]>([])
  const [edit, setEdit] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('batishop_admin_auth') === '1') setAuth(true)
  }, [])

  const charger = useCallback(async () => {
    const d = await api('conseils?select=*&order=ordre.asc')
    setListe(Array.isArray(d) ? d : [])
  }, [])
  useEffect(() => { if (auth) charger() }, [auth, charger])

  const connexion = () => {
    if (pwd === PWD) { localStorage.setItem('batishop_admin_auth', '1'); setAuth(true) }
    else alert('Mot de passe incorrect')
  }

  const nouveau = () => setEdit({ ...VIDE, ordre: liste.length ? Math.max(...liste.map(c => c.ordre || 0)) + 1 : 1 })
  const editer  = (c: any) => setEdit({
    id: c.id, emoji: c.emoji || '💡', titre: c.titre || '', intro: c.intro || '',
    pointsTexte: (Array.isArray(c.points) ? c.points : []).join('\n'),
    ancre: c.ancre || '', ordre: c.ordre || 0, visible: c.visible !== false,
  })

  const enregistrer = async () => {
    if (!edit.titre.trim()) { alert('Le titre est obligatoire.'); return }
    setSaving(true)
    const points = edit.pointsTexte.split('\n').map((s: string) => s.trim()).filter(Boolean)
    const body = {
      emoji: edit.emoji || '💡', titre: edit.titre.trim(), intro: edit.intro.trim() || null,
      points, ancre: edit.ancre.trim() || null, ordre: Number(edit.ordre) || 0, visible: !!edit.visible,
    }
    const ok = edit.id
      ? await api(`conseils?id=eq.${edit.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      : await api('conseils', { method: 'POST', body: JSON.stringify(body) })
    setSaving(false)
    if (ok === null) { alert("Échec de l'enregistrement. Réessayez."); return }
    setEdit(null); setMsg('✓ Conseil enregistré'); setTimeout(() => setMsg(''), 2500); charger()
  }

  const supprimer = async (c: any) => {
    if (!confirm(`Supprimer le conseil « ${c.titre} » ? Cette action est irréversible.`)) return
    await api(`conseils?id=eq.${c.id}`, { method: 'DELETE' })
    charger()
  }
  const toggleVisible = async (c: any) => {
    await api(`conseils?id=eq.${c.id}`, { method: 'PATCH', body: JSON.stringify({ visible: !c.visible }) })
    charger()
  }

  if (!auth) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f3', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: '#fff', padding: 28, borderRadius: 14, border: '1px solid #e8e8e8', width: 320 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#1A2332', marginBottom: 4 }}>Admin — Conseils</div>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>Connexion requise</div>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Mot de passe"
          onKeyDown={e => e.key === 'Enter' && connexion()} style={{ ...S.inp, marginBottom: 12 }} />
        <button style={{ ...S.btn(), width: '100%', padding: 11 }} onClick={connexion}>Connexion →</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f3', fontFamily: 'system-ui,sans-serif', color: '#222', padding: 20 }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#1A2332' }}>💡 Conseils &amp; idées</div>
            <a href="/admin" style={{ fontSize: 12, color: '#C0392B', textDecoration: 'none' }}>← Retour admin</a>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {msg && <span style={{ fontSize: 13, color: '#1b5e20', fontWeight: 600 }}>{msg}</span>}
            <button style={S.btn('#1b5e20')} onClick={nouveau}>+ Nouveau conseil</button>
          </div>
        </div>

        {/* Formulaire d'édition */}
        {edit && (
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: 18, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1A2332', marginBottom: 4 }}>
              {edit.id ? 'Modifier le conseil' : 'Nouveau conseil'}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 90 }}>
                <label style={S.lbl}>Emoji</label>
                <input value={edit.emoji} onChange={e => setEdit({ ...edit, emoji: e.target.value })} style={S.inp} maxLength={4} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={S.lbl}>Titre *</label>
                <input value={edit.titre} onChange={e => setEdit({ ...edit, titre: e.target.value })} style={S.inp} placeholder="Ex: Bien préparer un mur avant peinture" />
              </div>
            </div>

            <label style={S.lbl}>Intro (phrase d'accroche)</label>
            <input value={edit.intro} onChange={e => setEdit({ ...edit, intro: e.target.value })} style={S.inp} placeholder="Les étapes pour une peinture qui tient dans le temps." />

            <label style={S.lbl}>Points — un conseil par ligne</label>
            <textarea value={edit.pointsTexte} onChange={e => setEdit({ ...edit, pointsTexte: e.target.value })}
              rows={6} style={{ ...S.inp, resize: 'vertical', lineHeight: 1.5 }}
              placeholder={"Nettoyez et dépoussiérez le mur.\nAppliquez une sous-couche adaptée.\nComptez environ 1 litre pour 10 m² par couche."} />

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ width: 160 }}>
                <label style={S.lbl}>Ancre (lien #)</label>
                <input value={edit.ancre} onChange={e => setEdit({ ...edit, ancre: e.target.value })} style={S.inp} placeholder="peinture" />
              </div>
              <div style={{ width: 110 }}>
                <label style={S.lbl}>Ordre</label>
                <input type="number" value={edit.ordre} onChange={e => setEdit({ ...edit, ordre: e.target.value })} style={S.inp} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#444', marginBottom: 8 }}>
                <input type="checkbox" checked={edit.visible} onChange={e => setEdit({ ...edit, visible: e.target.checked })} />
                Visible sur le site
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={S.btn()} onClick={enregistrer} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
              <button style={S.btn('#fff', '#333')} onClick={() => setEdit(null)}>Annuler</button>
            </div>
          </div>
        )}

        {/* Liste des conseils */}
        {liste.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8e8e8', padding: 40, textAlign: 'center', color: '#bbb' }}>
            Aucun conseil pour le moment. Cliquez sur « + Nouveau conseil ».
          </div>
        ) : liste.map(c => (
          <div key={c.id} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: 14, marginBottom: 10, opacity: c.visible ? 1 : 0.55 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#1A2332', fontSize: 15 }}>
                  <span style={{ marginRight: 6 }}>{c.emoji}</span>{c.titre}
                  <span style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginLeft: 8 }}>#{c.ancre || '—'} · ordre {c.ordre}</span>
                </div>
                {c.intro && <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{c.intro}</div>}
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{Array.isArray(c.points) ? c.points.length : 0} point(s)</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                <button onClick={() => toggleVisible(c)} style={S.btn(c.visible ? '#e8f5e9' : '#f0f0f0', c.visible ? '#1b5e20' : '#888')}>{c.visible ? '✓ Visible' : 'Masqué'}</button>
                <button onClick={() => editer(c)} style={S.btn('#fff', '#333')}>✏️ Modifier</button>
                <button onClick={() => supprimer(c)} style={S.btn('#fff', '#b71c1c')}>🗑 Supprimer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
