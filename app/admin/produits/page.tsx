'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { CATEGORIES, fetchCategories } from '../../../lib/supabase'

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const PWD  = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

const api = async (path: string, opts: any = {}) => {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    ...opts,
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(opts.headers||{}) }
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

const TOUTES = { id: '', label: 'Toutes', emoji: '🏗️' }

const stockColor = (n: number) => n === 0 ? '#c62828' : n <= 10 ? '#e65100' : '#2e7d32'
const stockBg    = (n: number) => n === 0 ? '#fce8e8' : n <= 10 ? '#fff3e0' : '#e8f5e9'
const stockLabel = (n: number) => n === 0 ? '✗ Rupture' : n <= 10 ? `⚠️ ${n}` : `✓ ${n}`

const S: any = {
  btn: (bg = '#C0392B', c = '#fff') => ({ padding: '7px 14px', background: bg, color: c, border: bg === '#fff' ? '1px solid #ddd' : 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit' }),
  input: { padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  navbtn: (a: boolean) => ({ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', width:'100%', textAlign:'left' as const, fontSize:13, background: a ? '#C0392B' : 'transparent', color:'#fff', fontFamily:'inherit', textDecoration:'none' }),
}

export default function AdminProduits() {
  const [auth, setAuth]         = useState(false)
  const [pwd, setPwd]           = useState('')
  const [produits, setProduits] = useState<any[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(false)
  const [page, setPage]         = useState(1)
  const [q, setQ]               = useState('')
  const [cat, setCat]           = useState('')
  const [stockF, setStockF]     = useState('')
  const [vue, setVue]           = useState<'liste'|'grille'>('liste')

  // Panneau détail
  const [detail, setDetail]       = useState<any>(null)
  const [partenairesStock, setPartenairesStock] = useState<any[]>([])
  const [loadingDetail, setLoadingDetail]       = useState(false)
  const [ongletDetail, setOngletDetail]         = useState<'infos'|'stock'|'edit'>('infos')
  const [form, setForm]           = useState<any>({})
  const [saving, setSaving]       = useState(false)
  const [succes, setSucces]       = useState('')
  const [cats, setCats]           = useState<any[]>([TOUTES, ...CATEGORIES])

  useEffect(() => { fetchCategories().then(list => setCats([TOUTES, ...list])) }, [])

  const PER = 25

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('batishop_admin_auth') === '1') setAuth(true)
  }, [])

  const charger = useCallback(async (p = 1) => {
    setLoading(true); setPage(p)
    let url = `produits?select=*&order=nom.asc&offset=${(p-1)*PER}&limit=${PER}`
    if (cat)   url += `&categorie=eq.${cat}`
    if (q)     url += `&nom=ilike.*${encodeURIComponent(q)}*`
    if (stockF === 'rupture') url += `&stock=eq.0`
    if (stockF === 'faible')  url += `&stock=gt.0&stock=lte.10`
    if (stockF === 'ok')      url += `&stock=gt.10`
    if (stockF === 'promo')   url += `&badge=eq.promo`
    const res = await fetch(`${BASE}/rest/v1/${url}`, {
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Prefer': 'count=exact' }
    })
    setTotal(parseInt(res.headers.get('content-range')?.split('/')[1] || '0'))
    const data = await res.json().catch(() => [])
    setProduits(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [cat, q, stockF])

  useEffect(() => { if (auth) charger(1) }, [auth, cat, stockF])

  const ouvrirDetail = async (p: any) => {
    setDetail(p); setForm({ ...p }); setOngletDetail('infos'); setPartenairesStock([])
    setLoadingDetail(true)
    const stocks = await api(`stocks_partenaires?produit_id=eq.${p.id}&select=quantite,disponible_immediat,partenaires_magasins(nom,ville,quartier,telephone,statut)&order=quantite.desc`)
    setPartenairesStock(Array.isArray(stocks) ? stocks.filter((s:any) => s.partenaires_magasins?.statut === 'actif') : [])
    setLoadingDetail(false)
  }

  const sauvegarder = async () => {
    setSaving(true)
    const { id, created_at, search_vector, ...rest } = form
    await api(`produits?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(rest) })
    setProduits(prev => prev.map(x => x.id === id ? { ...x, ...rest } : x))
    setDetail((d: any) => ({ ...d, ...rest }))
    setSaving(false); setOngletDetail('infos')
    setSucces('✓ Produit modifié')
    setTimeout(() => setSucces(''), 2000)
  }

  const toggleActif = async (p: any) => {
    await api(`produits?id=eq.${p.id}`, { method: 'PATCH', body: JSON.stringify({ actif: !p.actif }) })
    setProduits(prev => prev.map(x => x.id === p.id ? { ...x, actif: !x.actif } : x))
    if (detail?.id === p.id) setDetail((d: any) => ({ ...d, actif: !d.actif }))
  }

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer ce produit définitivement ?')) return
    await api(`produits?id=eq.${id}`, { method: 'DELETE' })
    if (detail?.id === id) setDetail(null)
    charger(page)
  }

  const totalStockPartenaires = partenairesStock.reduce((s, x) => s + (x.quantite || 0), 0)
  const nbPages = Math.ceil(total / PER)

  if (!auth) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f2ede8', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:14, padding:32, width:300, boxShadow:'0 4px 24px rgba(0,0,0,.1)' }}>
        <div style={{ fontWeight:800, fontSize:22, marginBottom:16 }}>Bati<span style={{color:'#C0392B'}}>Shop</span> Admin</div>
        <input type="password" placeholder="Mot de passe" value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter') { if(pwd===PWD){setAuth(true);localStorage.setItem('batishop_admin_auth','1')}else alert('Incorrect') }}}
          style={{ ...S.input, width:'100%', marginBottom:10 }}/>
        <button style={{ ...S.btn(), width:'100%', padding:11 }}
          onClick={() => { if(pwd===PWD){setAuth(true);localStorage.setItem('batishop_admin_auth','1')}else alert('Incorrect') }}>
          Connexion →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'system-ui,sans-serif', fontSize:14, color:'#222', background:'#f5f5f3' }}>

      {/* SIDEBAR */}
      <aside style={{ width:200, background:'#1A2332', color:'#fff', padding:'14px 10px', display:'flex', flexDirection:'column', gap:2, flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        <div style={{ fontWeight:800, fontSize:16, padding:'4px 8px', marginBottom:12 }}>Bati<span style={{color:'#C0392B'}}>Shop</span> Admin</div>
        <a href="/admin"              style={S.navbtn(false) as any}>📊 Dashboard</a>
        <button                       style={S.navbtn(true)}>📦 Produits</button>
        <a href="/admin"              style={S.navbtn(false) as any}>🛒 Commandes</a>
        <a href="/admin"              style={S.navbtn(false) as any}>📋 Devis</a>
        <a href="/admin/partenaires"  style={S.navbtn(false) as any}>🏪 Partenaires</a>
        <a href="/admin"              style={S.navbtn(false) as any}>📊 Stocks</a>
        <div style={{ marginTop:'auto', paddingTop:12, borderTop:'1px solid rgba(255,255,255,.1)' }}>
          <a href="/" style={{ color:'rgba(255,255,255,.35)', fontSize:12, textDecoration:'none' }}>← Voir le site</a>
        </div>
      </aside>

      {/* LISTE */}
      <div style={{ width: detail ? 520 : undefined, flex: detail ? undefined : 1, display:'flex', flexDirection:'column', overflow:'hidden', borderRight: detail ? '1px solid #e8e8e8' : 'none', background:'#fff' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0', background:'#fff' }}>
          {succes && <div style={{ background:'#e8f5e9', border:'1px solid #a5d6a7', color:'#1b5e20', padding:'8px 14px', borderRadius:8, marginBottom:10, fontSize:13, fontWeight:600 }}>{succes}</div>}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <h1 style={{ margin:0, fontWeight:800, fontSize:20, color:'#1A2332' }}>📦 Produits</h1>
              <p style={{ margin:'2px 0 0', color:'#999', fontSize:12 }}>{total} produits · {loading ? '…' : produits.length + ' affichés'}</p>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button style={S.btn('#f0f0f0','#555')} onClick={() => setVue(v => v==='liste'?'grille':'liste')}>{vue==='liste'?'⊞':'☰'}</button>
              <button style={S.btn('#f0f0f0','#555')} onClick={() => charger(page)}>🔄</button>
              <button style={S.btn()} onClick={() => { setDetail({ _new: true }); setForm({ actif:true, stock:0, badge:'' }); setOngletDetail('edit') }}>+ Nouveau</button>
            </div>
          </div>

          {/* Recherche + filtres */}
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Chercher..." onKeyDown={e => e.key==='Enter' && charger(1)}
              style={{ ...S.input, flex:1 }}/>
            <button style={S.btn()} onClick={() => charger(1)}>Rechercher</button>
          </div>
          <div style={{ display:'flex', gap:5, marginBottom:8, flexWrap:'wrap' }}>
            {[['','Tous'],['ok','✓ Stock'],['faible','⚠️ Faible'],['rupture','✗ Rupture'],['promo','🏷 Promo']].map(([v,l]) => (
              <button key={v} onClick={() => setStockF(v)}
                style={{ padding:'4px 10px', borderRadius:20, border:`2px solid ${stockF===v?'#C0392B':'#e0e0e0'}`, background:stockF===v?'#fff0ee':'#fff', color:stockF===v?'#C0392B':'#666', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit' }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {cats.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                style={{ padding:'4px 10px', borderRadius:20, border:`2px solid ${cat===c.id?'#1A2332':'#e0e0e0'}`, background:cat===c.id?'#1A2332':'#fff', color:cat===c.id?'#fff':'#555', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:48, textAlign:'center', color:'#bbb' }}>Chargement…</div>
          ) : produits.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:'#bbb' }}>Aucun produit trouvé</div>
          ) : vue === 'liste' ? produits.map(p => (
            <div key={p.id} onClick={() => ouvrirDetail(p)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid #f5f5f5', cursor:'pointer', background: detail?.id===p.id ? '#fff8f7' : '#fff', borderLeft: detail?.id===p.id ? '3px solid #C0392B' : '3px solid transparent', transition:'all .1s' }}
              onMouseEnter={e => { if(detail?.id!==p.id)(e.currentTarget as HTMLElement).style.background='#fafafa' }}
              onMouseLeave={e => { if(detail?.id!==p.id)(e.currentTarget as HTMLElement).style.background='#fff' }}>
              {/* Image */}
              <div style={{ width:40, height:40, borderRadius:8, background:'#f0f0f0', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                {p.image_url
                  ? <img src={p.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>(e.currentTarget.style.display='none')}/>
                  : cats.find(c=>c.id===p.categorie)?.emoji||'📦'}
              </div>
              {/* Infos */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#1A2332', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {p.nom}
                  {p.badge === 'promo' && <span style={{ background:'#C0392B', color:'#fff', borderRadius:4, padding:'1px 5px', fontSize:9, fontWeight:800, marginLeft:5, verticalAlign:'middle' }}>PROMO</span>}
                  {p.badge === 'nouveau' && <span style={{ background:'#1b5e20', color:'#fff', borderRadius:4, padding:'1px 5px', fontSize:9, fontWeight:800, marginLeft:5, verticalAlign:'middle' }}>NEW</span>}
                </div>
                <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>
                  {cats.find(c=>c.id===p.categorie)?.emoji} {p.categorie} · {p.reference}
                </div>
              </div>
              {/* Prix */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontWeight:800, color:'#C0392B', fontSize:13 }}>{Number(p.prix).toLocaleString('fr-FR')} F</div>
                {p.prix_ancien && <div style={{ fontSize:10, color:'#bbb', textDecoration:'line-through' }}>{Number(p.prix_ancien).toLocaleString('fr-FR')}</div>}
              </div>
              {/* Stock BatiShop */}
              <div style={{ flexShrink:0 }}>
                <span style={{ background:stockBg(p.stock), color:stockColor(p.stock), borderRadius:20, padding:'3px 8px', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
                  {stockLabel(p.stock)}
                </span>
                <div style={{ fontSize:10, color:'#bbb', textAlign:'center', marginTop:1 }}>BatiShop</div>
              </div>
              {/* Actif toggle */}
              <button onClick={e => { e.stopPropagation(); toggleActif(p) }}
                style={{ background:p.actif?'#e8f5e9':'#fce8e8', color:p.actif?'#2e7d32':'#c62828', border:'none', borderRadius:20, padding:'3px 8px', fontSize:10, fontWeight:700, cursor:'pointer', flexShrink:0, fontFamily:'inherit' }}>
                {p.actif?'✓':'✗'}
              </button>
            </div>
          )) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10, padding:12 }}>
              {produits.map(p => (
                <div key={p.id} onClick={() => ouvrirDetail(p)} style={{ background:'#fff', border:`2px solid ${detail?.id===p.id?'#C0392B':'#eee'}`, borderRadius:10, overflow:'hidden', cursor:'pointer' }}>
                  <div style={{ height:100, background:'#f5f5f3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, position:'relative', overflow:'hidden' }}>
                    {p.image_url ? <img src={p.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>(e.currentTarget.style.display='none')}/> : cats.find(c=>c.id===p.categorie)?.emoji||'📦'}
                    <span style={{ position:'absolute', bottom:4, right:4, background:stockBg(p.stock), color:stockColor(p.stock), borderRadius:20, padding:'2px 6px', fontSize:10, fontWeight:700 }}>{stockLabel(p.stock)}</span>
                  </div>
                  <div style={{ padding:'8px 10px' }}>
                    <div style={{ fontWeight:700, fontSize:12, color:'#1A2332', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nom}</div>
                    <div style={{ fontWeight:800, fontSize:13, color:'#C0392B', marginTop:2 }}>{Number(p.prix).toLocaleString('fr-FR')} F</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {nbPages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:8, padding:12, borderTop:'1px solid #f0f0f0' }}>
            <button disabled={page===1} onClick={() => charger(page-1)} style={{ ...S.btn('#fff','#555'), opacity:page===1?.4:1 }}>←</button>
            <span style={{ padding:'7px 14px', color:'#888', fontSize:12 }}>Page {page}/{nbPages}</span>
            <button disabled={page===nbPages} onClick={() => charger(page+1)} style={{ ...S.btn('#fff','#555'), opacity:page===nbPages?.4:1 }}>→</button>
          </div>
        )}
      </div>

      {/* ===== PANNEAU DÉTAIL ===== */}
      {detail && (
        <div style={{ flex:1, overflow:'auto', background:'#f5f5f3' }}>
          {/* Header détail */}
          <div style={{ background:'#fff', padding:'16px 20px', borderBottom:'1px solid #e8e8e8', position:'sticky', top:0, zIndex:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button onClick={() => setDetail(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#aaa', padding:'0 4px' }}>✕</button>
                <span style={{ fontWeight:800, fontSize:16, color:'#1A2332' }}>{detail._new ? 'Nouveau produit' : detail.nom}</span>
              </div>
              {!detail._new && (
                <div style={{ display:'flex', gap:6 }}>
                  <button style={S.btn('#f0f0f0','#555')} onClick={() => toggleActif(detail)}>
                    {detail.actif ? 'Masquer' : 'Rendre visible'}
                  </button>
                  <button style={S.btn('#fce8e8','#c62828')} onClick={() => supprimer(detail.id)}>🗑 Supprimer</button>
                </div>
              )}
            </div>
            {/* Onglets */}
            {!detail._new && (
              <div style={{ display:'flex', gap:2, marginTop:12, background:'#f5f5f3', borderRadius:8, padding:3, width:'fit-content' }}>
                {[['infos','📋 Infos'],['stock','📦 Disponibilité'],['edit','✏️ Modifier']].map(([o,l]) => (
                  <button key={o} onClick={() => setOngletDetail(o as any)}
                    style={{ padding:'6px 14px', borderRadius:7, border:'none', cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'inherit', background:ongletDetail===o?'#C0392B':'transparent', color:ongletDetail===o?'#fff':'#888' }}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding:20 }}>
            {/* ===== ONGLET INFOS ===== */}
            {(ongletDetail === 'infos' && !detail._new) && (
              <div>
                <div style={{ display:'flex', gap:16, marginBottom:16, background:'#fff', borderRadius:12, padding:16, border:'1px solid #e8e8e8' }}>
                  <div style={{ width:100, height:100, borderRadius:12, background:'#f0f0f0', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>
                    {detail.image_url ? <img src={detail.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>(e.currentTarget.style.display='none')}/> : cats.find(c=>c.id===detail.categorie)?.emoji||'📦'}
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:18, color:'#1A2332', marginBottom:4, lineHeight:1.3 }}>{detail.nom}</div>
                    <div style={{ fontSize:12, color:'#999', marginBottom:8 }}>Réf: {detail.reference} · {cats.find(c=>c.id===detail.categorie)?.emoji} {detail.categorie}</div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:6 }}>
                      <span style={{ fontWeight:800, fontSize:22, color:'#C0392B' }}>{Number(detail.prix).toLocaleString('fr-FR')} FCFA</span>
                      <span style={{ fontSize:13, color:'#aaa' }}>/ {detail.unite}</span>
                      {detail.prix_ancien && <span style={{ fontSize:13, color:'#bbb', textDecoration:'line-through' }}>{Number(detail.prix_ancien).toLocaleString('fr-FR')}</span>}
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <span style={{ background:detail.actif?'#e8f5e9':'#fce8e8', color:detail.actif?'#2e7d32':'#c62828', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{detail.actif?'✓ Visible':'✗ Masqué'}</span>
                      {detail.badge && <span style={{ background:'#fff0ee', color:'#C0392B', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{detail.badge.toUpperCase()}</span>}
                    </div>
                  </div>
                </div>
                {detail.description && (
                  <div style={{ background:'#fff', borderRadius:12, padding:16, border:'1px solid #e8e8e8', marginBottom:12 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', marginBottom:6 }}>Description</div>
                    <p style={{ margin:0, color:'#555', lineHeight:1.7 }}>{detail.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* ===== ONGLET DISPONIBILITÉ ===== */}
            {ongletDetail === 'stock' && !detail._new && (
              <div>
                {/* Récap global */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                  <div style={{ background:'#fff', borderRadius:12, padding:16, border:'1px solid #e8e8e8', textAlign:'center' }}>
                    <div style={{ fontSize:28, fontWeight:800, color:'#C0392B' }}>{detail.stock}</div>
                    <div style={{ fontSize:12, color:'#888', marginTop:2 }}>🏭 Stock BatiShop</div>
                    <div style={{ fontSize:11, color:'#bbb' }}>Entrepôt central</div>
                  </div>
                  <div style={{ background:'#fff', borderRadius:12, padding:16, border:'1px solid #e8e8e8', textAlign:'center' }}>
                    <div style={{ fontSize:28, fontWeight:800, color:'#1b5e20' }}>{totalStockPartenaires}</div>
                    <div style={{ fontSize:12, color:'#888', marginTop:2 }}>🏪 Stock partenaires</div>
                    <div style={{ fontSize:11, color:'#bbb' }}>{partenairesStock.length} magasin{partenairesStock.length>1?'s':''}</div>
                  </div>
                  <div style={{ background:'#1A2332', borderRadius:12, padding:16, textAlign:'center' }}>
                    <div style={{ fontSize:28, fontWeight:800, color:'#D4A853' }}>{detail.stock + totalStockPartenaires}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginTop:2 }}>📊 Total disponible</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>Réseau complet</div>
                  </div>
                </div>

                {/* Modifier stock BatiShop rapidement */}
                <div style={{ background:'#fff', borderRadius:12, padding:16, border:'1px solid #e8e8e8', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#1A2332' }}>🏭 Modifier le stock BatiShop</div>
                    <div style={{ fontSize:12, color:'#888', marginTop:2 }}>Stock de l'entrepôt central BatiShop</div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <input type="number" min={0} defaultValue={detail.stock}
                      id="stock-input"
                      style={{ width:80, padding:'8px 10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:14, textAlign:'center' }}/>
                    <button style={S.btn()} onClick={async () => {
                      const val = Number((document.getElementById('stock-input') as HTMLInputElement)?.value || 0)
                      await api(`produits?id=eq.${detail.id}`, { method:'PATCH', body:JSON.stringify({ stock: val }) })
                      setDetail((d: any) => ({ ...d, stock: val }))
                      setProduits(prev => prev.map(x => x.id === detail.id ? { ...x, stock: val } : x))
                      setSucces('✓ Stock mis à jour')
                      setTimeout(() => setSucces(''), 2000)
                    }}>✓ Mettre à jour</button>
                  </div>
                </div>

                {/* Stocks partenaires */}
                <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e8e8e8', overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f0f0', fontWeight:700, fontSize:14, color:'#1A2332' }}>
                    🏪 Stock chez les partenaires
                  </div>
                  {loadingDetail ? (
                    <div style={{ padding:32, textAlign:'center', color:'#bbb' }}>Chargement…</div>
                  ) : partenairesStock.length === 0 ? (
                    <div style={{ padding:32, textAlign:'center', color:'#bbb' }}>
                      <div style={{ fontSize:24, marginBottom:8 }}>🏪</div>
                      Aucun partenaire n'a encore renseigné ce produit
                    </div>
                  ) : (
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ background:'#f9f9f7' }}>
                          {['Partenaire','Ville','Téléphone','Stock','Statut'].map(h => (
                            <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', borderBottom:'1px solid #eee' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {partenairesStock.map((s, i) => {
                          const mag = s.partenaires_magasins
                          return (
                            <tr key={i}
                              onMouseEnter={e => (e.currentTarget.style.background='#fafafa')}
                              onMouseLeave={e => (e.currentTarget.style.background='')}>
                              <td style={{ padding:'9px 14px', borderBottom:'1px solid #f5f5f5', fontWeight:700, color:'#1A2332' }}>{mag?.nom}</td>
                              <td style={{ padding:'9px 14px', borderBottom:'1px solid #f5f5f5', color:'#666' }}>📍 {mag?.ville}{mag?.quartier?` · ${mag.quartier}`:''}</td>
                              <td style={{ padding:'9px 14px', borderBottom:'1px solid #f5f5f5' }}>
                                <a href={`tel:${mag?.telephone}`} style={{ color:'#C0392B', textDecoration:'none', fontWeight:600 }}>{mag?.telephone}</a>
                              </td>
                              <td style={{ padding:'9px 14px', borderBottom:'1px solid #f5f5f5' }}>
                                <span style={{ background:stockBg(s.quantite), color:stockColor(s.quantite), borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
                                  {stockLabel(s.quantite)}
                                </span>
                              </td>
                              <td style={{ padding:'9px 14px', borderBottom:'1px solid #f5f5f5' }}>
                                <span style={{ background: s.disponible_immediat?'#e8f5e9':'#fff3e0', color: s.disponible_immediat?'#2e7d32':'#e65100', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
                                  {s.disponible_immediat ? '⚡ Immédiat' : '📅 Sur commande'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ===== ONGLET MODIFIER / NOUVEAU ===== */}
            {(ongletDetail === 'edit' || detail._new) && (
              <form onSubmit={e => { e.preventDefault(); detail._new ? (async()=>{
                const {actif,...rest}=form
                await api('produits', { method:'POST', body:JSON.stringify({...rest, actif:true}) })
                setDetail(null); charger(page)
                setSucces('✓ Produit créé')
                setTimeout(()=>setSucces(''),2000)
              })() : sauvegarder() }}
                style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { k:'nom',         l:'Nom du produit *',    full:true },
                  { k:'categorie',   l:'Catégorie *',          type:'select-cat' },
                  { k:'sous_categorie', l:'Sous-catégorie',    type:'select-souscat' },
                  { k:'reference',   l:'Référence *' },
                  { k:'prix',        l:'Prix (FCFA) *',        type:'number' },
                  { k:'prix_ancien', l:'Prix barré FCFA',      type:'number' },
                  { k:'stock',       l:'Stock BatiShop *',     type:'number' },
                  { k:'unite',       l:'Unité (sac, m², pièce)' },
                  { k:'badge',       l:'Badge',                type:'select-badge' },
                  { k:'image_url',   l:'URL image',            full:true },
                  { k:'description', l:'Description',          full:true, type:'textarea' },
                ].map(f => {
                  const v = form[f.k]
                  return (
                    <div key={f.k} style={{ gridColumn: f.full ? '1/-1' : 'span 1', background:'#fff', borderRadius:10, padding:12, border:'1px solid #e8e8e8' }}>
                      <label style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', display:'block', marginBottom:6 }}>{f.l}</label>
                      {f.type==='textarea' ? (
                        <textarea value={v||''} rows={3} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))} style={{ ...S.input, width:'100%', resize:'vertical' }}/>
                      ) : f.type==='select-cat' ? (
                        <select value={v||''} onChange={e=>setForm((p:any)=>({...p,categorie:e.target.value,sous_categorie:''}))} style={{ ...S.input, width:'100%' }}>
                          {cats.filter(c=>c.id).map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                        </select>
                      ) : f.type==='select-souscat' ? (
                        (() => {
                          const sous = cats.find((c:any)=>c.id===form.categorie)?.sous || []
                          return sous.length ? (
                            <select value={v||''} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))} style={{ ...S.input, width:'100%' }}>
                              <option value="">— Aucune —</option>
                              {sous.map((s:string)=><option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <input value={v||''} placeholder="Choisissez d'abord une catégorie" onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))} style={{ ...S.input, width:'100%' }}/>
                          )
                        })()
                      ) : f.type==='select-badge' ? (
                        <select value={v||''} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))} style={{ ...S.input, width:'100%' }}>
                          <option value="">Aucun</option>
                          <option value="nouveau">🆕 Nouveau</option>
                          <option value="promo">🏷 Promo</option>
                          <option value="solaire">☀️ Solaire</option>
                        </select>
                      ) : f.type==='number' ? (
                        <input type="number" value={v??0} onChange={e=>setForm((p:any)=>({...p,[f.k]:Number(e.target.value)}))} style={{ ...S.input, width:'100%' }}/>
                      ) : (
                        <input value={v||''} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))} style={{ ...S.input, width:'100%' }}/>
                      )}
                    </div>
                  )
                })}
                <div style={{ gridColumn:'1/-1', display:'flex', gap:10 }}>
                  <button type="submit" disabled={saving} style={{ ...S.btn(saving?'#ccc':undefined), flex:1, padding:11 }}>
                    {saving ? 'Sauvegarde…' : detail._new ? '+ Créer le produit' : '✓ Enregistrer'}
                  </button>
                  {!detail._new && <button type="button" onClick={() => setOngletDetail('infos')} style={{ ...S.btn('#fff','#555'), flex:1 }}>Annuler</button>}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
