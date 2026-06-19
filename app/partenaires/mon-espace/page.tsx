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
  const [entreprise, setEntreprise] = useState<any>(null)
  const [boutiques, setBoutiques] = useState<any[]>([])
  const [magasin, setMagasin] = useState<any>(null)
  const [produits, setProduits] = useState<any[]>([])
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState<'dashboard'|'commandes'|'stocks'|'infos'>('dashboard')
  const [commandes, setCommandes] = useState<any[]>([])
  const [loadingCmd, setLoadingCmd] = useState(false)
  const [majCmd, setMajCmd] = useState('')
  const [saving, setSaving] = useState(false)
  const [succes, setSucces] = useState('')
  const [form, setForm] = useState<any>({})
  const [modifStocks, setModifStocks] = useState<Record<string, number>>({})
  const [modifPrix, setModifPrix] = useState<Record<string, number>>({})
  const [modifPromo, setModifPromo] = useState<Record<string, number | null>>({})
  const [stocksParBoutique, setStocksParBoutique] = useState<Record<string, any[]>>({})
  const [vueStock, setVueStock] = useState<'ville' | 'magasin'>('ville')
  const [vueCmd, setVueCmd] = useState<'ville' | 'magasin'>('ville')
  const [openProd, setOpenProd] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
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
      const uid = JSON.parse(u||'{}').id

      // Vérifier que le token est encore valide (il expire au bout d'~1h)
      const me = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${t}` } })
      if (!me.ok) {
        localStorage.removeItem('batishop_partenaire_token')
        localStorage.removeItem('batishop_partenaire_user')
        router.push('/partenaires/connexion'); return
      }

      // L'entreprise (statut, identité) — le compte gère toute l'enseigne
      const ents = await apiAuth(`entreprises?user_id=eq.${uid}&select=*`, t!)
      if (ents && ents.length) setEntreprise(ents[0])

      // Toutes les boutiques rattachées à ce compte
      const mag = await apiAuth(`partenaires_magasins?user_id=eq.${uid}&select=*&order=ville.asc`, t!)
      if (mag === null) {
        // Lecture refusée (token invalide) → reconnexion
        localStorage.removeItem('batishop_partenaire_token')
        localStorage.removeItem('batishop_partenaire_user')
        router.push('/partenaires/connexion'); return
      }
      if (mag.length === 0) { router.push('/partenaires'); return }
      setBoutiques(mag)
      const m = mag[0]
      setMagasin(m)
      setForm({ nom: m.nom, telephone: m.telephone, adresse: m.adresse, quartier: m.quartier, horaires: m.horaires, description: m.description, latitude: m.latitude ?? '', longitude: m.longitude ?? '' })

      // Charger TOUS les produits BatiShop
      const prods = await apiAuth('produits?select=id,nom,categorie,reference,prix,unite&actif=eq.true&order=nom.asc', t!)
      setProduits(prods || [])

      // Charger les stocks de TOUTES les boutiques du compte (pour la vue par ville)
      const ids = mag.map((b: any) => b.id)
      const allStks = ids.length ? await apiAuth(`stocks_partenaires?partenaire_id=in.(${ids.join(',')})&select=*`, t!) : []
      const parB: Record<string, any[]> = {}
      ;(allStks || []).forEach((s: any) => { (parB[s.partenaire_id] = parB[s.partenaire_id] || []).push(s) })
      setStocksParBoutique(parB)
      setStocks(parB[m.id] || [])

      // Charger les commandes (sous-commandes) de toute la ville par défaut
      const idsVille = mag.filter((b: any) => b.ville === m.ville).map((b: any) => b.id)
      const selC = encodeURIComponent('*,partenaires_magasins(nom,ville,quartier),commandes(client_nom,client_telephone,client_adresse,client_ville,client_latitude,client_longitude),commande_lignes(*)')
      const cmds = idsVille.length ? await apiAuth(`sous_commandes?point_vente_id=in.(${idsVille.join(',')})&select=${selC}&order=created_at.desc`, t!) : []
      setCommandes(Array.isArray(cmds) ? cmds : [])

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

  // Changer de boutique : recharge les stocks de la boutique choisie
  const choisirBoutique = async (b: any) => {
    setMagasin(b)
    setForm({ nom: b.nom, telephone: b.telephone, adresse: b.adresse, quartier: b.quartier, horaires: b.horaires, description: b.description, latitude: b.latitude ?? '', longitude: b.longitude ?? '' })
    setModifStocks({}); setModifPrix({}); setModifPromo({}); setModeAjout(false); setVueStock('ville'); setVueCmd('ville')
    const stks = await apiAuth(`stocks_partenaires?partenaire_id=eq.${b.id}&select=*`, token)
    setStocksParBoutique(prev => ({ ...prev, [b.id]: stks || [] }))
    setStocks(stks || [])
    chargerCommandes('ville', b)
  }

  const chargerCommandes = async (vue: 'ville' | 'magasin' = vueCmd, mag: any = magasin) => {
    if (!mag) return
    setLoadingCmd(true)
    const ids = vue === 'ville' ? boutiques.filter(b => b.ville === mag.ville).map(b => b.id) : [mag.id]
    const sel = encodeURIComponent('*,partenaires_magasins(nom,ville,quartier),commandes(client_nom,client_telephone,client_adresse,client_ville,client_latitude,client_longitude),commande_lignes(*)')
    const data = ids.length ? await apiAuth(`sous_commandes?point_vente_id=in.(${ids.join(',')})&select=${sel}&order=created_at.desc`, token) : []
    setCommandes(Array.isArray(data) ? data : [])
    setLoadingCmd(false)
  }

  const changerStatutSC = async (sc: any, statut: string) => {
    await apiAuth(`sous_commandes?id=eq.${sc.id}`, token, { method: 'PATCH', body: JSON.stringify({ statut }) })
    setCommandes(prev => prev.map(x => x.id === sc.id ? { ...x, statut } : x))
    setMajCmd('✓ Statut mis à jour'); setTimeout(() => setMajCmd(''), 2000)
  }


  const maPosition = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { alert('Géolocalisation non supportée par ce navigateur'); return }
    navigator.geolocation.getCurrentPosition(
      p => setForm((f: any) => ({ ...f, latitude: p.coords.latitude.toFixed(6), longitude: p.coords.longitude.toFixed(6) })),
      () => alert('Position refusée ou indisponible. Vous pouvez coller les coordonnées depuis Google Maps.'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const sauvegarderInfos = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const lat = parseFloat(form.latitude), lng = parseFloat(form.longitude)
    const payload = { ...form, latitude: isNaN(lat) ? null : lat, longitude: isNaN(lng) ? null : lng }
    await apiAuth(`partenaires_magasins?id=eq.${magasin.id}`, token, { method: 'PATCH', body: JSON.stringify(payload) })
    setMagasin((m: any) => ({ ...m, ...payload }))
    setSucces('✓ Informations mises à jour')
    setSaving(false)
    setTimeout(() => setSucces(''), 3000)
  }

  const sauvegarderStocks = async () => {
    setSaving(true)
    let ok = 0
    const idsModifies = Array.from(new Set([...Object.keys(modifStocks), ...Object.keys(modifPrix), ...Object.keys(modifPromo)]))
    const cibles = vueStock === 'ville' ? boutiques.filter(b => magasin && b.ville === magasin.ville) : (magasin ? [magasin] : [])
    for (const produitId of idsModifies) {
      for (const b of cibles) {
        const rows = stocksParBoutique[b.id] || []
        const existant = rows.find(s => s.produit_id === produitId)
        const qte = modifStocks[produitId] !== undefined ? modifStocks[produitId] : (existant?.quantite ?? 0)
        const prix = modifPrix[produitId] !== undefined ? modifPrix[produitId] : (existant?.prix_local ?? null)
        let promo = modifPromo[produitId] !== undefined ? modifPromo[produitId] : (existant?.prix_local_ancien ?? null)
        if (!promo || (prix && promo <= prix)) promo = null
        if (existant) {
          await apiAuth(`stocks_partenaires?id=eq.${existant.id}`, token, {
            method: 'PATCH',
            body: JSON.stringify({ quantite: qte, prix_local: prix, prix_local_ancien: promo, disponible_immediat: qte > 0 })
          })
          existant.quantite = qte; existant.prix_local = prix; existant.prix_local_ancien = promo; existant.disponible_immediat = qte > 0
        } else {
          const nouveau = await apiAuth('stocks_partenaires', token, {
            method: 'POST',
            body: JSON.stringify({ partenaire_id: b.id, produit_id: produitId, quantite: qte, prix_local: prix, prix_local_ancien: promo, disponible_immediat: qte > 0 })
          })
          const row = Array.isArray(nouveau) ? nouveau[0] : nouveau
          if (row) (stocksParBoutique[b.id] = stocksParBoutique[b.id] || []).push(row)
        }
      }
      ok++
    }
    setStocksParBoutique({ ...stocksParBoutique })
    if (magasin) setStocks(stocksParBoutique[magasin.id] || [])
    setModifStocks({}); setModifPrix({}); setModifPromo({}); setModeAjout(false)
    setSucces(`✓ ${ok} produit${ok > 1 ? 's' : ''} mis à jour${vueStock === 'ville' ? ' (toute la ville)' : ''}`)
    setSaving(false)
    setTimeout(() => setSucces(''), 3000)
  }

  // Boutiques de la même ville que la boutique sélectionnée
  const boutiquesVille = boutiques.filter(b => magasin && b.ville === magasin.ville)
  const boutiquesActives = vueStock === 'ville' ? boutiquesVille : (magasin ? [magasin] : [])
  const idsActifs = boutiquesActives.map(b => b.id)

  // Toutes les lignes de stock d'un produit sur les boutiques actives
  const lignesProduit = (pid: string) =>
    idsActifs.flatMap(bid => (stocksParBoutique[bid] || []).filter(s => s.produit_id === pid))

  // Quantité totale (somme sur les boutiques actives)
  const getStockTotal = (pid: string) => lignesProduit(pid).reduce((s, r) => s + (r.quantite || 0), 0)

  // Fourchette de prix sur les boutiques actives
  const getPrixRange = (pid: string) => {
    const prix = lignesProduit(pid).map(r => r.prix_local).filter((x: any) => x != null) as number[]
    if (!prix.length) return null
    return { min: Math.min(...prix), max: Math.max(...prix) }
  }

  // Valeurs des champs d'édition
  const getPrix = (produitId: string) => {
    if (modifPrix[produitId] !== undefined) return modifPrix[produitId]
    if (vueStock === 'magasin') return lignesProduit(produitId)[0]?.prix_local ?? null
    const r = getPrixRange(produitId)
    return r && r.min === r.max ? r.min : null // vue ville : pré-rempli seulement si prix uniforme
  }

  const getPromo = (produitId: string) => {
    if (modifPromo[produitId] !== undefined) return modifPromo[produitId]
    if (vueStock === 'magasin') return lignesProduit(produitId)[0]?.prix_local_ancien ?? null
    return null
  }

  const getStock = (produitId: string) => {
    if (modifStocks[produitId] !== undefined) return modifStocks[produitId]
    if (vueStock === 'magasin') return lignesProduit(produitId)[0]?.quantite ?? null
    return null // vue ville : champ vide (saisir une valeur l'applique à tous les magasins)
  }

  const nbEnStock = produits.filter(p => getStockTotal(p.id) > 0).length
  const nbModifs = new Set([...Object.keys(modifStocks), ...Object.keys(modifPrix), ...Object.keys(modifPromo)]).size

  // IDs des produits déclarés sur au moins une boutique active
  const idsDeclares = new Set(boutiquesActives.flatMap(b => (stocksParBoutique[b.id] || []).map(s => s.produit_id)))

  const matchRecherche = (p: any) =>
    !rechercheProd || p.nom.toLowerCase().includes(rechercheProd.toLowerCase()) || (p.categorie || '').toLowerCase().includes(rechercheProd.toLowerCase())

  // Mes produits : uniquement ceux que je propose
  const mesProduits = produits.filter(p => idsDeclares.has(p.id) && matchRecherche(p))
  // Catalogue à ajouter : tous les autres
  const produitsAjoutables = produits.filter(p => !idsDeclares.has(p.id) && matchRecherche(p))

  const produitsAffiches = modeAjout ? produitsAjoutables : mesProduits

  const fmtFcfa = (n: number) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'
  const STATUT_SC: Record<string, { label: string; bg: string; c: string }> = {
    en_attente:  { label: 'En attente',   bg: '#fff3e0', c: '#e65100' },
    confirmee:   { label: 'Confirmée',    bg: '#e3f2fd', c: '#1565c0' },
    prete:       { label: 'Prête',        bg: '#e8f5e9', c: '#1b5e20' },
    en_livraison:{ label: 'En livraison', bg: '#f3e5f5', c: '#6a1b9a' },
    livree:      { label: 'Livrée',       bg: '#e8f5e9', c: '#1b5e20' },
    retiree:     { label: 'Retirée',      bg: '#e8f5e9', c: '#1b5e20' },
    annulee:     { label: 'Annulée',      bg: '#ffebee', c: '#b71c1c' },
  }
  // Prochaines actions possibles selon le mode et le statut actuel
  const actionsSC = (sc: any): { statut: string; label: string; couleur: string }[] => {
    if (sc.statut === 'en_attente') return [
      { statut: 'confirmee', label: '✓ Confirmer', couleur: '#1565c0' },
      { statut: 'annulee', label: '✕ Refuser', couleur: '#b71c1c' },
    ]
    if (sc.statut === 'confirmee') return sc.mode === 'livraison'
      ? [{ statut: 'en_livraison', label: '🚚 En livraison', couleur: '#6a1b9a' }, { statut: 'annulee', label: '✕ Annuler', couleur: '#b71c1c' }]
      : [{ statut: 'prete', label: '📦 Prête pour retrait', couleur: '#1b5e20' }, { statut: 'annulee', label: '✕ Annuler', couleur: '#b71c1c' }]
    if (sc.statut === 'prete') return [{ statut: 'retiree', label: '✓ Retirée par le client', couleur: '#1b5e20' }]
    if (sc.statut === 'en_livraison') return [{ statut: 'livree', label: '✓ Livrée', couleur: '#1b5e20' }]
    return []
  }
  const cmdActives = commandes.filter(c => !['annulee'].includes(c.statut))
  const cmdEnCours = commandes.filter(c => ['en_attente','confirmee','prete','en_livraison'].includes(c.statut))
  const caRealise = commandes.filter(c => ['livree','retiree'].includes(c.statut)).reduce((s, c) => s + (c.total || 0), 0)
  const caEnCours = cmdEnCours.reduce((s, c) => s + (c.total || 0), 0)
  const waClient = (tel: string) => `https://wa.me/237${String(tel || '').replace(/\D/g, '').replace(/^237/, '')}`


  const S: any = {
    page: { minHeight: '100vh', background: '#f5f5f3', fontFamily: 'system-ui,sans-serif', fontSize: 14 },
    header: { background: '#1A2332', color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
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

  const statutEntreprise = entreprise?.statut || magasin?.statut
  if (['suspendu','exclu','inactif','refuse'].includes(statutEntreprise)) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f3', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, maxWidth: 440, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{['exclu','refuse'].includes(statutEntreprise) ? '🚫' : '⏸'}</div>
        <h2 style={{ color: '#1A2332', marginBottom: 8 }}>Compte {statutEntreprise === 'refuse' ? 'refusé' : statutEntreprise === 'exclu' ? 'exclu' : statutEntreprise === 'inactif' ? 'désactivé' : 'suspendu'}</h2>
        <div style={{ background: '#fce8e8', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'left', fontSize: 13 }}>
          Votre compte n’est pas actif sur BatiShop. Contactez-nous pour en savoir plus.
        </div>
        <a href="tel:+237600000000" style={{ display: 'inline-block', padding: '10px 24px', background: '#C0392B', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>📞 Contacter BatiShop</a>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
          <div style={{ width: 38, height: 38, background: '#C0392B', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏪</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{entreprise?.nom || magasin?.nom}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{magasin?.ville} · {statutEntreprise === 'actif' ? '✓ Actif sur BatiShop' : statutEntreprise}</div>
          </div>
          {boutiques.length > 1 && (
            <select
              value={magasin?.id || ''}
              onChange={e => { const b = boutiques.find(x => x.id === e.target.value); if (b) choisirBoutique(b) }}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', maxWidth: '100%' }}>
              {boutiques.map(b => (
                <option key={b.id} value={b.id} style={{ color: '#222' }}>
                  {b.ville} — {b.quartier}{b.actif ? '' : ' (masquée)'}
                </option>
              ))}
            </select>
          )}
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

        {boutiques.length > 1 && (
          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', padding: '8px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
            🏬 Vous gérez la boutique <strong>{magasin?.ville} — {magasin?.quartier}</strong>. Stocks et prix sont propres à cette boutique. Changez de boutique en haut à droite.
          </div>
        )}

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 2, background: '#fff', borderRadius: 10, padding: 4, marginBottom: 20, border: '1px solid #e8e8e8', width: 'fit-content' }}>
          <button style={S.tab(onglet === 'dashboard')} onClick={() => setOnglet('dashboard')}>📊 Tableau de bord</button>
          <button style={S.tab(onglet === 'commandes')} onClick={() => setOnglet('commandes')}>
            🧾 Commandes
            {cmdEnCours.filter(c => c.statut === 'en_attente').length > 0 && <span style={{ background: '#C0392B', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, marginLeft: 6 }}>{cmdEnCours.filter(c => c.statut === 'en_attente').length}</span>}
          </button>
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

        {/* COMMANDES */}
        {onglet === 'commandes' && (
          <div>
            {majCmd && <div style={{ background: '#e8f5e9', color: '#1b5e20', padding: '8px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>{majCmd}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={S.stat}><div style={{ fontWeight: 800, fontSize: 24, color: '#C0392B' }}>{cmdEnCours.length}</div><div style={{ fontSize: 12, color: '#888' }}>À traiter / en cours</div></div>
              <div style={S.stat}><div style={{ fontWeight: 800, fontSize: 22, color: '#1b5e20' }}>{fmtFcfa(caRealise)}</div><div style={{ fontSize: 12, color: '#888' }}>CA réalisé (livré/retiré)</div></div>
              <div style={S.stat}><div style={{ fontWeight: 800, fontSize: 22, color: '#1565c0' }}>{fmtFcfa(caEnCours)}</div><div style={{ fontSize: 12, color: '#888' }}>En cours</div></div>
            </div>

            {/* Vue : toute la ville ou un magasin précis */}
            {boutiquesVille.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Vue :</span>
                <button onClick={() => { setVueCmd('ville'); chargerCommandes('ville', magasin) }} style={S.tab(vueCmd === 'ville')}>🏙️ Toute la ville{magasin ? ` (${magasin.ville})` : ''}</button>
                <button onClick={() => { setVueCmd('magasin'); chargerCommandes('magasin', magasin) }} style={S.tab(vueCmd === 'magasin')}>🏪 Ce magasin{magasin ? ` (${magasin.quartier})` : ''}</button>
              </div>
            )}

            {loadingCmd ? (
              <div style={{ ...S.card, textAlign: 'center', color: '#999' }}>Chargement…</div>
            ) : commandes.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', color: '#999', padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
                <div style={{ fontWeight: 700, color: '#666' }}>Aucune commande{vueCmd === 'ville' ? ' dans cette ville' : ' pour ce magasin'}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Les commandes des clients apparaîtront ici dès qu'elles arrivent.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {commandes.map((sc: any) => {
                  const st = STATUT_SC[sc.statut] || STATUT_SC.en_attente
                  const cl = sc.commandes || {}
                  const actions = actionsSC(sc)
                  return (
                    <div key={sc.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f9f9f7', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
                        <span style={{ background: sc.mode === 'livraison' ? '#f3e5f5' : '#e3f2fd', color: sc.mode === 'livraison' ? '#6a1b9a' : '#1565c0', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                          {sc.mode === 'livraison' ? '🚚 Livraison' : '📦 Retrait'}
                        </span>
                        <span style={{ background: st.bg, color: st.c, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{st.label}</span>
                        {vueCmd === 'ville' && sc.partenaires_magasins && (
                          <span style={{ background: '#fff3e0', color: '#e65100', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>🏪 {sc.partenaires_magasins.quartier || sc.partenaires_magasins.nom}</span>
                        )}
                        <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#1A2332' }}>{fmtFcfa(sc.total)}</span>
                      </div>

                      {/* Client */}
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                        <div style={{ fontWeight: 700, color: '#1A2332' }}>{cl.client_nom || 'Client'}</div>
                        <div style={{ color: '#888', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
                          <a href={`tel:${cl.client_telephone}`} style={{ color: '#1565c0', textDecoration: 'none' }}>📞 {cl.client_telephone}</a>
                          <a href={waClient(cl.client_telephone)} target="_blank" rel="noopener" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>WhatsApp</a>
                          {sc.mode === 'livraison' && (cl.client_adresse || sc.adresse_livraison) && (
                            <span>📍 {sc.adresse_livraison ? sc.adresse_livraison.split(' — 📍')[0] : `${cl.client_adresse}, ${cl.client_ville || ''}`}</span>
                          )}
                          {sc.mode === 'livraison' && cl.client_latitude && (
                            <a href={`https://maps.google.com/?q=${cl.client_latitude},${cl.client_longitude}`} target="_blank" rel="noopener" style={{ color: '#C0392B', textDecoration: 'none', fontWeight: 600 }}>Carte GPS →</a>
                          )}
                        </div>
                      </div>

                      {/* Lignes */}
                      {(sc.commande_lignes || []).map((l: any) => (
                        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #f7f7f7', fontSize: 13 }}>
                          <span style={{ color: '#333' }}>{l.nom} <span style={{ color: '#aaa' }}>×{l.quantite} {l.unite || ''}</span></span>
                          <span style={{ fontWeight: 600, color: '#C0392B' }}>{fmtFcfa(l.sous_total)}</span>
                        </div>
                      ))}
                      {sc.frais_livraison > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: 12, color: '#888' }}>
                          <span>Frais de livraison</span><span>{fmtFcfa(sc.frais_livraison)}</span>
                        </div>
                      )}

                      {/* Actions */}
                      {actions.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', flexWrap: 'wrap', borderTop: '1px solid #f0f0f0' }}>
                          {actions.map(a => (
                            <button key={a.statut} onClick={() => changerStatutSC(sc, a.statut)}
                              style={{ background: a.couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
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

            {/* Vue : toute la ville (agrégé) ou un magasin précis */}
            {boutiquesVille.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Vue :</span>
                <button onClick={() => { setVueStock('ville'); setModifStocks({}); setModifPrix({}); setModifPromo({}) }}
                  style={S.tab(vueStock === 'ville')}>🏙️ Toute la ville{magasin ? ` (${magasin.ville})` : ''}</button>
                <button onClick={() => { setVueStock('magasin'); setModifStocks({}); setModifPrix({}); setModifPromo({}) }}
                  style={S.tab(vueStock === 'magasin')}>🏪 Ce magasin{magasin ? ` (${magasin.quartier})` : ''}</button>
                {vueStock === 'ville' && (
                  <span style={{ fontSize: 11, color: '#999' }}>· {boutiquesVille.length} magasins · une saisie s'applique à tous</span>
                )}
              </div>
            )}

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
            isMobile ? (
              <div>
                {produitsAffiches.slice(0, 100).map(p => {
                  const prix = getPrix(p.id)
                  const total = getStockTotal(p.id)
                  const range = getPrixRange(p.id)
                  const moy = prixMoyens[p.id]
                  const declared = idsDeclares.has(p.id)
                  const enModif = modifStocks[p.id] !== undefined || modifPrix[p.id] !== undefined || modifPromo[p.id] !== undefined
                  const open = openProd === p.id
                  const lbl = { fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, display: 'block', marginBottom: 4 }
                  const fld = (mod: boolean) => ({ width: '100%', padding: '10px 12px', border: `1.5px solid ${mod ? '#C0392B' : '#ddd'}`, borderRadius: 8, fontSize: 15, boxSizing: 'border-box' as const })
                  const hint = { fontSize: 11, color: '#999', marginTop: 4 }
                  return (
                    <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 10, marginBottom: 8, background: enModif ? '#f0fff4' : '#fff', overflow: 'hidden' }}>
                      <button onClick={() => setOpenProd(open ? null : p.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#1A2332', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nom}</div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                            {!declared ? 'Non proposé' : total === 0 ? '✗ Rupture' : `✓ ${total} en stock`}{prix != null ? ` · ${fmtFcfa(prix)}` : ''}
                          </div>
                        </div>
                        <span style={{ color: '#C0392B', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{open ? '−' : '+'}</span>
                      </button>
                      {open && (
                        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label style={lbl}>Mon prix (FCFA)</label>
                            <input type="number" min={0} placeholder="Prix FCFA"
                              value={modifPrix[p.id] !== undefined ? modifPrix[p.id] : prix ?? ''}
                              onChange={e => { const v = e.target.value === '' ? undefined : Number(e.target.value); if (v === undefined) setModifPrix(prev => { const n = { ...prev }; delete n[p.id]; return n }); else setModifPrix(prev => ({ ...prev, [p.id]: v })) }}
                              style={fld(modifPrix[p.id] !== undefined)} />
                            {vueStock === 'ville' && range && (
                              <div style={hint}>Prix dans la ville : {range.min.toLocaleString('fr-FR')}{range.min !== range.max ? ` – ${range.max.toLocaleString('fr-FR')}` : ''} FCFA</div>
                            )}
                          </div>
                          <div>
                            <label style={lbl}>Ancien prix (promo, optionnel)</label>
                            <input type="number" min={0} placeholder="Ancien prix barré"
                              value={modifPromo[p.id] !== undefined ? (modifPromo[p.id] ?? '') : (getPromo(p.id) ?? '')}
                              onChange={e => { const v = e.target.value === '' ? null : Number(e.target.value); setModifPromo(prev => ({ ...prev, [p.id]: v })) }}
                              style={fld(modifPromo[p.id] !== undefined)} />
                          </div>
                          <div>
                            <label style={lbl}>Mon stock{vueStock === 'ville' ? ' (appliqué à tous les magasins)' : ''}</label>
                            <input type="number" min={0}
                              placeholder={vueStock === 'ville' ? 'Quantité (tous)' : '0'}
                              value={modifStocks[p.id] !== undefined ? modifStocks[p.id] : getStock(p.id) ?? ''}
                              onChange={e => { const v = e.target.value === '' ? undefined : Number(e.target.value); if (v === undefined) setModifStocks(prev => { const n = { ...prev }; delete n[p.id]; return n }); else setModifStocks(prev => ({ ...prev, [p.id]: v })) }}
                              style={fld(modifStocks[p.id] !== undefined)} />
                            {vueStock === 'ville' && (<div style={hint}>Total ville : {total} {p.unite}</div>)}
                          </div>
                          <div style={{ fontSize: 12, color: '#888', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                            Prix moyen du site : {moy ? `${moy.prix_moyen.toLocaleString('fr-FR')} FCFA · ${moy.nb_partenaires} mag.` : '—'}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {produitsAffiches.length > 100 && (
                  <p style={{ fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 10 }}>100 produits affichés sur {produitsAffiches.length}. Affinez votre recherche pour voir les autres.</p>
                )}
              </div>
            ) : (
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
                    const total = getStockTotal(p.id)
                    const range = getPrixRange(p.id)
                    const moy = prixMoyens[p.id]
                    const enModif = modifStocks[p.id] !== undefined || modifPrix[p.id] !== undefined || modifPromo[p.id] !== undefined
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
                          {vueStock === 'ville' && range && (
                            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                              Ville : {range.min.toLocaleString('fr-FR')}{range.min !== range.max ? ` – ${range.max.toLocaleString('fr-FR')}` : ''} FCFA
                            </div>
                          )}
                          <div style={{ marginTop: 5 }}>
                            <input
                              type="number" min={0}
                              value={modifPromo[p.id] !== undefined ? (modifPromo[p.id] ?? '') : (getPromo(p.id) ?? '')}
                              placeholder="Ancien prix"
                              title="Ancien prix barré pour une promo. Doit être supérieur à ton prix actuel."
                              onChange={e => {
                                const v = e.target.value === '' ? null : Number(e.target.value)
                                setModifPromo(prev => ({ ...prev, [p.id]: v }))
                              }}
                              style={{ width: 100, padding: '4px 10px', border: `1.5px solid ${modifPromo[p.id] !== undefined ? '#C0392B' : '#eee'}`, borderRadius: 8, fontSize: 12, textAlign: 'right', color: '#C0392B' }}
                            />
                            <span style={{ fontSize: 10, color: '#bbb', marginLeft: 4 }}>promo (barré)</span>
                          </div>
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
                            placeholder={vueStock === 'ville' ? 'Qté (tous)' : (qte === null ? '0' : String(qte))}
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
                          {vueStock === 'ville' && (
                            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>Total ville : {total} {p.unite}</div>
                          )}
                        </td>
                        {/* Statut */}
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5' }}>
                          {!idsDeclares.has(p.id) ? (
                            <span style={{ color: '#bbb', fontSize: 12 }}>—</span>
                          ) : total === 0 ? (
                            <span style={{ background: '#fce8e8', color: '#c62828', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>✗ Rupture</span>
                          ) : (
                            <span style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>✓ {total} en stock</span>
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
            ) )}

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

              {/* Position géographique */}
              <div style={{ gridColumn: '1/-1', background: '#f9f9f7', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>📍 Position de ma boutique</div>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px' }}>
                  Permet aux clients de vous trouver et de trier par distance. Cliquez sur « Ma position » si vous êtes
                  dans la boutique, ou collez les coordonnées depuis Google Maps (clic droit sur le lieu → cliquez sur les chiffres pour les copier).
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>Latitude</label>
                    <input value={form.latitude || ''} onChange={e => setForm((p: any) => ({ ...p, latitude: e.target.value }))} placeholder="4.0489" style={{ ...S.input, width: 140 }}/>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>Longitude</label>
                    <input value={form.longitude || ''} onChange={e => setForm((p: any) => ({ ...p, longitude: e.target.value }))} placeholder="9.7020" style={{ ...S.input, width: 140 }}/>
                  </div>
                  <button type="button" onClick={maPosition} style={S.btn('#1A2332')}>📍 Ma position</button>
                  {form.latitude && form.longitude && (
                    <a href={`https://maps.google.com/?q=${form.latitude},${form.longitude}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#C0392B', textDecoration: 'none', fontWeight: 600 }}>Vérifier sur la carte →</a>
                  )}
                </div>
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
