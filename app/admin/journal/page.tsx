'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { apiAdmin as api } from '../../../lib/adminApi'

const S: any = {
  page: { minHeight: '100vh', background: '#F2EDE8', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' },
  side: { width: 200, background: '#1A2332', color: '#fff', padding: 16, minHeight: '100vh' },
  navbtn: (a: boolean) => ({ display: 'block', padding: '8px 10px', borderRadius: 8, fontSize: 13, color: '#fff', textDecoration: 'none', background: a ? '#C0392B' : 'transparent', marginBottom: 4 }),
  main: { flex: 1, padding: 24 },
  th: { textAlign: 'left' as const, fontSize: 11, color: '#888', textTransform: 'uppercase' as const, padding: '8px 10px', borderBottom: '2px solid #eee' },
  td: { padding: '8px 10px', borderBottom: '1px solid #f3f3f3', fontSize: 13, color: '#1A2332', verticalAlign: 'top' as const },
}

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  POST: { label: 'Création', color: '#1b5e20' },
  PATCH: { label: 'Modification', color: '#1565c0' },
  PUT: { label: 'Modification', color: '#1565c0' },
  DELETE: { label: 'Suppression', color: '#b71c1c' },
}

export default function AdminJournal() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('')

  const charger = useCallback(async () => {
    setLoading(true)
    const data = await api('admin_logs?select=*&order=created_at.desc&limit=300')
    setLogs(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  const visibles = filtre ? logs.filter(l => l.action === filtre) : logs

  return (
    <div style={S.page}>
      <aside style={S.side}>
        <div style={{ fontFamily: '"Roboto Condensed", sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 20 }}>
          Bati<span style={{ color: '#C0392B' }}>Shop</span> Admin
        </div>
        <a href="/admin" style={S.navbtn(false)}>📊 Dashboard</a>
        <a href="/admin/produits" style={S.navbtn(false)}>📦 Produits</a>
        <a href="/admin/commandes" style={S.navbtn(false)}>🛒 Commandes</a>
        <a href="/admin/devis" style={S.navbtn(false)}>📋 Devis</a>
        <a href="/admin/clients" style={S.navbtn(false)}>👥 Clients</a>
        <a href="/admin/journal" style={S.navbtn(true)}>📜 Journal</a>
      </aside>

      <main style={S.main}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: '"Roboto Condensed", sans-serif', fontWeight: 700, fontSize: 26, color: '#1A2332', margin: 0 }}>📜 Journal des actions</h1>
            <div style={{ fontSize: 13, color: '#888' }}>{logs.length} action(s) enregistrée(s) · 300 dernières</div>
          </div>
          <button onClick={charger} style={{ padding: '8px 14px', background: '#1A2332', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>↻ Rafraîchir</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[['', 'Toutes'], ['POST', 'Créations'], ['PATCH', 'Modifications'], ['DELETE', 'Suppressions']].map(([v, l]) => (
            <button key={v} onClick={() => setFiltre(v)}
              style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${filtre === v ? '#C0392B' : '#ddd'}`, background: filtre === v ? '#C0392B' : '#fff', color: filtre === v ? '#fff' : '#555', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{l}</button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 8, border: '1px solid #eee' }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#888' }}>Chargement…</div>
          ) : visibles.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#888' }}>Aucune action enregistrée pour l'instant.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Administrateur</th>
                  <th style={S.th}>Action</th>
                  <th style={S.th}>Cible</th>
                  <th style={S.th}>Détails</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map(l => {
                  const a = ACTION_LABEL[l.action] || { label: l.action, color: '#666' }
                  return (
                    <tr key={l.id}>
                      <td style={S.td}>{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                      <td style={S.td}>{l.admin_email || '—'}</td>
                      <td style={{ ...S.td, color: a.color, fontWeight: 700 }}>{a.label}</td>
                      <td style={S.td}>{l.cible}</td>
                      <td style={{ ...S.td, maxWidth: 360 }}>
                        <code style={{ fontSize: 11, color: '#666', wordBreak: 'break-all' }}>{l.details ? JSON.stringify(l.details).slice(0, 300) : '—'}</code>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
