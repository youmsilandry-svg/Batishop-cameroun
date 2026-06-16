'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const PWD  = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

const VILLES = ['Douala','Yaoundé','Bafoussam','Garoua','Bamenda','Maroua','Ngaoundéré','Bertoua','Ebolowa','Kumba','Limbe','Kribi']

const api = async (path: string, opts: any = {}) => {
  const res = await fetch(`${BASE}/rest/v1/${path}`, { ...opts, headers: {'apikey':KEY,'Authorization':`Bearer ${KEY}`,'Content-Type':'application/json','Prefer':'return=representation',...(opts.headers||{})}})
  return res.ok ? res.json().catch(()=>null) : null
}

const S: any = {
  btn: (bg='#C0392B',c='#fff') => ({ padding:'7px 14px', background:bg, color:c, border:bg==='#fff'?'1px solid #ddd':'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'inherit', textDecoration:'none', display:'inline-block' }),
  navbtn: (a:boolean) => ({ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', width:'100%', textAlign:'left' as const, fontSize:13, background:a?'#C0392B':'transparent', color:'#fff', fontFamily:'inherit', textDecoration:'none' }),
  inp: { padding:'8px 10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, fontFamily:'inherit', width:'100%', boxSizing:'border-box' as const },
}

const STATUT_CFG: Record<string,{label:string,bg:string,c:string}> = {
  en_attente:{label:'En attente',bg:'#fff8e1',c:'#e65100'}, actif:{label:'Actif',bg:'#e8f5e9',c:'#1b5e20'},
  pause:{label:'En pause',bg:'#fff3e0',c:'#ef6c00'}, inactif:{label:'Désactivé',bg:'#eceff1',c:'#546e7a'},
  refuse:{label:'Refusé',bg:'#fce8e8',c:'#b71c1c'},
}
const waLink = (tel:string) => { if(!tel) return ''; let n=tel.replace(/[^0-9]/g,''); if(!n.startsWith('237')&&n.length===9) n='237'+n; return `https://wa.me/${n}` }
const fmtPrix = (n:any) => (n===null||n===undefined)?'—':Number(n).toLocaleString('fr-FR')+' FCFA'
const fmtDate = (d:string) => d?new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}):'—'
const phonesArr = (s:string) => s.split(/[,;\n]/).map(x=>x.trim()).filter(Boolean)

const BOUTIQUE_VIDE = { nom:'', ville:'', quartier:'', adresse:'', telephones:'', horaires:'', latitude:'', longitude:'' }

export default function AdminPartenaires() {
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd]   = useState('')
  const [ents, setEnts] = useState<any[]>([])
  const [counts, setCounts] = useState<Record<string,number>>({})
  const [loading, setLoading] = useState(false)
  const [filtre, setFiltre] = useState<'en_attente'|'actif'|'tous'>('en_attente')
  const [detail, setDetail] = useState<any>(null)
  const [tab, setTab] = useState<'boutiques'|'stock'|'commandes'>('boutiques')
  const [boutiques, setBoutiques] = useState<any[]>([])
  const [stock, setStock] = useState<any[]>([])
  const [uid, setUid] = useState('')
  const [msg, setMsg] = useState('')
  const [coords, setCoords] = useState<Record<string, { lat: string; lng: string }>>({})
  const [nouvelle, setNouvelle] = useState<any|null>(null)  // formulaire ajout boutique

  useEffect(()=>{ if(typeof window!=='undefined'&&localStorage.getItem('batishop_admin_auth')==='1') setAuth(true) },[])

  const charger = useCallback(async () => {
    setLoading(true)
    const data = await api('entreprises?select=*&order=created_at.desc.nullslast')
    setEnts(Array.isArray(data)?data:[])
    // compteur de boutiques par entreprise
    const b = await api('partenaires_magasins?select=id,entreprise_id')
    const map: Record<string,number> = {}
    ;(Array.isArray(b)?b:[]).forEach((r:any)=>{ if(r.entreprise_id) map[r.entreprise_id]=(map[r.entreprise_id]||0)+1 })
    setCounts(map)
    setLoading(false)
  }, [])

  useEffect(()=>{ if(auth) charger() },[auth, charger])

  const ouvrir = async (e:any) => {
    setDetail(e); setUid(e.user_id||''); setTab('boutiques'); setNouvelle(null); setBoutiques([]); setStock([])
    const b = await api(`partenaires_magasins?entreprise_id=eq.${e.id}&select=*&order=ville.asc`)
    const list = Array.isArray(b)?b:[]
    setBoutiques(list)
    if(list.length){
      const ids = list.map((x:any)=>x.id).join(',')
      const sel = encodeURIComponent('*,produits(nom,reference,unite,categorie),partenaires_magasins(nom,ville)')
      const s = await api(`stocks_partenaires?point_vente_id=in.(${ids})&select=${sel}&order=quantite.desc`)
      setStock(Array.isArray(s)?s:[])
    }
  }

  // Statut entreprise + propagation visibilité aux boutiques
  const setStatut = async (e:any, statut:string, actifBoutiques:boolean|null) => {
    await api(`entreprises?id=eq.${e.id}`, { method:'PATCH', body: JSON.stringify({ statut }) })
    if(actifBoutiques!==null){
      await api(`partenaires_magasins?entreprise_id=eq.${e.id}`, { method:'PATCH', body: JSON.stringify({ actif: actifBoutiques }) })
      setBoutiques(prev => prev.map(b=>({ ...b, actif: actifBoutiques })))
    }
    setEnts(prev => prev.map(x=>x.id===e.id?{...x,statut}:x))
    setDetail((d:any)=>d&&d.id===e.id?{...d,statut}:d)
  }
  const activer    = (e:any) => setStatut(e,'actif', true)
  const pause      = (e:any) => setStatut(e,'pause', false)
  const desactiver = (e:any) => setStatut(e,'inactif', false)
  const refuser    = (e:any) => { if(confirm('Refuser cette candidature ?')) setStatut(e,'refuse', false) }

  const toggleBoutique = async (b:any) => {
    const actif = !b.actif
    await api(`partenaires_magasins?id=eq.${b.id}`, { method:'PATCH', body: JSON.stringify({ actif }) })
    setBoutiques(prev => prev.map(x=>x.id===b.id?{...x,actif}:x))
  }

  const coordDe = (b:any, f:'lat'|'lng') => coords[b.id]?.[f] ?? (f==='lat' ? (b.latitude ?? '') : (b.longitude ?? ''))
  const setCoord = (b:any, f:'lat'|'lng', v:string) =>
    setCoords(c => ({ ...c, [b.id]: { lat: coordDe(b,'lat'), lng: coordDe(b,'lng'), [f]: v } }))
  const maPositionBoutique = (b:any) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { alert('Géolocalisation non supportée'); return }
    navigator.geolocation.getCurrentPosition(
      p => setCoords(c => ({ ...c, [b.id]: { lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) } })),
      () => alert('Position refusée ou indisponible'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }
  const sauverPosition = async (b:any) => {
    const lat = parseFloat(String(coordDe(b,'lat'))), lng = parseFloat(String(coordDe(b,'lng')))
    const body = { latitude: isNaN(lat) ? null : lat, longitude: isNaN(lng) ? null : lng }
    await api(`partenaires_magasins?id=eq.${b.id}`, { method:'PATCH', body: JSON.stringify(body) })
    setBoutiques(prev => prev.map(x=>x.id===b.id?{...x,...body}:x))
    setCoords(c => { const n={...c}; delete n[b.id]; return n })
    setMsg('✓ Position enregistrée'); setTimeout(()=>setMsg(''), 2500)
  }

  const lierCompte = async (e:any) => {
    if(!uid.trim()){ setMsg('Colle d’abord l’UID Supabase.'); return }
    const u = uid.trim()
    await api(`entreprises?id=eq.${e.id}`, { method:'PATCH', body: JSON.stringify({ user_id: u }) })
    // propage aux boutiques pour que l'espace partenaire (qui interroge par user_id) les retrouve
    await api(`partenaires_magasins?entreprise_id=eq.${e.id}`, { method:'PATCH', body: JSON.stringify({ user_id: u }) })
    setEnts(prev=>prev.map(x=>x.id===e.id?{...x,user_id:u}:x))
    setDetail((d:any)=>d?{...d,user_id:u}:d)
    setMsg('✓ Compte lié à l’entreprise et à ses boutiques'); setTimeout(()=>setMsg(''),3500)
  }

  const maPosition = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { alert('Géolocalisation non supportée par ce navigateur'); return }
    navigator.geolocation.getCurrentPosition(
      p => setNouvelle((n:any) => ({ ...n, latitude: p.coords.latitude.toFixed(6), longitude: p.coords.longitude.toFixed(6) })),
      () => alert('Position refusée ou indisponible'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const ajouterBoutique = async (e:any) => {
    if(!nouvelle.ville || !nouvelle.quartier){ alert('Ville et quartier obligatoires'); return }
    const tels = phonesArr(nouvelle.telephones)
    const lat = parseFloat(nouvelle.latitude), lng = parseFloat(nouvelle.longitude)
    const body = {
      entreprise_id: e.id,
      user_id: e.user_id || null,
      nom: nouvelle.nom.trim() || e.nom,
      ville: nouvelle.ville, quartier: nouvelle.quartier.trim(),
      adresse: nouvelle.adresse.trim() || null,
      telephone: tels[0] || null, telephones: tels.length?tels:null,
      horaires: nouvelle.horaires.trim() || null,
      latitude: isNaN(lat) ? null : lat, longitude: isNaN(lng) ? null : lng,
      actif: e.statut==='actif', statut: e.statut,
    }
    const r = await api('partenaires_magasins', { method:'POST', body: JSON.stringify(body) })
    if(r){ setBoutiques(prev=>[...prev, ...(Array.isArray(r)?r:[r])]); setNouvelle(null); setCounts(c=>({...c,[e.id]:(c[e.id]||0)+1})) }
    else alert('Échec de l’ajout')
  }

  const visibles = ents.filter(e => filtre==='tous'?true:(e.statut||'en_attente')===filtre)
  const nbAttente = ents.filter(e=>(e.statut||'en_attente')==='en_attente').length
  const valeurStock = stock.reduce((t,s)=>t+(Number(s.quantite)||0)*(Number(s.prix_local)||0),0)

  if(!auth) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f2ede8',fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:'#fff',borderRadius:14,padding:32,width:300}}>
        <div style={{fontWeight:800,fontSize:22,marginBottom:16}}>Bati<span style={{color:'#C0392B'}}>Shop</span></div>
        <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Mot de passe"
          onKeyDown={e=>{if(e.key==='Enter'&&pwd===PWD){setAuth(true);localStorage.setItem('batishop_admin_auth','1')}}}
          style={{...S.inp, marginBottom:10}}/>
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
        <button                       style={S.navbtn(true)}>🏪 Partenaires</button>
        <a href="/admin/stocks-admin" style={S.navbtn(false) as any}>📊 Stocks</a>
        <a href="/admin/clients"      style={S.navbtn(false) as any}>👤 Clients</a>
        <div style={{marginTop:'auto',paddingTop:12,borderTop:'1px solid rgba(255,255,255,.1)'}}>
          <a href="/" style={{color:'rgba(255,255,255,.35)',fontSize:12,textDecoration:'none'}}>← Voir le site</a>
        </div>
      </aside>

      {/* LISTE ENTREPRISES */}
      <div style={{width:detail?460:undefined,flex:detail?undefined:1,display:'flex',flexDirection:'column',overflow:'hidden',borderRight:detail?'1px solid #e8e8e8':'none',background:'#fff'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #f0f0f0'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div>
              <h1 style={{margin:0,fontWeight:800,fontSize:20,color:'#1A2332'}}>🏪 Partenaires</h1>
              <p style={{margin:'2px 0 0',color:'#999',fontSize:12}}>{ents.length} entreprise(s) · {nbAttente} en attente</p>
            </div>
            <button style={S.btn('#f0f0f0','#555')} onClick={charger}>🔄</button>
          </div>
          <div style={{display:'flex',gap:8}}>
            {([['en_attente','En attente'],['actif','Actives'],['tous','Toutes']] as const).map(([k,lbl])=>(
              <button key={k} onClick={()=>setFiltre(k)} style={S.btn(filtre===k?'#C0392B':'#fff', filtre===k?'#fff':'#555')}>
                {lbl}{k==='en_attente'&&nbAttente>0?` (${nbAttente})`:''}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {loading?<div style={{padding:48,textAlign:'center',color:'#bbb'}}>Chargement…</div>
          :visibles.length===0?<div style={{padding:48,textAlign:'center',color:'#bbb'}}>Aucune entreprise</div>
          :visibles.map(e=>{
            const st = STATUT_CFG[e.statut||'en_attente']||STATUT_CFG.en_attente
            return (
            <div key={e.id} onClick={()=>ouvrir(e)}
              style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid #f5f5f5',cursor:'pointer',background:detail?.id===e.id?'#fff8f7':'#fff',borderLeft:detail?.id===e.id?'3px solid #C0392B':'3px solid transparent'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,color:'#1A2332'}}>{e.nom||'Sans nom'}</div>
                <div style={{fontSize:12,color:'#888'}}>🏬 {counts[e.id]||0} boutique(s) · 📞 {e.telephone||'—'}</div>
              </div>
              <span style={{background:st.bg,color:st.c,borderRadius:20,padding:'2px 9px',fontSize:10,fontWeight:700,flexShrink:0}}>{st.label}</span>
            </div>
          )})}
        </div>
      </div>

      {/* DÉTAIL ENTREPRISE */}
      {detail&&(()=>{
        const st = STATUT_CFG[detail.statut||'en_attente']||STATUT_CFG.en_attente
        return (
        <div style={{flex:1,overflow:'auto',background:'#f5f5f3'}}>
          <div style={{background:'#fff',padding:'16px 20px',borderBottom:'1px solid #e8e8e8',position:'sticky',top:0,zIndex:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <button onClick={()=>setDetail(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#aaa'}}>✕</button>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:16,color:'#1A2332'}}>{detail.nom}</div>
                <div style={{fontSize:12,color:'#999'}}>Entreprise · candidature du {fmtDate(detail.created_at)}</div>
              </div>
              <span style={{background:st.bg,color:st.c,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700}}>{st.label}</span>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
              {detail.statut!=='actif' && <button style={S.btn('#1b5e20')} onClick={()=>activer(detail)}>✓ Activer</button>}
              {detail.statut==='actif' && <button style={S.btn('#ef6c00')} onClick={()=>pause(detail)}>⏸ Pause</button>}
              {detail.statut!=='inactif' && detail.statut!=='en_attente' && <button style={S.btn('#546e7a')} onClick={()=>desactiver(detail)}>⛔ Désactiver</button>}
              {detail.statut==='en_attente' && <button style={S.btn('#fff','#b71c1c')} onClick={()=>refuser(detail)}>Refuser</button>}
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {detail.telephone && <a href={`tel:${detail.telephone}`} style={S.btn('#fff','#333')}>📞 Appeler</a>}
              {detail.telephone && <a href={waLink(detail.telephone)} target="_blank" rel="noopener" style={S.btn('#25D366','#fff')}>WhatsApp</a>}
              {detail.email && <a href={`mailto:${detail.email}`} style={S.btn('#fff','#333')}>✉️ Email</a>}
            </div>
          </div>

          {/* Onglets */}
          <div style={{display:'flex',gap:4,padding:'12px 20px 0',background:'#fff',borderBottom:'1px solid #eee'}}>
            {([['boutiques',`Boutiques (${boutiques.length})`],['stock',`Stock (${stock.length})`],['commandes','Commandes & CA']] as const).map(([k,lbl])=>(
              <button key={k} onClick={()=>setTab(k as any)}
                style={{padding:'8px 14px',border:'none',borderBottom:tab===k?'2px solid #C0392B':'2px solid transparent',background:'none',cursor:'pointer',fontWeight:tab===k?700:500,color:tab===k?'#C0392B':'#888',fontSize:13,fontFamily:'inherit'}}>{lbl}</button>
            ))}
          </div>

          <div style={{padding:20}}>
            {/* BOUTIQUES */}
            {tab==='boutiques'&&(<>
              {boutiques.map(b=>{
                const tels = (b.telephones&&b.telephones.length)?b.telephones:(b.telephone?[b.telephone]:[])
                return (
                <div key={b.id} style={{background:'#fff',borderRadius:12,border:'1px solid #e8e8e8',padding:14,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:700,color:'#1A2332'}}>{b.nom||detail.nom}</div>
                      <div style={{fontSize:12,color:'#888',marginTop:2}}>📍 {b.ville} · {b.quartier}{b.adresse?` · ${b.adresse}`:''}</div>
                      {b.horaires && <div style={{fontSize:12,color:'#aaa',marginTop:2}}>🕒 {b.horaires}</div>}
                    </div>
                    <button onClick={()=>toggleBoutique(b)} style={S.btn(b.actif?'#e8f5e9':'#f0f0f0', b.actif?'#1b5e20':'#888')}>
                      {b.actif?'✓ Visible':'Masquée'}
                    </button>
                  </div>
                  {tels.length>0&&(
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}}>
                      {tels.map((t:string,i:number)=>(
                        <span key={i} style={{display:'flex',gap:4}}>
                          <a href={`tel:${t}`} style={S.btn('#fff','#333')}>📞 {t}</a>
                          <a href={waLink(t)} target="_blank" rel="noopener" style={S.btn('#25D366','#fff')}>WA</a>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Position GPS */}
                  <div style={{marginTop:12,paddingTop:12,borderTop:'1px dashed #eee'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',marginBottom:6}}>
                      📍 Position {(b.latitude!=null&&b.longitude!=null)?<span style={{color:'#1b5e20'}}>· définie</span>:<span style={{color:'#e65100'}}>· manquante</span>}
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                      <input value={coordDe(b,'lat')} onChange={e=>setCoord(b,'lat',e.target.value)} placeholder="Latitude (4.0489)" style={{...S.inp,width:150}}/>
                      <input value={coordDe(b,'lng')} onChange={e=>setCoord(b,'lng',e.target.value)} placeholder="Longitude (9.7020)" style={{...S.inp,width:150}}/>
                      <button onClick={()=>maPositionBoutique(b)} style={S.btn('#1A2332')}>📍 Ma position</button>
                      <button onClick={()=>sauverPosition(b)} style={S.btn('#1b5e20')}>Enregistrer</button>
                      {b.latitude!=null&&b.longitude!=null&&(
                        <a href={`https://maps.google.com/?q=${b.latitude},${b.longitude}`} target="_blank" rel="noopener" style={{fontSize:12,color:'#C0392B',textDecoration:'none',fontWeight:600}}>Carte →</a>
                      )}
                    </div>
                    <p style={{fontSize:11,color:'#aaa',margin:'6px 0 0'}}>Astuce : sur Google Maps, clic droit sur le lieu → cliquer sur les coordonnées pour les copier, puis coller ici.</p>
                  </div>
                </div>
              )})}

              {/* Ajouter une boutique */}
              {nouvelle ? (
                <div style={{background:'#fff',borderRadius:12,border:'1px solid #C0392B',padding:14}}>
                  <div style={{fontWeight:700,marginBottom:10}}>➕ Nouvelle boutique</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                    <select value={nouvelle.ville} onChange={e=>setNouvelle({...nouvelle,ville:e.target.value})} style={S.inp}>
                      <option value="">Ville *</option>{VILLES.map(v=><option key={v}>{v}</option>)}
                    </select>
                    <input placeholder="Quartier *" value={nouvelle.quartier} onChange={e=>setNouvelle({...nouvelle,quartier:e.target.value})} style={S.inp}/>
                    <input placeholder="Adresse / repère" value={nouvelle.adresse} onChange={e=>setNouvelle({...nouvelle,adresse:e.target.value})} style={{...S.inp,gridColumn:'1 / -1'}}/>
                    <input placeholder="Téléphones (séparés par virgule)" value={nouvelle.telephones} onChange={e=>setNouvelle({...nouvelle,telephones:e.target.value})} style={{...S.inp,gridColumn:'1 / -1'}}/>
                    <input placeholder="Horaires" value={nouvelle.horaires} onChange={e=>setNouvelle({...nouvelle,horaires:e.target.value})} style={S.inp}/>
                    <input placeholder="Nom de la boutique (optionnel)" value={nouvelle.nom} onChange={e=>setNouvelle({...nouvelle,nom:e.target.value})} style={S.inp}/>
                    <input placeholder="Latitude (ex: 4.0489)" value={nouvelle.latitude} onChange={e=>setNouvelle({...nouvelle,latitude:e.target.value})} style={S.inp}/>
                    <input placeholder="Longitude (ex: 9.7020)" value={nouvelle.longitude} onChange={e=>setNouvelle({...nouvelle,longitude:e.target.value})} style={S.inp}/>
                  </div>
                  <div style={{ fontSize:11, color:'#888', marginBottom:8, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <button type="button" onClick={maPosition} style={S.btn('#fff','#1A2332')}>📍 Ma position</button>
                    <span>ou colle les coordonnées depuis Google Maps (clic droit sur le lieu → « Plus/coordonnées »). Sert au tri par distance côté client.</span>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button style={S.btn()} onClick={()=>ajouterBoutique(detail)}>Enregistrer</button>
                    <button style={S.btn('#fff','#555')} onClick={()=>setNouvelle(null)}>Annuler</button>
                  </div>
                </div>
              ) : (
                <button style={{...S.btn('#fff','#C0392B'),border:'1.5px dashed #C0392B',width:'100%',padding:11}} onClick={()=>setNouvelle({...BOUTIQUE_VIDE})}>
                  ➕ Ajouter une boutique
                </button>
              )}

              {/* Lier compte */}
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e8e8e8',padding:16,marginTop:14}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>🔑 Compte de connexion</div>
                <p style={{fontSize:12,color:'#888',margin:'0 0 10px'}}>Supabase → Authentication → Add user, copie l’<b>UID</b>, colle-le ici. Il sera lié à l’entreprise et à toutes ses boutiques.</p>
                <div style={{display:'flex',gap:8}}>
                  <input value={uid} onChange={e=>setUid(e.target.value)} placeholder="UID Supabase (uuid)" style={{...S.inp,fontFamily:'monospace'}}/>
                  <button style={S.btn()} onClick={()=>lierCompte(detail)}>Lier</button>
                </div>
                {detail.user_id && <div style={{fontSize:12,color:'#1b5e20',marginTop:8}}>✓ Lié : <code>{detail.user_id}</code></div>}
                {msg && <div style={{fontSize:12,color:'#C0392B',marginTop:8}}>{msg}</div>}
              </div>
            </>)}

            {/* STOCK (toutes boutiques) */}
            {tab==='stock'&&(<>
              <div style={{display:'flex',gap:10,marginBottom:14}}>
                <div style={{flex:1,background:'#fff',borderRadius:10,padding:'12px 14px',border:'1px solid #e8e8e8'}}>
                  <div style={{fontSize:11,color:'#aaa',fontWeight:700}}>LIGNES DE STOCK</div>
                  <div style={{fontWeight:800,fontSize:20,color:'#1A2332'}}>{stock.length}</div>
                </div>
                <div style={{flex:1,background:'#fff',borderRadius:10,padding:'12px 14px',border:'1px solid #e8e8e8'}}>
                  <div style={{fontSize:11,color:'#aaa',fontWeight:700}}>VALEUR TOTALE</div>
                  <div style={{fontWeight:800,fontSize:20,color:'#C0392B'}}>{fmtPrix(valeurStock)}</div>
                </div>
              </div>
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e8e8e8',overflow:'hidden'}}>
                {stock.length===0?<div style={{padding:32,textAlign:'center',color:'#bbb'}}>Aucun stock déclaré.</div>
                :stock.map(s=>(
                  <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderBottom:'1px solid #f5f5f5'}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,color:'#1A2332'}}>{s.produits?.nom||'—'}</div>
                      <div style={{fontSize:11,color:'#aaa'}}>{s.partenaires_magasins?.ville||''} · {s.produits?.categorie||''}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontWeight:700,color:(s.quantite||0)>0?'#1b5e20':'#b71c1c'}}>{s.quantite??0} {s.produits?.unite||''}</div>
                      <div style={{fontSize:11,color:'#888'}}>{fmtPrix(s.prix_local)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>)}

            {tab==='commandes'&&(
              <div style={{background:'#fff8e1',border:'1px solid #ffe082',borderRadius:12,padding:'16px 18px'}}>
                <div style={{fontWeight:700,fontSize:14,color:'#e65100',marginBottom:8}}>⚠️ Suivi des commandes — Phase 4</div>
                <p style={{fontSize:13,color:'#6d4c00',margin:0,lineHeight:1.5}}>
                  Pour le flux de commandes et le chiffre d’affaires par boutique, il faut relier les
                  commandes à un point de vente. On le branche une fois qu’on a tranché annuaire vs marketplace.
                </p>
              </div>
            )}
          </div>
        </div>
      )})()}
    </div>
  )
}
