'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const apiAuth = async (path: string, token: string, opts: any = {}) => {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(opts.headers || {})
    }
  })
  return res.ok ? res.json().catch(() => null) : null
}

export default function EspacePartenaire() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [user, setUser] = useState<any>(null)
  const [magasin, setMagasin] = useState<any>(null)
  const [produits, setProduits] = useState<any[]>([])
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState<'dashboard'|'stocks'|'infos'>('dashboard')
  const [saving, setSaving] = useState(false)
  const [succes, setSucces] = useState('')
  const [form, setForm] = useState<any>({})
  const [modifStocks, setModifStocks] = useState<Record<string, number>>({})
  const [modifPrix, setModifPrix] = useState<Record<string, number>>({})
  const [prixMoyens, setPrixMoyens] = useState<Record<string, { prix_moyen: number; nb_partenaires: number }>>({})
  const [rechercheProd, setRechercheProd] = useState('')
  const [modeAjout, setModeAjout] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('batishop_partenaire_token')
    const u = localStorage.getItem('batishop_partenaire_user')
    if (!t) { router.push('/partenaires/connexion'); return }
    setToken(t)
    if (u) setUser(JSON.parse(u))

    async function charger() {
      const mag = await apiAuth(`partenaires_magasins?user_id=eq.${JSON.parse(u||'{}').id}&select=*`, t!)
      if (!mag || mag.length === 0) { router.push('/partenaires'); return }
      const m = mag[0]
      setMagasin(m)
      setForm({ nom: m.nom, telephone: m.telephone, adresse: m.adresse, quartier: m.quartier, horaires: m.horaires, description: m.description })

      // Charger TOUS les produits BatiShop
      const prods = await apiAuth('produits?select=id,nom,categorie,reference,prix,unite&actif=eq.true&order=nom.asc', t!)
      setProduits(prods || [])

      // Charger stocks existants du partenaire
      const stks = await apiAuth(`stocks_partenaires?partenaire_id=eq.${m.id}&select=*`, t!)
      setStocks(stks || [])

      // Charger les prix moyens du site (tous partenaires confondus)
      const moyennes = await apiAuth('prix_moyen_partenaires?select=produit_id,prix_moyen,nb_partenaires', t!)
      const mapMoy: Record<string, { prix_moyen: number; nb_partenaires: number }> = {}
      ;(moyennes || []).forEach((r: any) => { mapMoy[r.produit_id] = { prix_moyen: r.prix_moyen, nb_partenaires: r.nb_partenaires } })
      setPrixMoyens(mapMoy)

      setLoading(false)
    }
    charger()
  }, [router])

  const seDeconnecter = () => {
    localStorage.removeItem('batishop_partenaire_token')
    localStorage.removeItem('batishop_partenaire_user')
    router.push('/partenaires/connexion')
  }

  const sauvegarderInfos = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await apiAuth(`partenaires_magasins?id=eq.${magasin.id}`, token, { method: 'PATCH', body: JSON.stringify(form) })
    setMagasin((m: any) => ({ ...m, ...form }))
    setSucces('✓ Informations mises à jour')
    setSaving(false)
    setTimeout(() => setSucces(''), 3000)
  }

  const sauvegarderStocks = async () => {
    setSaving(true)
    let ok = 0
    // On enregistre tous les produits modifiés (quantité OU prix)
    const idsModifies = Array.from(new Set([...Object.keys(modifStocks), ...Object.keys(modifPrix)]))
    for (const produitId of idsModifies) {
      const existant = stocks.find(s => s.produit_id === produitId)
      const qte = modifStocks[produitId] !== undefined ? modifStocks[produitId] : (existant?.quantite ?? 0)
      const prix = modifPrix[produitId] !== undefined ? modifPrix[produitId] : (existant?.prix_local ?? null)
      if (existant) {
        await apiAuth(`stocks_partenaires?id=eq.${existant.id}`, token, {
          method: 'PATCH',
          body: JSON.stringify({ quantite: qte, prix_local: prix, disponible_immediat: qte > 0 })
        })
        setStocks(prev => prev.map(s => s.id === existant.id ? { ...s, quantite: qte, prix_local: prix, disponible_immediat: qte > 0 } : s))
      } else {
        const nouveau = await apiAuth('stocks_partenaires', token, {
          method: 'POST',
          body: JSON.stringify({ partenaire_id: magasin.id, produit_id: produitId, quantite: qte, prix_local: prix, disponible_immediat: qte > 0 })
        })
        if (nouveau) setStocks(prev => [...prev, ...(Array.isArray(nouveau) ? nouveau : [nouveau])])
      }
      ok++
    }
    setModifStocks({})
    setModifPrix({})
    setModeAjout(false)
    setSucces(`✓ ${ok} produit${ok > 1 ? 's' : ''} mis à jour`)
    setSaving(false)
    setTimeout(() => setSucces(''), 3000)
  }

  const getPrix = (produitId: string) => {
    if (modifPrix[produitId] !== undefined) return modifPrix[produitId]
    return stocks.find(s => s.produit_id === produitId)?.prix_local ?? null
  }

  const getStock = (produitId: string) => {
    if (modifStocks[produitId] !== undefined) return modifStocks[produitId]
    return stocks.find(s => s.produit_id === produitId)?.quantite ?? null
  }

  const nbEnStock = produits.filter(p => (getStock(p.id) || 0) > 0).length
  const nbModifs = new Set([...Object.keys(modifStocks), ...Object.keys(modifPrix)]).size

  // IDs des produits que le partenaire propose déjà (déclarés dans stocks_partenaires)
  const idsDeclares = new Set(stocks.map(s => s.produit_id))

  const matchRecherche = (p: any) =>
    !rechercheProd || p.nom.toLowerCase().includes(rechercheProd.toLowerCase()) || (p.categorie || '').toLowerCase().includes(rechercheProd.toLowerCase())

  // Mes produits : uniquement ceux que je propose
  const mesProduits = produits.filter(p => idsDeclares.has(p.id) && matchRecherche(p))
  // Catalogue à ajouter : tous les autres
  const produitsAjoutables = produits.filter(p => !idsDeclares.has(p.id) && matchRecherche(p))

  const produitsAffiches = modeAjout ? produitsAjoutables : mesProduits

  const S: any = {
    page: { minHeight: '100vh', background: '#f5f5f3', fontFamily: 'system-ui,sans-serif', fontSize: 14 },
    header: { background: '#1A2332', color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    main: { maxWidth: 1000, margin: '0 auto', padding: '24px 16px' },
    card: { background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20, marginBottom: 16 },
    btn: (bg = '#C0392B', c = '#fff') => ({ padding: '8px 16px', background: bg, color: c, border: bg === '#fff' ? '1px solid #ddd' : 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }),
    tab: (a: boolean) => ({ padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', background: a ? '#C0392B' : 'transparent', color: a ? '#fff' : '#888' }),
    input: { padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
    stat: { background: '#f9f9f7', borderRadius: 10, padding: '14px 16px', textAlign: 'center' as const },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f3', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ color: '#bbb', fontSize: 15 }}>Chargement de votre espace…</div>
    </div>
  )

  if (magasin?.statut === 'suspendu' || magasin?.statut === 'exclu') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f3', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, maxWidth: 440, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{magasin.statut === 'exclu' ? '🚫' : '⏸'}</div>
        <h2 style={{ color: '#1A2332', marginBottom: 8 }}>Compte {magasin.statut === 'exclu' ? 'exclu' : 'suspendu'}</h2>
        <div style={{ background: '#fce8e8', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'left', fontSize: 13 }}>
          <strong>Raison :</strong><br/>{magasin.raison_suspension || 'Non précisée'}
        </div>
        <a href="tel:+237600000000" style={{ display: 'inline-block', padding: '10px 24px', background: '#C0392B', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>📞 Contacter BatiShop</a>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: '#C0392B', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏪</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{magasin?.nom}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{magasin?.ville} · {magasin?.statut === 'actif' ? '✓ Actif sur BatiShop' : magasin?.statut}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, textDecoration: 'none' }}>← Voir le site</a>
          <button onClick={seDeconnecter} style={{ padding: '6px 14px', background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Déconnexion</button>
        </div>
      </div>

      <div style={S.main}>
        {succes && (
          <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#1b5e20', padding: '10px 16px', borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>{succes}</div>
        )}

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 2, background: '#fff', borderRadius: 10, padding: 4, marginBottom: 20, border: '1px solid #e8e8e8', width: 'fit-content' }}>
          <button style={S.tab(onglet === 'dashboard')} onClick={() => setOnglet('dashboard')}>📊 Tableau de bord</button>
          <button style={S.tab(onglet === 'stocks')} onClick={() => setOnglet('stocks')}>
            📦 Mes stocks
            {nbModifs > 0 && <span style={{ background: '#C0392B', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, marginLeft: 6 }}>{nbModifs}</span>}
          </button>
          <button style={S.tab(onglet === 'infos')} onClick={() => setOnglet('infos')}>⚙️ Mon magasin</button>
        </div>

        {/* DASHBOARD */}
        {onglet === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={S.stat}><div style={{ fontWeight: 800, fontSize: 28, color: '#C0392B' }}>{nbEnStock}</div><div style={{ fontSize: 12, color: '#888' }}>Produits renseignés</div></div>
              <div style={S.stat}><div style={{ fontWeight: 800, fontSize: 28, color: '#e65100' }}>{stocks.filter(s => s.quantite === 0).length}</div><div style={{ fontSize: 12, color: '#888' }}>Ruptures de stock</div></div>
              <div style={S.stat}><div style={{ fontWeight: 800, fontSize: 28, color: '#1b5e20' }}>{idsDeclares.size}</div><div style={{ fontSize: 12, color: '#888' }}>Produits proposés</div></div>
            </div>

            <div style={S.card}>
              <h3 style={{ margin: '0 0 12px', fontWeight: 700 }}>💡 Comment ça marche ?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['🛒', 'Choisissez vos produits', 'Ajoutez au catalogue uniquement les produits que vous vendez réellement.'],
                  ['💰', 'Fixez votre prix', 'Indiquez votre prix de vente. Vous voyez le prix moyen du site pour vous situer.'],
                  ['📦', 'Déclarez votre stock', 'Pour chaque produit, indiquez la quantité disponible (0 = rupture).'],
                  ['👥', 'Les clients vous trouvent', 'Quand un client cherche un produit à ' + magasin?.ville + ', votre magasin apparaît avec votre prix et votre stock.'],
                ].map(([ico, titre, desc]) => (
                  <div key={titre} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#f9f9f7', borderRadius: 10 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{ico}</span>
                    <div><div style={{ fontWeight: 700, fontSize: 13, color: '#1A2332', marginBottom: 2 }}>{titre}</div><div style={{ fontSize: 12, color: '#888' }}>{desc}</div></div>
                  </div>
                ))}
              </div>
            </div>

            {stocks.filter(s => s.quantite === 0).length > 0 && (
              <div style={{ ...S.card, background: '#fff8e1', border: '1px solid #ffe082' }}>
                <div style={{ fontWeight: 700, color: '#e65100', marginBottom: 6 }}>⚠️ Produits en rupture de stock</div>
                <div style={{ fontSize: 12, color: '#bf360c', marginBottom: 10 }}>Ces produits sont marqués comme indisponibles chez vous :</div>
                <button style={S.btn()} onClick={() => setOnglet('stocks')}>Mettre à jour mes stocks →</button>
              </div>
            )}
          </div>
        )}

        {/* MES PRODUITS */}
        {onglet === 'stocks' && (
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700 }}>{modeAjout ? '➕ Ajouter des produits' : '📦 Mes produits'}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
                  {modeAjout
                    ? 'Choisissez dans le catalogue les produits que vous vendez, fixez votre prix et votre stock.'
                    : 'Voici les produits que vous proposez. Modifiez votre prix et votre stock (0 = rupture).'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={S.btn(modeAjout ? '#fff' : '#1A2332', modeAjout ? '#1A2332' : '#fff')}
                  onClick={() => { setModeAjout(!modeAjout); setRechercheProd('') }}>
                  {modeAjout ? '← Retour à mes produits' : '➕ Ajouter un produit'}
                </button>
                {nbModifs > 0 && (
                  <button style={S.btn(saving ? '#ccc' : '#1b5e20')} onClick={sauvegarderStocks} disabled={saving}>
                    {saving ? 'Sauvegarde…' : `✓ Enregistrer (${nbModifs})`}
                  </button>
                )}
              </div>
            </div>

            <input placeholder="🔍 Chercher un produit ou une catégorie..." value={rechercheProd}
              onChange={e => setRechercheProd(e.target.value)}
              style={{ ...S.input, marginBottom: 12 }}/>

            {/* Aucun produit proposé encore */}
            {!modeAjout && mesProduits.length === 0 && (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#888' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
                <div style={{ fontWeight: 700, color: '#1A2332', marginBottom: 4 }}>Vous ne proposez encore aucun produit</div>
                <div style={{ fontSize: 13, marginBottom: 14 }}>Ajoutez les produits que vous vendez pour apparaître auprès des clients.</div>
                <button style={S.btn()} onClick={() => setModeAjout(true)}>➕ Ajouter mon premier produit</button>
              </div>
            )}

            {(modeAjout || mesProduits.length > 0) && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9f9f7' }}>
                    {['Produit', 'Catégorie', 'Mon prix', 'Prix moyen site', 'Mon stock', 'Statut'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #eee' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {produitsAffiches.slice(0, 100).map(p => {
                    const qte = getStock(p.id)
                    const prix = getPrix(p.id)
                    const moy = prixMoyens[p.id]
                    const enModif = modifStocks[p.id] !== undefined || modifPrix[p.id] !== undefined
                    return (
                      <tr key={p.id}
                        style={{ background: enModif ? '#f0fff4' : '' }}
                        onMouseEnter={e => { if (!enModif) (e.currentTarget as HTMLElement).style.background = '#fafafa' }}
                        onMouseLeave={e => { if (!enModif) (e.currentTarget as HTMLElement).style.background = '' }}>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5', fontWeight: 600, color: '#1A2332', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5' }}>
                          <span style={{ background: '#f0f0f0', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{p.categorie}</span>
                        </td>
                        {/* Mon prix */}
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5' }}>
                          <input
                            type="number" min={0}
                            value={modifPrix[p.id] !== undefined ? modifPrix[p.id] : prix ?? ''}
                            placeholder="Prix FCFA"
                            onChange={e => {
                              const v = e.target.value === '' ? undefined : Number(e.target.value)
                              if (v === undefined) {
                                setModifPrix(prev => { const n = {...prev}; delete n[p.id]; return n })
                              } else {
                                setModifPrix(prev => ({ ...prev, [p.id]: v }))
                              }
                            }}
                            style={{ width: 100, padding: '5px 10px', border: `1.5px solid ${modifPrix[p.id] !== undefined ? '#C0392B' : '#ddd'}`, borderRadius: 8, fontSize: 13, textAlign: 'right' }}
                          />
                          <span style={{ fontSize: 11, color: '#bbb', marginLeft: 6 }}>FCFA</span>
                        </td>
                        {/* Prix moyen du site */}
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5', fontSize: 12 }}>
                          {moy ? (
                            <span title={`Moyenne de ${moy.nb_partenaires} magasin(s)`} style={{ color: '#1A2332', fontWeight: 600 }}>
                              {moy.prix_moyen.toLocaleString('fr-FR')} FCFA
                              <span style={{ color: '#bbb', fontWeight: 400 }}> · {moy.nb_partenaires} mag.</span>
                            </span>
                          ) : (
                            <span style={{ color: '#bbb' }}>—</span>
                          )}
                        </td>
                        {/* Mon stock */}
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5' }}>
                          <input
                            type="number" min={0}
                            value={modifStocks[p.id] !== undefined ? modifStocks[p.id] : qte ?? ''}
                            placeholder={qte === null ? '0' : String(qte)}
                            onChange={e => {
                              const v = e.target.value === '' ? undefined : Number(e.target.value)
                              if (v === undefined) {
                                setModifStocks(prev => { const n = {...prev}; delete n[p.id]; return n })
                              } else {
                                setModifStocks(prev => ({ ...prev, [p.id]: v }))
                              }
                            }}
                            style={{ width: 70, padding: '5px 10px', border: `1.5px solid ${modifStocks[p.id] !== undefined ? '#C0392B' : '#ddd'}`, borderRadius: 8, fontSize: 13, textAlign: 'center' }}
                          />
                          <span style={{ fontSize: 11, color: '#bbb', marginLeft: 6 }}>{p.unite}</span>
                        </td>
                        {/* Statut */}
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5' }}>
                          {qte === null ? (
                            <span style={{ color: '#bbb', fontSize: 12 }}>—</span>
                          ) : qte === 0 ? (
                            <span style={{ background: '#fce8e8', color: '#c62828', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>✗ Rupture</span>
                          ) : (
                            <span style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>✓ {qte} en stock</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {produitsAffiches.length > 100 && (
                <p style={{ fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 10 }}>
                  100 produits affichés sur {produitsAffiches.length}. Affinez votre recherche pour voir les autres.
                </p>
              )}
            </div>
            )}

            {nbModifs > 0 && (
              <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
                <button style={{ ...S.btn(saving ? '#ccc' : '#1b5e20'), padding: '12px 24px', fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}
                  onClick={sauvegarderStocks} disabled={saving}>
                  {saving ? 'Sauvegarde…' : `✓ Enregistrer ${nbModifs} modification${nbModifs > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* INFOS MAGASIN */}
        {onglet === 'infos' && (
          <div style={S.card}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>⚙️ Informations de mon magasin</h3>
            <form onSubmit={sauvegarderInfos} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { key: 'nom', label: 'Nom du magasin' },
                { key: 'telephone', label: 'Téléphone' },
                { key: 'adresse', label: 'Adresse' },
                { key: 'quartier', label: 'Quartier' },
                { key: 'horaires', label: 'Horaires d\'ouverture' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input value={form[f.key] || ''} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} style={S.input}/>
                </div>
              ))}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea value={form.description || ''} rows={3}
                  onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  style={{ ...S.input, resize: 'vertical' }}/>
              </div>
              <div style={{ gridColumn: '1/-1', paddingTop: 4 }}>
                <div style={{ background: '#fff3cd', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#856404', marginBottom: 12 }}>
                  ⚠️ Votre prix et votre stock se gèrent dans l'onglet « Mes produits ». Votre statut est géré par BatiShop. Pour toute question : <a href="tel:+237600000000" style={{ color: '#C0392B' }}>+237 6XX XXX XXX</a>
                </div>
                <button type="submit" disabled={saving} style={S.btn(saving ? '#ccc' : undefined)}>
                  {saving ? 'Sauvegarde…' : '✓ Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
