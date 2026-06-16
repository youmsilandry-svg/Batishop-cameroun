'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const PWD  = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

const api = async (path: string, opts: any = {}) => {
  const res = await fetch(`${BASE}/rest/v1/${path}`, { ...opts, headers: {'apikey':KEY,'Authorization':`Bearer ${KEY}`,'Content-Type':'application/json',...(opts.headers||{})}})
  return res.ok ? res.json().catch(()=>null) : null
}

const S: any = {
  btn: (bg='#C0392B',c='#fff') => ({ padding:'7px 14px', background:bg, color:c, border:bg==='#fff'?'1px solid #ddd':'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'inherit' }),
  navbtn: (a:boolean) => ({ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', width:'100%', textAlign:'left' as const, fontSize:13, background:a?'#C0392B':'transparent', color:'#fff', fontFamily:'inherit', textDecoration:'none' }),
  th: { padding:'9px 14px', textAlign:'left' as const, fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase' as const, letterSpacing:'.06em', background:'#f9f9f7', borderBottom:'1px solid #eee', whiteSpace:'nowrap' as const },
  td: { padding:'9px 14px', borderBottom:'1px solid #f0f0f0' },
}

const fmtPrix = (n:any) => (n===null||n===undefined) ? '—' : Number(n).toLocaleString('fr-FR')+' FCFA'

export default function AdminStocks() {
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd]   = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  useEffect(()=>{ if(typeof window!=='undefined'&&localStorage.getItem('batishop_admin_auth')==='1') setAuth(true) },[])

  const charger = useCallback(async () => {
    setLoading(true)
    const select = '*,produits(nom,reference,unite),partenaires_magasins(nom,ville)'
    const data = await api(`stocks_partenaires?select=${encodeURIComponent(select)}&order=quantite.desc`)
    setRows(Array.isArray(data)?data:[])
    setLoading(false)
  }, [])

  useEffect(()=>{ if(auth) charger() },[auth, charger])

  const filtres = rows.filter(r => {
    if(!q) return true
    const t = q.toLowerCase()
    return (r.produits?.nom||'').toLowerCase().includes(t)
      || (r.partenaires_magasins?.nom||'').toLowerCase().includes(t)
      || (r.partenaires_magasins?.ville||'').toLowerCase().includes(t)
  })

  if(!auth) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f2ede8',fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:'#fff',borderRadius:14,padding:32,width:300}}>
        <div style={{fontWeight:800,fontSize:22,marginBottom:16}}>Bati<span style={{color:'#C0392B'}}>Shop</span></div>
        <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Mot de passe"
          onKeyDown={e=>{if(e.key==='Enter'&&pwd===PWD){setAuth(true);localStorage.setItem('batishop_admin_auth','1')}}}
          style={{padding:'8px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13,width:'100%',boxSizing:'border-box' as const,marginBottom:10}}/>
        <button style={{...S.btn(),width:'100%',padding:11}} onClick={()=>{if(pwd===PWD){setAuth(true);localStorage.setItem('batishop_admin_auth','1')}else alert('Incorrect')}}>Connexion →</button>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'system-ui,sans-serif',fontSize:14,color:'#222',background:'#f5f5f3'}}>
      {/* SIDEBAR */}
      <aside style={{width:200,background:'#1A2332',color:'#fff',padding:'14px 10px',display:'flex',flexDirection:'column',gap:2,flexShrink:0,position:'sticky',top:0,height:'100vh',overflowY:'auto'}}>
        <div style={{fontWeight:800,fontSize:16,padding:'4px 8px',marginBottom:12}}>Bati<span style={{color:'#C0392B'}}>Shop</span> Admin</div>
        <a href="/admin"              style={S.navbtn(false) as any}>📊 Dashboard</a>
        <a href="/admin/produits"     style={S.navbtn(false) as any}>📦 Produits</a>
        <a href="/admin/commandes"    style={S.navbtn(false) as any}>🛒 Commandes</a>
        <a href="/admin/devis"        style={S.navbtn(false) as any}>📋 Devis</a>
        <a href="/admin/partenaires"  style={S.navbtn(false) as any}>🏪 Partenaires</a>
        <button                       style={S.navbtn(true)}>📊 Stocks</button>
        <a href="/admin/clients"      style={S.navbtn(false) as any}>👤 Clients</a>
        <div style={{marginTop:'auto',paddingTop:12,borderTop:'1px solid rgba(255,255,255,.1)'}}>
          <a href="/" style={{color:'rgba(255,255,255,.35)',fontSize:12,textDecoration:'none'}}>← Voir le site</a>
        </div>
      </aside>

      {/* CONTENU */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'16px 24px',borderBottom:'1px solid #f0f0f0',background:'#fff'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div>
              <h1 style={{margin:0,fontWeight:800,fontSize:20,color:'#1A2332'}}>📊 Stocks partenaires</h1>
              <p style={{margin:'2px 0 0',color:'#999',fontSize:12}}>{rows.length} ligne(s) de stock</p>
            </div>
            <button style={S.btn('#f0f0f0','#555')} onClick={charger}>🔄</button>
          </div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Produit, magasin ou ville…"
            style={{padding:'8px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13,width:'100%',maxWidth:400,boxSizing:'border-box' as const}}/>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:24}}>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #e8e8e8',overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  <th style={S.th}>Produit</th>
                  <th style={S.th}>Magasin</th>
                  <th style={S.th}>Ville</th>
                  <th style={S.th}>Quantité</th>
                  <th style={S.th}>Prix local</th>
                  <th style={S.th}>Dispo</th>
                </tr>
              </thead>
              <tbody>
                {loading?<tr><td colSpan={6} style={{padding:48,textAlign:'center',color:'#bbb'}}>Chargement…</td></tr>
                :filtres.length===0?<tr><td colSpan={6} style={{padding:48,textAlign:'center',color:'#bbb'}}>Aucun stock</td></tr>
                :filtres.map(r=>(
                  <tr key={r.id}>
                    <td style={S.td}>
                      <div style={{fontWeight:600,color:'#1A2332'}}>{r.produits?.nom||'—'}</div>
                      <div style={{fontSize:11,color:'#aaa'}}>{r.produits?.reference||''}</div>
                    </td>
                    <td style={S.td}>{r.partenaires_magasins?.nom||'—'}</td>
                    <td style={S.td}>{r.partenaires_magasins?.ville||'—'}</td>
                    <td style={S.td}>
                      <span style={{fontWeight:700,color:(r.quantite||0)>0?'#1b5e20':'#b71c1c'}}>
                        {r.quantite ?? 0} {r.produits?.unite||''}
                      </span>
                    </td>
                    <td style={S.td}>{fmtPrix(r.prix_local)}</td>
                    <td style={S.td}>{r.disponible_immediat?'✓':'✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
