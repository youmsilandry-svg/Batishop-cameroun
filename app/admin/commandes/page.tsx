'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { apiAdmin as api } from '../../../lib/adminApi'

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const PWD  = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'


const STATUTS = [
  { id: '', label: 'Toutes', color: '#666' },
  { id: 'en_attente',   label: '⏳ En attente',   bg: '#fff8e1', color: '#e65100' },
  { id: 'confirmee',    label: '✓ Confirmée',      bg: '#e3f2fd', color: '#1565c0' },
  { id: 'en_livraison', label: '🚚 En livraison',  bg: '#f3e5f5', color: '#6a1b9a' },
  { id: 'livree',       label: '✅ Livrée',        bg: '#e8f5e9', color: '#1b5e20' },
  { id: 'annulee',      label: '❌ Annulée',       bg: '#fce8e8', color: '#b71c1c' },
]

const ETAPES = ['en_attente','confirmee','en_livraison','livree']

const S: any = {
  btn: (bg='#C0392B',c='#fff') => ({ padding:'7px 14px', background:bg, color:c, border:bg==='#fff'?'1px solid #ddd':'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'inherit' }),
  navbtn: (a:boolean) => ({ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', width:'100%', textAlign:'left' as const, fontSize:13, background:a?'#C0392B':'transparent', color:'#fff', fontFamily:'inherit', textDecoration:'none' }),
  input: { padding:'8px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' as const, fontFamily:'inherit' },
}

export default function AdminCommandes() {
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd] = useState('')
  const [commandes, setCommandes] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [statutF, setStatutF] = useState('')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<any>(null)
  const [sousCmds, setSousCmds] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [succes, setSucces] = useState('')
  const PER = 25

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('batishop_admin_auth')==='1') setAuth(true)
  }, [])

  const charger = useCallback(async (p=1) => {
    setLoading(true); setPage(p)
    let url = `commandes?select=*&order=created_at.desc&offset=${(p-1)*PER}&limit=${PER}`
    if (statutF) url += `&statut=eq.${statutF}`
    if (q) url += `&client_nom=ilike.*${encodeURIComponent(q)}*`
    const res = await fetch(`${BASE}/rest/v1/${url}`, { headers: { 'apikey':KEY, 'Authorization':`Bearer ${KEY}`, 'Prefer':'count=exact' }})
    setTotal(parseInt(res.headers.get('content-range')?.split('/')[1]||'0'))
    const data = await res.json().catch(()=>[])
    setCommandes(Array.isArray(data)?data:[])
    setLoading(false)
  }, [statutF, q])

  useEffect(() => { if (auth) charger(1) }, [auth, statutF])

  const changerStatut = async (id: string, statut: string) => {
    setSaving(true)
    await api(`commandes?id=eq.${id}`, { method:'PATCH', body:JSON.stringify({ statut }) })
    if (statut === 'annulee') {
      await api(`sous_commandes?commande_id=eq.${id}`, { method:'PATCH', body:JSON.stringify({ statut:'annulee' }) })
      setSousCmds(prev => prev.map(sc => ({ ...sc, statut:'annulee' })))
    }
    setCommandes(prev => prev.map(c => c.id===id ? {...c, statut} : c))
    setDetail((d:any) => d?.id===id ? {...d, statut} : d)
    setSaving(false)
    setSucces('✓ Statut mis à jour')
    setTimeout(()=>setSucces(''),2000)
  }

  const ouvrir = async (c: any) => {
    setDetail(c); setSousCmds([])
    const sel = encodeURIComponent('*,partenaires_magasins(nom,ville,quartier,telephone),commande_lignes(*)')
    const data = await api(`sous_commandes?commande_id=eq.${c.id}&select=${sel}&order=numero.asc`)
    setSousCmds(Array.isArray(data) ? data : [])
  }

  const MODE_CFG: Record<string,{label:string,bg:string,c:string}> = {
    retrait:{label:'🏬 Retrait',bg:'#e3f2fd',c:'#1565c0'}, livraison:{label:'🚚 Livraison',bg:'#f3e5f5',c:'#6a1b9a'},
  }

  const waPartenaire = (sc:any) => {
    const mag = sc.partenaires_magasins
    const items = (sc.commande_lignes||[]).map((l:any)=>`- ${l.nom} x${l.quantite} ${l.unite||''}`).join('\n')
    const adr = sc.mode==='livraison'
      ? `\nLivraison : ${(sc.adresse_livraison||detail?.client_adresse||'').split(' — 📍')[0]}`
      : '\nMode : Retrait en magasin'
    const txt = `Bonjour ${mag?.nom||''}, nouvelle commande BatiShop ${detail?.numero}.\n`
      + `Client : ${detail?.client_nom} - ${detail?.client_telephone}${adr}\n\n`
      + `Articles :\n${items}\n\nTotal magasin : ${fmtPrix(sc.total)}`
    const tel = String(mag?.telephone||'').replace(/\D/g,'').replace(/^237/,'')
    return `https://wa.me/237${tel}?text=${encodeURIComponent(txt)}`
  }

  const nbPages = Math.ceil(total/PER)
  const fmtPrix = (n:number) => Number(n).toLocaleString('fr-FR') + ' FCFA'
  const fmtDate = (d:string) => new Date(d).toLocaleDateString('fr-FR', {day:'2-digit',month:'short',year:'numeric'})

  const imprimer = () => {
    if (!detail) return
    const esc = (s:any) => String(s ?? '').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'} as any)[c])
    let corps = ''
    if (sousCmds.length > 0) {
      corps = sousCmds.map((sc:any) => {
        const mag = sc.partenaires_magasins
        const items = (sc.commande_lignes||[]).map((l:any) =>
          `<tr><td style="padding:5px 10px">${esc(l.nom)}</td><td style="text-align:center">${l.quantite} ${esc(l.unite||'')}</td><td style="text-align:right;padding:5px 10px">${fmtPrix(l.prix_unitaire)}</td><td style="text-align:right;padding:5px 10px">${fmtPrix(l.sous_total)}</td></tr>`).join('')
        const adr = sc.mode==='livraison' && sc.adresse_livraison ? `<div style="font-size:12px;color:#555;padding:4px 10px">🚚 Livraison : ${esc(sc.adresse_livraison)}</div>` : ''
        return `<div style="margin:12px 0;border:1px solid #ddd;border-radius:8px;overflow:hidden">
          <div style="background:#f5f5f5;padding:7px 10px;font-weight:bold">${esc(mag?.nom||'BatiShop (direct)')} — ${sc.mode==='livraison'?'Livraison':'Retrait'}${mag?.ville?' · '+esc(mag.ville):''}</div>
          ${adr}
          <table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#fafafa"><th style="text-align:left;padding:5px 10px">Produit</th><th>Qté</th><th style="text-align:right;padding:5px 10px">PU</th><th style="text-align:right;padding:5px 10px">Total</th></tr></thead><tbody>${items}</tbody></table>
          <div style="text-align:right;padding:6px 10px;font-weight:bold">Sous-total : ${fmtPrix(sc.total)}</div>
        </div>`
      }).join('')
    } else {
      const rows = (detail.articles||[]).map((a:any) =>
        `<tr><td style="padding:5px 10px">${esc(a.nom)}${a.partenaire_nom?' · '+esc(a.partenaire_nom):''}</td><td style="text-align:center">${a.quantite} ${esc(a.unite||'')}</td><td style="text-align:right;padding:5px 10px">${fmtPrix(a.prix*a.quantite)}</td></tr>`).join('')
      corps = `<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#fafafa"><th style="text-align:left;padding:5px 10px">Produit</th><th>Qté</th><th style="text-align:right;padding:5px 10px">Total</th></tr></thead><tbody>${rows}</tbody></table>`
    }
    const gps = detail.client_latitude ? ` (GPS : ${detail.client_latitude}, ${detail.client_longitude})` : ''
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Commande ${esc(detail.numero)}</title></head>
      <body style="font-family:Arial,sans-serif;color:#222;padding:24px;max-width:760px;margin:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #C0392B;padding-bottom:10px">
          <div><div style="font-size:22px;font-weight:bold;color:#C0392B">BatiShop Cameroun</div><div style="font-size:12px;color:#777">Bon de commande</div></div>
          <div style="text-align:right"><div style="font-weight:bold">${esc(detail.numero)}</div><div style="font-size:12px;color:#777">${fmtDate(detail.created_at)}</div></div>
        </div>
        <div style="margin:14px 0;font-size:13px;line-height:1.6">
          <strong>Client :</strong> ${esc(detail.client_nom)} — ${esc(detail.client_telephone)}<br>
          <strong>Ville :</strong> ${esc(detail.client_ville||'—')}<br>
          <strong>Adresse :</strong> ${esc(detail.client_adresse||'—')}${gps}<br>
          <strong>Paiement :</strong> ${esc((detail.paiement_methode||'').replace('_',' '))} · <strong>Statut :</strong> ${esc(detail.statut)}
        </div>
        ${corps}
        <div style="text-align:right;font-size:18px;font-weight:bold;margin-top:14px;border-top:2px solid #1A2332;padding-top:10px">TOTAL : ${fmtPrix(detail.total)}</div>
        <div style="margin-top:24px;font-size:11px;color:#999;text-align:center">Merci de votre confiance — BatiShop Cameroun</div>
      </body></html>`
    const w = window.open('', '_blank', 'width=820,height=900')
    if (!w) { alert('Autorisez les fenêtres pop-up pour imprimer.'); return }
    w.document.write(html); w.document.close(); w.focus()
    setTimeout(() => w.print(), 400)
  }
  const statutCfg = (s:string) => STATUTS.find(x=>x.id===s) || STATUTS[0]

  if (!auth) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f2ede8', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:14, padding:32, width:300 }}>
        <div style={{ fontWeight:800, fontSize:22, marginBottom:16 }}>Bati<span style={{color:'#C0392B'}}>Shop</span></div>
        <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Mot de passe"
          onKeyDown={e=>{if(e.key==='Enter'&&pwd===PWD){setAuth(true);localStorage.setItem('batishop_admin_auth','1')}}}
          style={{...S.input,width:'100%',marginBottom:10}}/>
        <button style={{...S.btn(),width:'100%',padding:11}} onClick={()=>{if(pwd===PWD){setAuth(true);localStorage.setItem('batishop_admin_auth','1')}else alert('Incorrect')}}>Connexion →</button>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'system-ui,sans-serif', fontSize:14, color:'#222', background:'#f5f5f3' }}>
      {/* SIDEBAR */}
      <aside style={{ width:200, background:'#1A2332', color:'#fff', padding:'14px 10px', display:'flex', flexDirection:'column', gap:2, flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        <div style={{ fontWeight:800, fontSize:16, padding:'4px 8px', marginBottom:12 }}>Bati<span style={{color:'#C0392B'}}>Shop</span> Admin</div>
        <a href="/admin"             style={S.navbtn(false) as any}>📊 Dashboard</a>
        <a href="/admin/produits"    style={S.navbtn(false) as any}>📦 Produits</a>
        <button                      style={S.navbtn(true)}>🛒 Commandes</button>
        <a href="/admin/devis"       style={S.navbtn(false) as any}>📋 Devis</a>
        <a href="/admin/partenaires" style={S.navbtn(false) as any}>🏪 Partenaires</a>
        <a href="/admin/stocks-admin"style={S.navbtn(false) as any}>📊 Stocks</a>
        <a href="/admin/clients"     style={S.navbtn(false) as any}>👤 Clients</a>
        <div style={{ marginTop:'auto', paddingTop:12, borderTop:'1px solid rgba(255,255,255,.1)' }}>
          <a href="/" style={{ color:'rgba(255,255,255,.35)', fontSize:12, textDecoration:'none' }}>← Voir le site</a>
        </div>
      </aside>

      {/* LISTE */}
      <div style={{ width:detail?480:undefined, flex:detail?undefined:1, display:'flex', flexDirection:'column', overflow:'hidden', borderRight:detail?'1px solid #e8e8e8':'none', background:'#fff' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0' }}>
          {succes && <div style={{ background:'#e8f5e9', border:'1px solid #a5d6a7', color:'#1b5e20', padding:'8px 14px', borderRadius:8, marginBottom:10, fontSize:13, fontWeight:600 }}>{succes}</div>}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <h1 style={{ margin:0, fontWeight:800, fontSize:20, color:'#1A2332' }}>🛒 Commandes</h1>
              <p style={{ margin:'2px 0 0', color:'#999', fontSize:12 }}>{total} commandes</p>
            </div>
            <button style={S.btn('#f0f0f0','#555')} onClick={()=>charger(page)}>🔄</button>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Chercher client..." onKeyDown={e=>e.key==='Enter'&&charger(1)} style={{...S.input,flex:1}}/>
            <button style={S.btn()} onClick={()=>charger(1)}>Chercher</button>
          </div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {STATUTS.map(s => (
              <button key={s.id} onClick={()=>setStatutF(s.id)}
                style={{ padding:'4px 10px', borderRadius:20, border:`2px solid ${statutF===s.id?'#C0392B':'#e0e0e0'}`, background:statutF===s.id?'#fff0ee':'#fff', color:statutF===s.id?'#C0392B':'#666', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit' }}>
                {s.label||'Toutes'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? <div style={{ padding:48, textAlign:'center', color:'#bbb' }}>Chargement…</div>
          : commandes.length===0 ? <div style={{ padding:48, textAlign:'center', color:'#bbb' }}>Aucune commande</div>
          : commandes.map(c => {
            const cfg = statutCfg(c.statut)
            return (
              <div key={c.id} onClick={()=>ouvrir(c)}
                style={{ padding:'12px 16px', borderBottom:'1px solid #f5f5f5', cursor:'pointer', background:detail?.id===c.id?'#fff8f7':'#fff', borderLeft:detail?.id===c.id?'3px solid #C0392B':'3px solid transparent' }}
                onMouseEnter={e=>{if(detail?.id!==c.id)(e.currentTarget as HTMLElement).style.background='#fafafa'}}
                onMouseLeave={e=>{if(detail?.id!==c.id)(e.currentTarget as HTMLElement).style.background='#fff'}}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:'#1A2332' }}>{c.client_nom}</span>
                  <span style={{ background:cfg.bg||'#f0f0f0', color:cfg.color, borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{cfg.label}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'#888' }}>📍 {c.client_ville} · {fmtDate(c.created_at)}</span>
                  <span style={{ fontWeight:800, color:'#C0392B', fontSize:13 }}>{fmtPrix(c.total)}</span>
                </div>
                <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{c.numero} · {c.articles?.length||0} article(s)</div>
              </div>
            )
          })}
        </div>
        {nbPages>1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:8, padding:12, borderTop:'1px solid #f0f0f0' }}>
            <button disabled={page===1} onClick={()=>charger(page-1)} style={{...S.btn('#fff','#555'),opacity:page===1?.4:1}}>←</button>
            <span style={{ padding:'7px 14px', color:'#888', fontSize:12 }}>Page {page}/{nbPages}</span>
            <button disabled={page===nbPages} onClick={()=>charger(page+1)} style={{...S.btn('#fff','#555'),opacity:page===nbPages?.4:1}}>→</button>
          </div>
        )}
      </div>

      {/* DÉTAIL */}
      {detail && (
        <div style={{ flex:1, overflow:'auto', background:'#f5f5f3' }}>
          <div style={{ background:'#fff', padding:'16px 20px', borderBottom:'1px solid #e8e8e8', position:'sticky', top:0, zIndex:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button onClick={()=>setDetail(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#aaa' }}>✕</button>
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:'#1A2332' }}>{detail.client_nom}</div>
                  <div style={{ fontSize:12, color:'#999' }}>{detail.numero}</div>
                </div>
              </div>
              <span style={{ background:statutCfg(detail.statut).bg||'#f0f0f0', color:statutCfg(detail.statut).color, borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:700 }}>
                {statutCfg(detail.statut).label}
              </span>
            </div>
          </div>

          <div style={{ padding:20 }}>
            {/* Barre de progression */}
            {detail.statut !== 'annulee' && (
              <div style={{ background:'#fff', borderRadius:12, padding:16, marginBottom:12, border:'1px solid #e8e8e8' }}>
                <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                  {ETAPES.map((e,i) => {
                    const idx = ETAPES.indexOf(detail.statut)
                    const done = i <= idx
                    const labels: Record<string,string> = { en_attente:'Reçue', confirmee:'Confirmée', en_livraison:'En route', livree:'Livrée' }
                    return (
                      <div key={e} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                        <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                          {i>0 && <div style={{ flex:1, height:3, background:done?'#C0392B':'#e0e0e0' }}/>}
                          <div style={{ width:28, height:28, borderRadius:'50%', background:done?'#C0392B':'#e0e0e0', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }}>
                            {done?'✓':i+1}
                          </div>
                          {i<3 && <div style={{ flex:1, height:3, background:i<idx?'#C0392B':'#e0e0e0' }}/>}
                        </div>
                        <div style={{ fontSize:10, color:done?'#C0392B':'#aaa', marginTop:4, fontWeight:done?700:400 }}>{labels[e]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Infos client */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              {[
                { l:'Client', v:detail.client_nom },
                { l:'Téléphone', v:detail.client_telephone },
                { l:'Ville', v:detail.client_ville },
                { l:'Adresse', v:detail.client_adresse },
                { l:'Paiement', v:detail.paiement_methode?.replace('_',' ') },
                { l:'Statut paiement', v:detail.paiement_statut },
                { l:'Date', v:fmtDate(detail.created_at) },
                { l:'Total', v:fmtPrix(detail.total) },
              ].map(f => (
                <div key={f.l} style={{ background:'#fff', borderRadius:10, padding:'10px 14px', border:'1px solid #e8e8e8' }}>
                  <div style={{ fontSize:11, color:'#aaa', textTransform:'uppercase', fontWeight:700, marginBottom:3 }}>{f.l}</div>
                  <div style={{ fontWeight:700, color:'#1A2332' }}>{f.v||'—'}</div>
                </div>
              ))}
            </div>

            {/* Adresse de livraison (si livraison) */}
            {(detail.client_adresse && detail.client_adresse !== '—') || detail.client_latitude ? (
              <div style={{ background:'#f3e9f5', border:'1px solid #e1c8e8', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
                <div style={{ fontSize:11, color:'#7b1fa2', textTransform:'uppercase', fontWeight:700, marginBottom:3 }}>🚚 Adresse de livraison</div>
                <div style={{ fontWeight:700, color:'#1A2332' }}>{detail.client_adresse || '—'}{detail.client_ville ? `, ${detail.client_ville}` : ''}</div>
                {detail.client_latitude && (
                  <a href={`https://maps.google.com/?q=${detail.client_latitude},${detail.client_longitude}`} target="_blank" rel="noopener"
                    style={{ display:'inline-block', marginTop:6, fontSize:13, color:'#C0392B', fontWeight:600, textDecoration:'none' }}>
                    📍 Ouvrir la position GPS sur la carte →
                  </a>
                )}
              </div>
            ) : null}

            {/* Articles regroupés par magasin (sous-commandes) */}
            {sousCmds.length > 0 ? (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>🏪 Détail par magasin</div>
                {sousCmds.map((sc:any) => {
                  const mag = sc.partenaires_magasins
                  const mode = MODE_CFG[sc.mode] || MODE_CFG.retrait
                  return (
                    <div key={sc.id} style={{ background:'#fff', borderRadius:12, border:'1px solid #e8e8e8', overflow:'hidden', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', background:'#f9f9f7', borderBottom:'1px solid #f0f0f0' }}>
                        <span style={{ fontWeight:700, fontSize:13, color:'#1A2332' }}>{mag?.nom || 'BatiShop (direct)'}</span>
                        {mag?.ville && <span style={{ fontSize:12, color:'#999' }}>📍 {mag.ville}</span>}
                        <span style={{ background:mode.bg, color:mode.c, borderRadius:20, padding:'2px 9px', fontSize:11, fontWeight:700 }}>{mode.label}</span>
                        <span style={{ marginLeft:'auto', fontSize:11, color:'#bbb' }}>{sc.numero}</span>
                        {mag?.telephone && (
                          <a href={waPartenaire(sc)} target="_blank" rel="noopener"
                            style={{ background:'#25D366', color:'#fff', borderRadius:8, padding:'4px 10px', fontSize:11, fontWeight:700, textDecoration:'none' }}>
                            WhatsApp magasin
                          </a>
                        )}
                      </div>
                      {sc.mode==='livraison' && sc.adresse_livraison && (
                        <div style={{ fontSize:12, color:'#6a1b9a', padding:'7px 16px', background:'#faf4fc', borderBottom:'1px solid #f0f0f0' }}>
                          🚚 {sc.adresse_livraison.split(' — 📍')[0]}
                          {sc.adresse_livraison.includes('http') && (
                            <a href={sc.adresse_livraison.match(/https?:\/\/\S+/)?.[0]} target="_blank" rel="noopener" style={{ marginLeft:6, color:'#C0392B', fontWeight:600, textDecoration:'none' }}>📍 carte</a>
                          )}
                        </div>
                      )}
                      {(sc.commande_lignes||[]).map((l:any) => (
                        <div key={l.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid #f5f5f5' }}>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13, color:'#1A2332' }}>{l.nom}</div>
                            <div style={{ fontSize:11, color:'#999' }}>×{l.quantite} {l.unite} · {fmtPrix(l.prix_unitaire)}</div>
                          </div>
                          <div style={{ fontWeight:700, color:'#C0392B' }}>{fmtPrix(l.sous_total)}</div>
                        </div>
                      ))}
                      <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 16px', fontSize:13 }}>
                        <span style={{ color:'#888' }}>Sous-total{sc.frais_livraison>0?` + livraison ${fmtPrix(sc.frais_livraison)}`:''}</span>
                        <span style={{ fontWeight:800, color:'#1A2332' }}>{fmtPrix(sc.total)}</span>
                      </div>
                    </div>
                  )
                })}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', background:'#1A2332', color:'#fff', borderRadius:12 }}>
                  <span style={{ fontWeight:700 }}>TOTAL COMMANDE</span>
                  <span style={{ fontWeight:800, fontSize:16, color:'#D4A853' }}>{fmtPrix(detail.total)}</span>
                </div>
              </div>
            ) : (
              <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e8e8e8', overflow:'hidden', marginBottom:12 }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f0f0', fontWeight:700, fontSize:14 }}>🛍 Articles commandés</div>
                {(detail.articles||[]).map((a:any,i:number) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid #f5f5f5' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:'#1A2332' }}>{a.nom}{a.partenaire_nom?` · ${a.partenaire_nom}`:''}</div>
                      <div style={{ fontSize:11, color:'#999' }}>×{a.quantite} {a.unite}</div>
                    </div>
                    <div style={{ fontWeight:800, color:'#C0392B' }}>{fmtPrix(a.prix * a.quantite)}</div>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', background:'#1A2332', color:'#fff' }}>
                  <span style={{ fontWeight:700 }}>TOTAL</span>
                  <span style={{ fontWeight:800, fontSize:16, color:'#D4A853' }}>{fmtPrix(detail.total)}</span>
                </div>
              </div>
            )}

            {/* Actions statut */}
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e8e8e8', padding:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>⚙️ Changer le statut</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {detail.statut === 'en_attente' && <>
                  <button style={S.btn('#1565c0')} onClick={()=>changerStatut(detail.id,'confirmee')}>✓ Confirmer</button>
                  <button style={S.btn('#fce8e8','#b71c1c')} onClick={()=>changerStatut(detail.id,'annulee')}>❌ Annuler</button>
                </>}
                {detail.statut === 'confirmee' && (
                  <button style={S.btn('#6a1b9a')} onClick={()=>changerStatut(detail.id,'en_livraison')}>🚚 Marquer en livraison</button>
                )}
                {detail.statut === 'en_livraison' && (
                  <button style={S.btn('#1b5e20')} onClick={()=>changerStatut(detail.id,'livree')}>✅ Marquer comme livrée</button>
                )}
                {detail.statut === 'livree' && <span style={{ color:'#888', fontSize:13 }}>✅ Commande terminée</span>}
                {detail.statut === 'annulee' && <span style={{ color:'#888', fontSize:13 }}>❌ Commande annulée</span>}
              </div>
              <div style={{ marginTop:12, display:'flex', gap:8 }}>
                <a href={`tel:${detail.client_telephone}`} style={{ ...S.btn(), textDecoration:'none', fontSize:13 }}>📞 Appeler le client</a>
                <button onClick={imprimer} style={{ ...S.btn('#1A2332'), fontSize:13 }}>🖨 Imprimer / PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
