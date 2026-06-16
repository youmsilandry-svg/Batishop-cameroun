'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const ADMIN_PWD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

async function sbFetch(table: string, opts: any = {}) {
  const { page = 1, perPage = 25, orderBy = 'id' } = opts
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=${orderBy}.desc&offset=${from}&limit=${perPage}`
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact',
    }
  })
  const total = parseInt(res.headers.get('content-range')?.split('/')[1] || '0')
  const data = await res.json()
  return { data: Array.isArray(data) ? data : [], total }
}

async function sbCount(table: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact', 'Range': '0-0' }
  })
  return parseInt(res.headers.get('content-range')?.split('/')[1] || '0')
}

async function sbInsert(table: string, row: any) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(row)
  })
}

async function sbUpdate(table: string, id: string, row: any) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(row)
  })
}

async function sbDelete(table: string, id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  })
}

const TABLES = [
  { name: 'produits',             emoji: '📦', label: 'Produits',    orderBy: 'nom', lien: '/admin/produits' },
  { name: 'commandes',            emoji: '🛒', label: 'Commandes',   orderBy: 'created_at', lien: '/admin/commandes' },
  { name: 'devis',                emoji: '📋', label: 'Devis',       orderBy: 'created_at', lien: '/admin/devis' },
  { name: 'partenaires_magasins', emoji: '🏪', label: 'Partenaires', orderBy: 'nom', lien: '/admin/partenaires' },
  { name: 'stocks_partenaires',   emoji: '📊', label: 'Stocks',      orderBy: 'id', lien: '/admin/stocks-admin' },
  { name: 'profils',              emoji: '👤', label: 'Clients',     orderBy: 'created_at', lien: '/admin/clients' },
]

const SKIP = ['search_vector', 'fichiers', 'lignes', 'articles']
const SKIP_IN_TABLE: Record<string, string[]> = {
  stocks_partenaires: ['partenaire_id', 'produit_id'],
}
const PRIX_COLS = ['prix', 'prix_ancien', 'total', 'prix_local']
const DATE_COLS = ['created_at', 'updated_at', 'date_livraison']
const BOOL_COLS = ['actif', 'disponible_immediat']

function fmtVal(col: string, val: any) {
  if (val === null || val === undefined) return '—'
  if (BOOL_COLS.includes(col)) return val ? '✓' : '✗'
  if (DATE_COLS.includes(col)) return new Date(val).toLocaleDateString('fr-FR')
  if (PRIX_COLS.includes(col)) return Number(val).toLocaleString('fr-FR') + ' FCFA'
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 50) + '…'
  const s = String(val)
  return s.length > 55 ? s.slice(0, 55) + '…' : s
}

const S: Record<string, any> = {
  wrap: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui,sans-serif', fontSize: 14, color: '#222' },
  side: { width: 210, background: '#1A2332', color: '#fff', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky' as const, top: 0, height: '100vh', overflowY: 'auto' as const, flexShrink: 0 },
  logo: { fontWeight: 800, fontSize: 16, padding: '4px 8px', marginBottom: 12 },
  nav: (active: boolean) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' as const, fontSize: 13, background: active ? '#C0392B' : 'transparent', color: '#fff', fontFamily: 'inherit' }),
  main: { flex: 1, padding: 24, background: '#f5f5f3', overflowY: 'auto' as const },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' },
  btn: (bg = '#C0392B') => ({ padding: '8px 16px', background: bg, color: bg === '#fff' ? '#333' : '#fff', border: bg === '#fff' ? '1px solid #ddd' : 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }),
  input: { padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  th: { padding: '9px 14px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '.06em', background: '#f9f9f7', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' as const },
  td: { padding: '9px 14px', borderBottom: '1px solid #f0f0f0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '88vh', overflow: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,.18)' },
}

export default function Admin() {
  const [auth, setAuth] = useState(false)
  useEffect(() => { if(typeof window!=='undefined' && localStorage.getItem('batishop_admin_auth')==='1') setAuth(true) }, [])
  const [pwd, setPwd] = useState('')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [active, setActive] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [cols, setCols] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [mode, setMode] = useState<'voir' | 'edit' | 'add'>('voir')
  const [saving, setSaving] = useState(false)
  const PER = 25

  const loadCounts = useCallback(async () => {
    const res: Record<string, number> = {}
    for (const t of TABLES) {
      try { res[t.name] = await sbCount(t.name) } catch { res[t.name] = 0 }
    }
    setCounts(res)
  }, [])

  const loadTable = useCallback(async (tbl: string, p = 1) => {
    setLoading(true)
    const meta = TABLES.find(t => t.name === tbl)
    try {
      const { data, total: tot } = await sbFetch(tbl, { page: p, perPage: PER, orderBy: meta?.orderBy || 'id' })
      setRows(data)
      setTotal(tot)
      if (data.length > 0) setCols(Object.keys(data[0]).filter(c => !SKIP.includes(c) && !(SKIP_IN_TABLE[tbl] || []).includes(c)))
      else setCols([])
    } catch (e) { console.error(e); setRows([]) }
    setLoading(false)
  }, [])

  useEffect(() => { if (auth) loadCounts() }, [auth, loadCounts])
  useEffect(() => { if (auth && active) { setPage(1); loadTable(active, 1) } }, [auth, active, loadTable])

  const del = async (id: string) => {
    if (!confirm('Supprimer ?')) return
    await sbDelete(active, id)
    loadTable(active, page)
    loadCounts()
  }

  const save = async () => {
    setSaving(true)
    const clean = Object.fromEntries(Object.entries(form).filter(([k]) => !['id','created_at','updated_at','search_vector'].includes(k)))
    if (mode === 'add') await sbInsert(active, clean)
    else await sbUpdate(active, form.id, clean)
    setSaving(false)
    setModal(null)
    loadTable(active, page)
    loadCounts()
  }

  const refresh = async () => { await loadCounts(); if (active) await loadTable(active, page) }

  const pages = Math.ceil(total / PER)

  // LOGIN
  if (!auth) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2ede8' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, width: 300, boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Bati<span style={{ color: '#C0392B' }}>Shop</span></div>
        <p style={{ color: '#999', fontSize: 12, marginBottom: 20 }}>Espace administrateur</p>
        <input type="password" placeholder="Mot de passe" value={pwd}
          onChange={e => setPwd(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter') { if(pwd===ADMIN_PWD){setAuth(true);if(typeof window!=='undefined')localStorage.setItem('batishop_admin_auth','1')}else alert('Incorrect') }}}
          style={{ ...S.input, marginBottom: 10 }}/>
        <button style={S.btn()} onClick={() => { if(pwd === ADMIN_PWD) { setAuth(true); if(typeof window!=='undefined') localStorage.setItem('batishop_admin_auth','1') } else alert('Mot de passe incorrect') }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          className="">
          Connexion →
        </button>
      </div>
    </div>
  )

  const meta = TABLES.find(t => t.name === active)

  return (
    <div style={S.wrap}>
      {/* SIDEBAR */}
      <aside style={S.side}>
        <div style={S.logo}>Bati<span style={{ color: '#C0392B' }}>Shop</span> Admin</div>

        <button style={S.nav(!active)} onClick={() => setActive('')}>📊 Dashboard</button>

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', padding: '10px 10px 4px', letterSpacing: '.08em' }}>Tables</div>

        {TABLES.map(t => {
          if (t.name === 'partenaires_magasins') return (
            <a key={t.name} href="/admin/partenaires"
              style={{ ...S.nav(false), textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{t.emoji}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              {(counts[t.name] || 0) > 0 && (
                <span style={{ background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '1px 7px', fontSize: 11 }}>
                  {counts[t.name] > 999 ? '999+' : counts[t.name]}
                </span>
              )}
            </a>
          )
          return (
            <button key={t.name} style={S.nav(active === t.name)} onClick={() => { if((t as any).lien) { window.location.href=(t as any).lien } else setActive(t.name) }}>
              <span>{t.emoji}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              {(counts[t.name] || 0) > 0 && (
                <span style={{ background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '1px 7px', fontSize: 11 }}>
                  {counts[t.name] > 999 ? '999+' : counts[t.name]}
                </span>
              )}
            </button>
          )
        })}

        <button style={{ ...S.nav(false), marginTop: 8, color: 'rgba(255,255,255,.4)', fontSize: 12 }} onClick={refresh}>
          🔄 Actualiser
        </button>
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,.35)', fontSize: 12, textDecoration: 'none' }}>← Voir le site</a>
        </div>
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        {!active ? (
          <div>
            <h1 style={{ margin: '0 0 20px', fontWeight: 800, fontSize: 24, color: '#1A2332' }}>Tableau de bord</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
              {TABLES.map(t => (
                <button key={t.name} onClick={() => setActive(t.name)}
                  style={{ background: '#fff', border: '2px solid #eee', borderRadius: 12, padding: '16px 14px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#C0392B')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#eee')}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{t.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: 24, color: '#C0392B' }}>{counts[t.name] ?? '…'}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1A2332' }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h1 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: '#1A2332' }}>{meta?.emoji} {meta?.label}</h1>
                <p style={{ margin: '2px 0 0', color: '#999', fontSize: 12 }}>{total} ligne{total > 1 ? 's' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.btn('#fff')} onClick={() => loadTable(active, page)}>🔄</button>
                <button style={S.btn()} onClick={() => { setForm({}); setModal({}); setMode('add') }}>+ Ajouter</button>
              </div>
            </div>

            <div style={S.card}>
              {loading ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#bbb' }}>Chargement…</div>
              ) : rows.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#bbb' }}>Aucune donnée</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{cols.map(c => <th key={c} style={S.th}>{c.replace(/_/g,' ')}</th>)}
                        <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.id || i}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}>
                          {cols.map(c => (
                            <td key={c} style={S.td} title={String(row[c] ?? '')}>
                              {c === 'id'
                                ? <span style={{ background: '#f0f0f0', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>#{i + 1 + (page-1)*PER}</span>
                                : fmtVal(c, row[c])}
                            </td>
                          ))}
                          <td style={{ ...S.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => { setModal(row); setForm(row); setMode('voir') }} style={{ ...S.btn('#f0f7ff'), color: '#1a6bb5', marginRight: 4, padding: '4px 10px' }}>👁</button>
                            <button onClick={() => { setModal(row); setForm({...row}); setMode('edit') }} style={{ ...S.btn('#fff8e8'), color: '#a06000', marginRight: 4, padding: '4px 10px' }}>✏️</button>
                            {row.id && <button onClick={() => del(row.id)} style={{ ...S.btn('#fff0f0'), color: '#b02020', padding: '4px 10px' }}>🗑</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                <button disabled={page === 1} onClick={() => { setPage(p => p-1); loadTable(active, page-1) }} style={{ ...S.btn('#fff'), opacity: page===1 ? .4 : 1 }}>← Préc</button>
                <span style={{ padding: '8px 16px', color: '#888', fontSize: 13 }}>Page {page}/{pages}</span>
                <button disabled={page === pages} onClick={() => { setPage(p => p+1); loadTable(active, page+1) }} style={{ ...S.btn('#fff'), opacity: page===pages ? .4 : 1 }}>Suiv →</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL */}
      {modal !== null && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {mode === 'voir' ? '👁 Détail' : mode === 'edit' ? '✏️ Modifier' : '+ Ajouter'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {mode === 'voir' && <button style={S.btn()} onClick={() => setMode('edit')}>Modifier</button>}
                <button style={S.btn('#fff')} onClick={() => setModal(null)}>✕</button>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              {mode === 'voir' ? (
                <div>
                  {cols.map(c => (
                    <div key={c} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10, padding: '7px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', paddingTop: 2 }}>{c.replace(/_/g,' ')}</span>
                      <span style={{ wordBreak: 'break-all', fontSize: 13 }}>{fmtVal(c, modal[c])}</span>
                    </div>
                  ))}
                  {SKIP.filter(c => modal[c] !== undefined && modal[c] !== null).map(c => (
                    <div key={c} style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 6 }}>{c}</div>
                      <pre style={{ background: '#f7f7f5', borderRadius: 8, padding: 10, fontSize: 12, overflow: 'auto', margin: 0 }}>{JSON.stringify(modal[c], null, 2)}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); save() }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cols.filter(c => !(mode === 'add' && ['id','created_at','updated_at'].includes(c))).map(c => {
                    if (['created_at','updated_at'].includes(c)) return null
                    const v = form[c]
                    return (
                      <div key={c}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{c.replace(/_/g,' ')}</label>
                        {c === 'id' ? (
                          <input disabled value={v || ''} style={{ ...S.input, background: '#f5f5f5', color: '#aaa' }}/>
                        ) : BOOL_COLS.includes(c) ? (
                          <select value={v ? 'true' : 'false'} onChange={e => setForm((f:any) => ({...f, [c]: e.target.value==='true'}))} style={S.input}>
                            <option value="true">✓ Oui</option><option value="false">✗ Non</option>
                          </select>
                        ) : typeof v === 'number' || PRIX_COLS.includes(c) ? (
                          <input type="number" value={v ?? 0} onChange={e => setForm((f:any) => ({...f, [c]: Number(e.target.value)}))} style={S.input}/>
                        ) : DATE_COLS.includes(c) ? (
                          <input type="date" value={v ? String(v).slice(0,10) : ''} onChange={e => setForm((f:any) => ({...f, [c]: e.target.value}))} style={S.input}/>
                        ) : (c.includes('description') || c.includes('note') || c.includes('adresse') || String(v||'').length > 80) ? (
                          <textarea value={v || ''} rows={3} onChange={e => setForm((f:any) => ({...f, [c]: e.target.value}))} style={{ ...S.input, resize: 'vertical' }}/>
                        ) : (
                          <input value={v || ''} onChange={e => setForm((f:any) => ({...f, [c]: e.target.value}))} style={S.input}/>
                        )}
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button type="submit" disabled={saving} style={{ ...S.btn(saving ? '#ccc' : '#C0392B'), flex: 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                      {saving ? 'Sauvegarde…' : mode === 'add' ? '+ Ajouter' : '✓ Enregistrer'}
                    </button>
                    <button type="button" onClick={() => setModal(null)} style={{ ...S.btn('#fff'), flex: 1 }}>Annuler</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
