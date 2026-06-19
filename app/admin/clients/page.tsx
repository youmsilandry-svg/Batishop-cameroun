'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { apiAdmin as api, adminHeaders } from '../../../lib/adminApi'

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL||''
const KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||''
const PWD  = process.env.NEXT_PUBLIC_ADMIN_PASSWORD||'admin123'


const S: any = {
  btn: (bg='#C0392B',c='#fff') => ({ padding:'7px 14px', background:bg, color:c, border:bg==='#fff'?'1px solid #ddd':'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'inherit' }),
  navbtn: (a:boolean) => ({ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', width:'100%', textAlign:'left' as const, fontSize:13, background:a?'#C0392B':'transparent', color:'#fff', fontFamily:'inherit', textDecoration:'none' }),
}

export default function AdminClients() {
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd]   = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<any>(null)
  const [commandes, setCommandes] = useState<any[]>([])
  const [loadingCmd, setLoadingCmd] = useState(false)
  const PER = 25

  useEffect(()=>{ if(typeof window!=='undefined'&&localStorage.getItem('batishop_admin_auth')==='1') setAuth(true) },[])

  const charger = useCallback(async (p=1) => {
    setLoading(true); setPage(p)
    let url = `profils?select=*&order=created_at.desc&offset=${(p-1)*PER}&limit=${PER}`
    if(q) url += `&nom=ilike.*${encodeURIComponent(q)}*`
    const res = await fetch(`${BASE}/rest/v1/${url}`, { headers: await adminHeaders({ 'Prefer': 'count=exact' }) })
    setTotal(parseInt(res.headers.get('content-range')?.split('/')[1]||'0'))
    const data = await res.json().catch(()=>[])
    setClients(Array.isArray(data)?data:[])
    setLoading(false)
  }, [q])

  useEffect(()=>{ if(auth) charger(1) },[auth])

  const ouvrirDetail = async (c: any) => {
    setDetail(c); setCommandes([])
    setLoadingCmd(true)
    if (c.telephone) {
      const cmds = await api(`commandes?client_telephone=eq.${encodeURIComponent(c.telephone)}&select=*&order=created_at.desc&limit=10`)
      setCommandes(cmds||[])
    }
    setLoadingCmd(false)
  }

  const fmtDate = (d:string) => new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})
  const fmtPrix = (n:number) => Number(n).toLocaleString('fr-FR')+' FCFA'
  const nbPages = Math.ceil(total/PER)
  const initiales = (nom:string) => nom?.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()||'?'

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
      <aside style={{width:200,background:'#1A2332',color:'#fff',padding:'14px 10px',display:'flex',flexDirection:'column',gap:2,flexShrink:0,position:'sticky',top:0,height:'100vh',overflowY:'auto'}}>
        <div style={{fontWeight:800,fontSize:16,padding:'4px 8px',marginBottom:12}}>Bati<span style={{color:'#C0392B'}}>Shop</span> Admin</div>
        <a href="/admin"              style={S.navbtn(false) as any}>📊 Dashboard</a>
        <a href="/admin/produits"     style={S.navbtn(false) as any}>📦 Produits</a>
        <a href="/admin/commandes"    style={S.navbtn(false) as any}>🛒 Commandes</a>
        <a href="/admin/devis"        style={S.navbtn(false) as any}>📋 Devis</a>
        <a href="/admin/partenaires"  style={S.navbtn(false) as any}>🏪 Partenaires</a>
        <a href="/admin/stocks-admin" style={S.navbtn(false) as any}>📊 Stocks</a>
        <button                       style={S.navbtn(true)}>👤 Clients</button>
        <div style={{marginTop:'auto',paddingTop:12,borderTop:'1px solid rgba(255,255,255,.1)'}}>
          <a href="/" style={{color:'rgba(255,255,255,.35)',fontSize:12,textDecoration:'none'}}>← Voir le site</a>
        </div>
      </aside>

      {/* LISTE */}
      <div style={{width:detail?400:undefined,flex:detail?undefined:1,display:'flex',flexDirection:'column',overflow:'hidden',borderRight:detail?'1px solid #e8e8e8':'none',background:'#fff'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #f0f0f0'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div>
              <h1 style={{margin:0,fontWeight:800,fontSize:20,color:'#1A2332'}}>👤 Clients</h1>
              <p style={{margin:'2px 0 0',color:'#999',fontSize:12}}>{total} clients inscrits</p>
            </div>
            <button style={S.btn('#f0f0f0','#555')} onClick={()=>charger(page)}>🔄</button>
          </div>
          <div style={{display:'flex',gap:8}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Chercher par nom..." onKeyDown={e=>e.key==='Enter'&&charger(1)}
              style={{padding:'8px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13,flex:1,boxSizing:'border-box' as const}}/>
            <button style={S.btn()} onClick={()=>charger(1)}>Chercher</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto'}}>
          {loading?<div style={{padding:48,textAlign:'center',color:'#bbb'}}>Chargement…</div>
          :clients.length===0?<div style={{padding:48,textAlign:'center',color:'#bbb'}}>Aucun client</div>
          :clients.map(c=>(
            <div key={c.id} onClick={()=>ouvrirDetail(c)}
              style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid #f5f5f5',cursor:'pointer',background:detail?.id===c.id?'#fff8f7':'#fff',borderLeft:detail?.id===c.id?'3px solid #C0392B':'3px solid transparent'}}
              onMouseEnter={e=>{if(detail?.id!==c.id)(e.currentTarget as HTMLElement).style.background='#fafafa'}}
              onMouseLeave={e=>{if(detail?.id!==c.id)(e.currentTarget as HTMLElement).style.background='#fff'}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:'#C0392B',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0}}>
                {initiales(c.nom||'')}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,color:'#1A2332'}}>{c.nom||'Sans nom'}</div>
                <div style={{fontSize:12,color:'#888'}}>📞 {c.telephone||'—'} · 📍 {c.ville||'—'}</div>
              </div>
              <div style={{fontSize:11,color:'#bbb',flexShrink:0}}>{fmtDate(c.created_at)}</div>
            </div>
          ))}
        </div>
        {nbPages>1&&(
          <div style={{display:'flex',justifyContent:'center',gap:8,padding:12,borderTop:'1px solid #f0f0f0'}}>
            <button disabled={page===1} onClick={()=>charger(page-1)} style={{...S.btn('#fff','#555'),opacity:page===1?.4:1}}>←</button>
            <span style={{padding:'7px 14px',color:'#888',fontSize:12}}>{page}/{nbPages}</span>
            <button disabled={page===nbPages} onClick={()=>charger(page+1)} style={{...S.btn('#fff','#555'),opacity:page===nbPages?.4:1}}>→</button>
          </div>
        )}
      </div>

      {/* DÉTAIL */}
      {detail&&(
        <div style={{flex:1,overflow:'auto',background:'#f5f5f3'}}>
          <div style={{background:'#fff',padding:'16px 20px',borderBottom:'1px solid #e8e8e8',position:'sticky',top:0,zIndex:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <button onClick={()=>setDetail(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#aaa'}}>✕</button>
              <div style={{width:40,height:40,borderRadius:'50%',background:'#C0392B',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16}}>
                {initiales(detail.nom||'')}
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:16,color:'#1A2332'}}>{detail.nom||'Sans nom'}</div>
                <div style={{fontSize:12,color:'#999'}}>Inscrit le {fmtDate(detail.created_at)}</div>
              </div>
            </div>
          </div>

          <div style={{padding:20}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              {[
                {l:'Téléphone',v:detail.telephone||'—'},{l:'Email',v:'Via Supabase Auth'},
                {l:'Ville',v:detail.ville||'—'},{l:'Adresse',v:detail.adresse||'—'},
                {l:'Inscrit le',v:fmtDate(detail.created_at)},{l:'Commandes',v:commandes.length+' commande(s)'},
              ].map(f=>(
                <div key={f.l} style={{background:'#fff',borderRadius:10,padding:'10px 14px',border:'1px solid #e8e8e8'}}>
                  <div style={{fontSize:11,color:'#aaa',textTransform:'uppercase',fontWeight:700,marginBottom:3}}>{f.l}</div>
                  <div style={{fontWeight:700,color:'#1A2332'}}>{f.v}</div>
                </div>
              ))}
            </div>

            {detail.telephone&&(
              <div style={{marginBottom:14}}>
                <a href={`tel:${detail.telephone}`} style={{...S.btn(),textDecoration:'none',display:'inline-block'}}>📞 Appeler</a>
              </div>
            )}

            <div style={{background:'#fff',borderRadius:12,border:'1px solid #e8e8e8',overflow:'hidden'}}>
              <div style={{padding:'12px 16px',borderBottom:'1px solid #f0f0f0',fontWeight:700,fontSize:14}}>
                🛒 Historique des commandes
              </div>
              {loadingCmd?<div style={{padding:32,textAlign:'center',color:'#bbb'}}>Chargement…</div>
              :commandes.length===0?<div style={{padding:32,textAlign:'center',color:'#bbb'}}>Aucune commande</div>
              :commandes.map(cmd=>{
                const SCFG: Record<string,{bg:string,c:string}> = {
                  en_attente:{bg:'#fff8e1',c:'#e65100'}, confirmee:{bg:'#e3f2fd',c:'#1565c0'},
                  en_livraison:{bg:'#f3e5f5',c:'#6a1b9a'}, livree:{bg:'#e8f5e9',c:'#1b5e20'},
                  annulee:{bg:'#fce8e8',c:'#b71c1c'},
                }
                const s = SCFG[cmd.statut]||{bg:'#f0f0f0',c:'#666'}
                return (
                  <div key={cmd.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',borderBottom:'1px solid #f5f5f5'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:'#1A2332'}}>{cmd.numero}</div>
                      <div style={{fontSize:11,color:'#999'}}>{fmtDate(cmd.created_at)} · {cmd.articles?.length||0} articles</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:800,color:'#C0392B'}}>{fmtPrix(cmd.total)}</div>
                      <span style={{background:s.bg,color:s.c,borderRadius:20,padding:'2px 8px',fontSize:10,fontWeight:700}}>{cmd.statut.replace('_',' ')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
