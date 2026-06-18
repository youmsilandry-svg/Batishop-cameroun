'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { apiAdmin as api } from '../../../lib/adminApi'

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL||''
const KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||''
const PWD  = process.env.NEXT_PUBLIC_ADMIN_PASSWORD||'admin123'


const STATUTS = [
  { id:'', label:'Tous' },
  { id:'recu',     label:'📥 Reçu',      bg:'#e3f2fd', color:'#1565c0' },
  { id:'en_cours', label:'⚙️ En cours',  bg:'#fff8e1', color:'#e65100' },
  { id:'envoye',   label:'📤 Envoyé',    bg:'#f3e5f5', color:'#6a1b9a' },
  { id:'accepte',  label:'✅ Accepté',   bg:'#e8f5e9', color:'#1b5e20' },
  { id:'refuse',   label:'❌ Refusé',    bg:'#fce8e8', color:'#b71c1c' },
]

const S: any = {
  btn: (bg='#C0392B',c='#fff') => ({ padding:'7px 14px', background:bg, color:c, border:bg==='#fff'?'1px solid #ddd':'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'inherit' }),
  navbtn: (a:boolean) => ({ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', width:'100%', textAlign:'left' as const, fontSize:13, background:a?'#C0392B':'transparent', color:'#fff', fontFamily:'inherit', textDecoration:'none' }),
}

export default function AdminDevis() {
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd]   = useState('')
  const [devis, setDevis] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [statutF, setStatutF] = useState('')
  const [detail, setDetail] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [succes, setSucces] = useState('')
  const PER = 25

  useEffect(()=>{ if(typeof window!=='undefined'&&localStorage.getItem('batishop_admin_auth')==='1') setAuth(true) },[])

  const charger = useCallback(async (p=1) => {
    setLoading(true); setPage(p)
    let url = `devis?select=*&order=created_at.desc&offset=${(p-1)*PER}&limit=${PER}`
    if(statutF) url += `&statut=eq.${statutF}`
    const res = await fetch(`${BASE}/rest/v1/${url}`, { headers:{'apikey':KEY,'Authorization':`Bearer ${KEY}`,'Prefer':'count=exact'}})
    setTotal(parseInt(res.headers.get('content-range')?.split('/')[1]||'0'))
    const data = await res.json().catch(()=>[])
    setDevis(Array.isArray(data)?data:[])
    setLoading(false)
  }, [statutF])

  useEffect(()=>{ if(auth) charger(1) },[auth, statutF])

  const changerStatut = async (id:string, statut:string) => {
    setSaving(true)
    await api(`devis?id=eq.${id}`, { method:'PATCH', body:JSON.stringify({statut}) })
    setDevis(prev=>prev.map(d=>d.id===id?{...d,statut}:d))
    setDetail((d:any)=>d?.id===id?{...d,statut}:d)
    setSaving(false); setSucces('✓ Statut mis à jour')
    setTimeout(()=>setSucces(''),2000)
  }

  const cfg = (s:string) => STATUTS.find(x=>x.id===s)||STATUTS[0]
  const fmtDate = (d:string) => new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
  const nbPages = Math.ceil(total/PER)

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
        <a href="/admin"             style={S.navbtn(false) as any}>📊 Dashboard</a>
        <a href="/admin/produits"    style={S.navbtn(false) as any}>📦 Produits</a>
        <a href="/admin/commandes"   style={S.navbtn(false) as any}>🛒 Commandes</a>
        <button                      style={S.navbtn(true)}>📋 Devis</button>
        <a href="/admin/partenaires" style={S.navbtn(false) as any}>🏪 Partenaires</a>
        <a href="/admin/stocks-admin"style={S.navbtn(false) as any}>📊 Stocks</a>
        <a href="/admin/clients"     style={S.navbtn(false) as any}>👤 Clients</a>
        <div style={{marginTop:'auto',paddingTop:12,borderTop:'1px solid rgba(255,255,255,.1)'}}>
          <a href="/" style={{color:'rgba(255,255,255,.35)',fontSize:12,textDecoration:'none'}}>← Voir le site</a>
        </div>
      </aside>

      {/* LISTE */}
      <div style={{width:detail?440:undefined,flex:detail?undefined:1,display:'flex',flexDirection:'column',overflow:'hidden',borderRight:detail?'1px solid #e8e8e8':'none',background:'#fff'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #f0f0f0'}}>
          {succes&&<div style={{background:'#e8f5e9',border:'1px solid #a5d6a7',color:'#1b5e20',padding:'8px 14px',borderRadius:8,marginBottom:10,fontSize:13,fontWeight:600}}>{succes}</div>}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div>
              <h1 style={{margin:0,fontWeight:800,fontSize:20,color:'#1A2332'}}>📋 Devis</h1>
              <p style={{margin:'2px 0 0',color:'#999',fontSize:12}}>{total} demandes · {STATUTS.find(s=>s.id==='recu')&&devis.filter(d=>d.statut==='recu').length} nouveau(x) à traiter</p>
            </div>
            <button style={S.btn('#f0f0f0','#555')} onClick={()=>charger(page)}>🔄</button>
          </div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {STATUTS.map(s=>(
              <button key={s.id} onClick={()=>setStatutF(s.id)}
                style={{padding:'4px 10px',borderRadius:20,border:`2px solid ${statutF===s.id?'#C0392B':'#e0e0e0'}`,background:statutF===s.id?'#fff0ee':'#fff',color:statutF===s.id?'#C0392B':'#666',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto'}}>
          {loading?<div style={{padding:48,textAlign:'center',color:'#bbb'}}>Chargement…</div>
          :devis.length===0?<div style={{padding:48,textAlign:'center',color:'#bbb'}}>Aucun devis</div>
          :devis.map(d=>{
            const c=cfg(d.statut)
            return (
              <div key={d.id} onClick={()=>setDetail(d)}
                style={{padding:'12px 16px',borderBottom:'1px solid #f5f5f5',cursor:'pointer',background:detail?.id===d.id?'#fff8f7':'#fff',borderLeft:detail?.id===d.id?'3px solid #C0392B':'3px solid transparent'}}
                onMouseEnter={e=>{if(detail?.id!==d.id)(e.currentTarget as HTMLElement).style.background='#fafafa'}}
                onMouseLeave={e=>{if(detail?.id!==d.id)(e.currentTarget as HTMLElement).style.background='#fff'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:13,color:'#1A2332'}}>{d.client_nom}</span>
                  <span style={{background:(c as any).bg||'#f0f0f0',color:c.color||'#666',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700}}>{c.label}</span>
                </div>
                <div style={{fontSize:12,color:'#888',marginBottom:2}}>📞 {d.client_telephone} · 📍 {d.client_ville}</div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:11,color:'#bbb'}}>{d.numero} · {d.lignes?.length||0} produit(s)</span>
                  <span style={{fontSize:11,color:'#aaa'}}>{fmtDate(d.created_at)}</span>
                </div>
              </div>
            )
          })}
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
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button onClick={()=>setDetail(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#aaa'}}>✕</button>
                <div>
                  <div style={{fontWeight:800,fontSize:16,color:'#1A2332'}}>{detail.client_nom}</div>
                  <div style={{fontSize:12,color:'#999'}}>{detail.numero}</div>
                </div>
              </div>
              <span style={{background:(cfg(detail.statut) as any).bg||'#f0f0f0',color:cfg(detail.statut).color||'#666',borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:700}}>{cfg(detail.statut).label}</span>
            </div>
          </div>

          <div style={{padding:20}}>
            {/* Infos contact */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              {[
                {l:'Client',v:detail.client_nom},{l:'Téléphone',v:detail.client_telephone},
                {l:'Email',v:detail.client_email||'—'},{l:'Ville',v:detail.client_ville},
                {l:'Adresse',v:detail.client_adresse||'—'},{l:'Date livraison souhaitée',v:detail.date_livraison?new Date(detail.date_livraison).toLocaleDateString('fr-FR'):'—'},
                {l:'Reçu le',v:fmtDate(detail.created_at)},{l:'Statut',v:cfg(detail.statut).label},
              ].map(f=>(
                <div key={f.l} style={{background:'#fff',borderRadius:10,padding:'10px 14px',border:'1px solid #e8e8e8'}}>
                  <div style={{fontSize:11,color:'#aaa',textTransform:'uppercase',fontWeight:700,marginBottom:3}}>{f.l}</div>
                  <div style={{fontWeight:700,color:'#1A2332'}}>{f.v}</div>
                </div>
              ))}
            </div>

            {/* Notes */}
            {detail.notes&&(
              <div style={{background:'#fff8e1',border:'1px solid #ffe082',borderRadius:10,padding:'10px 14px',marginBottom:12}}>
                <div style={{fontSize:11,color:'#e65100',fontWeight:700,marginBottom:3}}>💬 NOTE DU CLIENT</div>
                <p style={{margin:0,color:'#555'}}>{detail.notes}</p>
              </div>
            )}

            {/* Liste matériaux */}
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #e8e8e8',overflow:'hidden',marginBottom:12}}>
              <div style={{padding:'12px 16px',borderBottom:'1px solid #f0f0f0',fontWeight:700,fontSize:14}}>
                📦 Matériaux demandés ({detail.lignes?.length||0})
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{background:'#f9f9f7'}}>
                    {['#','Catégorie','Produit','Quantité','Unité','Prix unitaire'].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',borderBottom:'1px solid #eee'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(detail.lignes||[]).map((l:any,i:number)=>(
                    <tr key={i} onMouseEnter={e=>(e.currentTarget.style.background='#fafafa')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                      <td style={{padding:'8px 12px',borderBottom:'1px solid #f5f5f5',color:'#bbb',fontSize:12}}>#{i+1}</td>
                      <td style={{padding:'8px 12px',borderBottom:'1px solid #f5f5f5'}}><span style={{background:'#f0f0f0',borderRadius:6,padding:'2px 8px',fontSize:11}}>{l.categorie||'—'}</span></td>
                      <td style={{padding:'8px 12px',borderBottom:'1px solid #f5f5f5',fontWeight:700,color:'#1A2332'}}>{l.produit}</td>
                      <td style={{padding:'8px 12px',borderBottom:'1px solid #f5f5f5',fontWeight:700,color:'#C0392B',fontSize:15}}>{l.quantite}</td>
                      <td style={{padding:'8px 12px',borderBottom:'1px solid #f5f5f5',color:'#888'}}>{l.unite}</td>
                      <td style={{padding:'8px 12px',borderBottom:'1px solid #f5f5f5'}}>
                        <input type="number" placeholder="Prix..." style={{width:90,padding:'4px 8px',border:'1.5px solid #ddd',borderRadius:6,fontSize:12,textAlign:'center'}}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Fichiers */}
            {detail.fichiers?.length>0&&(
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e8e8e8',padding:16,marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>📎 Fichiers joints ({detail.fichiers.length})</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8}}>
                  {detail.fichiers.map((f:any,i:number)=>(
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                      style={{display:'flex',alignItems:'center',gap:8,background:'#f5f5f3',borderRadius:8,padding:'8px 10px',textDecoration:'none'}}>
                      <span style={{fontSize:20}}>{f.type?.startsWith('image/')?'🖼️':f.type?.includes('pdf')?'📄':f.type?.includes('excel')||f.type?.includes('csv')?'📊':'📝'}</span>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:'#1A2332',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.nom}</div>
                        <div style={{fontSize:10,color:'#999'}}>{f.taille?Math.round(f.taille/1024)+'Ko':''}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #e8e8e8',padding:16}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>⚙️ Actions</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {detail.statut==='recu'&&<button style={S.btn('#e65100')} onClick={()=>changerStatut(detail.id,'en_cours')}>⚙️ Prendre en charge</button>}
                {detail.statut==='en_cours'&&<button style={S.btn('#6a1b9a')} onClick={()=>changerStatut(detail.id,'envoye')}>📤 Devis envoyé</button>}
                {detail.statut==='envoye'&&<>
                  <button style={S.btn('#1b5e20')} onClick={()=>changerStatut(detail.id,'accepte')}>✅ Accepté</button>
                  <button style={S.btn('#fce8e8','#b71c1c')} onClick={()=>changerStatut(detail.id,'refuse')}>❌ Refusé</button>
                </>}
                <a href={`tel:${detail.client_telephone}`} style={{...S.btn(),textDecoration:'none'}}>📞 Appeler</a>
                {detail.client_email&&<a href={`mailto:${detail.client_email}?subject=Devis ${detail.numero} - BatiShop`} style={{...S.btn('#1A2332'),textDecoration:'none'}}>✉️ Email</a>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
