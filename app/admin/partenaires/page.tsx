'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const PWD  = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

const api = async (path: string, opts: any = {}) => {
  const res = await fetch(`${BASE}/rest/v1/${path}`, { ...opts, headers: {'apikey':KEY,'Authorization':`Bearer ${KEY}`,'Content-Type':'application/json','Prefer':'return=representation',...(opts.headers||{})}})
  return res.ok ? res.json().catch(()=>null) : null
}

const S: any = {
  btn: (bg='#C0392B',c='#fff') => ({ padding:'7px 14px', background:bg, color:c, border:bg==='#fff'?'1px solid #ddd':'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'inherit' }),
  navbtn: (a:boolean) => ({ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', width:'100%', textAlign:'left' as const, fontSize:13, background:a?'#C0392B':'transparent', color:'#fff', fontFamily:'inherit', textDecoration:'none' }),
}

const STATUT_CFG: Record<string,{label:string,bg:string,c:string}> = {
  en_attente: { label:'En attente', bg:'#fff8e1', c:'#e65100' },
  actif:      { label:'Actif',      bg:'#e8f5e9', c:'#1b5e20' },
  inactif:    { label:'En pause',   bg:'#eceff1', c:'#546e7a' },
  refuse:     { label:'Refusé',     bg:'#fce8e8', c:'#b71c1c' },
}

export default function AdminPartenaires() {
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd]   = useState('')
  const [liste, setListe] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filtre, setFiltre] = useState<'en_attente'|'actif'|'tous'>('en_attente')
  const [detail, setDetail] = useState<any>(null)
  const [uid, setUid] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(()=>{ if(typeof window!=='undefined'&&localStorage.getItem('batishop_admin_auth')==='1') setAuth(true) },[])

  const charger = useCallback(async () => {
    setLoading(true)
    const data = await api('partenaires_magasins?select=*&order=created_at.desc.nullslast')
    setListe(Array.isArray(data)?data:[])
    setLoading(false)
  }, [])

  useEffect(()=>{ if(auth) charger() },[auth, charger])

  const patch = async (id:string, body:any) => {
    await api(`partenaires_magasins?id=eq.${id}`, { method:'PATCH', body: JSON.stringify(body) })
    setListe(prev => prev.map(p => p.id===id ? { ...p, ...body } : p))
    setDetail((d:any) => d && d.id===id ? { ...d, ...body } : d)
  }

  const valider     = (p:any) => patch(p.id, { actif:true,  statut:'actif' })
  const mettrePause = (p:any) => patch(p.id, { actif:false, statut:'inactif' })
  const refuser     = (p:any) => { if(confirm('Refuser cette candidature ?')) patch(p.id, { actif:false, statut:'refuse' }) }

  const lierCompte = async (p:any) => {
    if(!uid.trim()) { setMsg('Colle d’abord l’UID du compte Supabase.'); return }
    await patch(p.id, { user_id: uid.trim() })
    setUid(''); setMsg('✓ Compte lié')
    setTimeout(()=>setMsg(''), 3000)
  }

  const fmtDate = (d:string) => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) : '—'
  const visibles = liste.filter(p => filtre==='tous' ? true : (p.statut||'en_attente')===filtre)
  const nbAttente = liste.filter(p => (p.statut||'en_attente')==='en_attente').length

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
        <button                       style={S.navbtn(true)}>🏪 Partenaires</button>
        <a href="/admin/stocks-admin" style={S.navbtn(false) as any}>📊 Stocks</a>
        <a href="/admin/clients"      style={S.navbtn(false) as any}>👤 Clients</a>
        <div style={{marginTop:'auto',paddingTop:12,borderTop:'1px solid rgba(255,255,255,.1)'}}>
          <a href="/" style={{color:'rgba(255,255,255,.35)',fontSize:12,textDecoration:'none'}}>← Voir le site</a>
        </div>
      </aside>

      {/* LISTE */}
      <div style={{width:detail?420:undefined,flex:detail?undefined:1,display:'flex',flexDirection:'column',overflow:'hidden',borderRight:detail?'1px solid #e8e8e8':'none',background:'#fff'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #f0f0f0'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div>
              <h1 style={{margin:0,fontWeight:800,fontSize:20,color:'#1A2332'}}>🏪 Partenaires</h1>
              <p style={{margin:'2px 0 0',color:'#999',fontSize:12}}>{liste.length} magasin(s) · {nbAttente} en attente</p>
            </div>
            <button style={S.btn('#f0f0f0','#555')} onClick={charger}>🔄</button>
          </div>
          <div style={{display:'flex',gap:8}}>
            {([['en_attente','En attente'],['actif','Actifs'],['tous','Tous']] as const).map(([k,lbl])=>(
              <button key={k} onClick={()=>setFiltre(k)}
                style={S.btn(filtre===k?'#C0392B':'#fff', filtre===k?'#fff':'#555')}>
                {lbl}{k==='en_attente'&&nbAttente>0?` (${nbAttente})`:''}
              </button>
            ))}
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto'}}>
          {loading?<div style={{padding:48,textAlign:'center',color:'#bbb'}}>Chargement…</div>
          :visibles.length===0?<div style={{padding:48,textAlign:'center',color:'#bbb'}}>Aucun partenaire</div>
          :visibles.map(p=>{
            const st = STATUT_CFG[p.statut||'en_attente']||STATUT_CFG.en_attente
            return (
            <div key={p.id} onClick={()=>{setDetail(p);setUid(p.user_id||'')}}
              style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid #f5f5f5',cursor:'pointer',background:detail?.id===p.id?'#fff8f7':'#fff',borderLeft:detail?.id===p.id?'3px solid #C0392B':'3px solid transparent'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,color:'#1A2332'}}>{p.nom||'Sans nom'}</div>
                <div style={{fontSize:12,color:'#888'}}>📍 {p.ville||'—'} · {p.quartier||'—'} · 📞 {p.telephone||'—'}</div>
              </div>
              <span style={{background:st.bg,color:st.c,borderRadius:20,padding:'2px 9px',fontSize:10,fontWeight:700,flexShrink:0}}>{st.label}</span>
            </div>
          )})}
        </div>
      </div>

      {/* DÉTAIL */}
      {detail&&(()=>{
        const st = STATUT_CFG[detail.statut||'en_attente']||STATUT_CFG.en_attente
        return (
        <div style={{flex:1,overflow:'auto',background:'#f5f5f3'}}>
          <div style={{background:'#fff',padding:'16px 20px',borderBottom:'1px solid #e8e8e8',position:'sticky',top:0,zIndex:10,display:'flex',alignItems:'center',gap:10}}>
            <button onClick={()=>setDetail(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#aaa'}}>✕</button>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:16,color:'#1A2332'}}>{detail.nom}</div>
              <div style={{fontSize:12,color:'#999'}}>Candidature du {fmtDate(detail.created_at)}</div>
            </div>
            <span style={{background:st.bg,color:st.c,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700}}>{st.label}</span>
          </div>

          <div style={{padding:20}}>
            {/* Actions */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {detail.statut!=='actif' && <button style={S.btn('#1b5e20')} onClick={()=>valider(detail)}>✓ Valider (rendre actif)</button>}
              {detail.statut==='actif' && <button style={S.btn('#546e7a')} onClick={()=>mettrePause(detail)}>⏸ Mettre en pause</button>}
              {detail.statut!=='refuse' && <button style={S.btn('#fff','#b71c1c')} onClick={()=>refuser(detail)}>Refuser</button>}
              {detail.telephone && <a href={`tel:${detail.telephone}`} style={{...S.btn('#fff','#333'),textDecoration:'none'}}>📞 Appeler</a>}
              {detail.email && <a href={`mailto:${detail.email}`} style={{...S.btn('#fff','#333'),textDecoration:'none'}}>✉️ Email</a>}
            </div>

            {/* Infos */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {[
                {l:'Téléphone',v:detail.telephone||'—'},{l:'Email',v:detail.email||'—'},
                {l:'Ville',v:detail.ville||'—'},{l:'Quartier',v:detail.quartier||'—'},
                {l:'Adresse',v:detail.adresse||'—'},{l:'Horaires',v:detail.horaires||'—'},
              ].map(f=>(
                <div key={f.l} style={{background:'#fff',borderRadius:10,padding:'10px 14px',border:'1px solid #e8e8e8'}}>
                  <div style={{fontSize:11,color:'#aaa',textTransform:'uppercase',fontWeight:700,marginBottom:3}}>{f.l}</div>
                  <div style={{fontWeight:700,color:'#1A2332',wordBreak:'break-word'}}>{f.v}</div>
                </div>
              ))}
            </div>

            {detail.description&&(
              <div style={{background:'#fff',borderRadius:10,padding:'12px 14px',border:'1px solid #e8e8e8',marginBottom:16}}>
                <div style={{fontSize:11,color:'#aaa',textTransform:'uppercase',fontWeight:700,marginBottom:4}}>Produits vendus</div>
                <div style={{color:'#333',fontSize:13}}>{detail.description}</div>
              </div>
            )}

            {/* Lier le compte */}
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #e8e8e8',padding:16}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>🔑 Lier un compte de connexion</div>
              <p style={{fontSize:12,color:'#888',margin:'0 0 10px'}}>
                Crée l’utilisateur dans <b>Supabase → Authentication → Add user</b> (avec l’email
                ci-dessus), copie son <b>UID</b>, colle-le ici. Le partenaire pourra alors se connecter.
              </p>
              <div style={{display:'flex',gap:8}}>
                <input value={uid} onChange={e=>setUid(e.target.value)} placeholder="UID Supabase (uuid)"
                  style={{padding:'8px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13,flex:1,boxSizing:'border-box' as const,fontFamily:'monospace'}}/>
                <button style={S.btn()} onClick={()=>lierCompte(detail)}>Lier</button>
              </div>
              {detail.user_id && <div style={{fontSize:12,color:'#1b5e20',marginTop:8}}>✓ Compte lié : <code>{detail.user_id}</code></div>}
              {msg && <div style={{fontSize:12,color:'#C0392B',marginTop:8}}>{msg}</div>}
            </div>
          </div>
        </div>
      )})()}
    </div>
  )
}
