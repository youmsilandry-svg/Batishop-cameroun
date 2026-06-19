'use client'
import { useState, useEffect } from 'react'
import { MapPin, Clock, Navigation, Store, Package, Zap, ShoppingCart, Minus, Plus, Check } from 'lucide-react'
import { supabase, VILLES, formatPrix } from '../../lib/supabase'
import { ajouterLignePanier } from '../../lib/panier'

const TRIS = [
  { id: 'pertinence', label: 'Pertinence', icon: '⭐' },
  { id: 'prix',       label: 'Prix',        icon: '💰' },
  { id: 'proche',     label: 'Plus proche', icon: '📍' },
]

// Distance approximative (km) entre deux points GPS
const haversine = (la1: number, lo1: number, la2: number, lo2: number) => {
  const R = 6371, toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(la2 - la1), dLon = toRad(lo2 - lo1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function OuTrouver({ produitId, produitNom }: { produitId: string; produitNom: string }) {
  const [ville, setVille] = useState('Douala')
  const [tri, setTri] = useState('pertinence')
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [geoErr, setGeoErr] = useState('')
  const [partenaires, setPartenaires] = useState<any[]>([])
  const [prixMoyen, setPrixMoyen] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [cherche, setCherche] = useState(false)
  const [produit, setProduit] = useState<any>(null)
  const [exclVille, setExclVille] = useState<any[]>([])
  const [qtes, setQtes] = useState<Record<string, number>>({})
  const [ajoute, setAjoute] = useState<Record<string, boolean>>({})

  const getQte = (k: string) => (qtes[k] === undefined ? 1 : qtes[k])
  const setQte = (k: string, v: number, max: number) => setQtes(p => ({ ...p, [k]: Math.min(max, Math.max(0, v)) }))

  // Produit (prix, unité…) + exclusivités
  useEffect(() => {
    supabase.from('produits')
      .select('id, nom, prix, unite, image_url, reference, categorie, stock, partenaire_exclusif, produit_partenaire')
      .eq('id', produitId).maybeSingle()
      .then(({ data }) => setProduit(data))
    supabase.from('exclusivites_ville').select('ville, partenaire_id').eq('produit_id', produitId).eq('actif', true)
      .then(({ data }) => setExclVille(data || []))
  }, [produitId])

  // Prix moyen du site
  useEffect(() => {
    supabase.from('prix_moyen_partenaires')
      .select('prix_moyen, prix_min, prix_max, nb_partenaires')
      .eq('produit_id', produitId).maybeSingle()
      .then(({ data }) => setPrixMoyen(data))
  }, [produitId])

  const chercher = async () => {
    setLoading(true); setCherche(true)
    const { data } = await supabase
      .from('stocks_partenaires')
      .select(`
        quantite, disponible_immediat, prix_local, mis_en_avant,
        partenaires_magasins!inner(id, entreprise_id, nom, ville, quartier, adresse, telephone, horaires, latitude, longitude, livre, frais_livraison_base)
      `)
      .eq('produit_id', produitId)
      .eq('partenaires_magasins.ville', ville)
      .eq('partenaires_magasins.actif', true)
      .gt('quantite', 0)

    let list = data || []
    // Priorité : exclusivité totale > exclusivité ville > mise en avant
    if (produit?.partenaire_exclusif) {
      list = list.filter((s: any) => s.partenaires_magasins?.entreprise_id === produit.partenaire_exclusif)
    } else {
      const e = exclVille.find((x: any) => x.ville === ville)
      if (e) list = list.filter((s: any) => s.partenaires_magasins?.entreprise_id === e.partenaire_id)
    }
    list = [...list].sort((a: any, b: any) => (b.mis_en_avant ? 1 : 0) - (a.mis_en_avant ? 1 : 0))
    setPartenaires(list)
    // Quantité forcée à 0 pour les partenaires sans prix renseigné (achat impossible)
    setQtes(prev => {
      const next = { ...prev }
      list.forEach((s: any) => {
        const id = s.partenaires_magasins?.id
        if (id && !(s.prix_local > 0)) next[id] = 0
      })
      return next
    })
    setLoading(false)
  }

  useEffect(() => { chercher() }, [ville, produit, exclVille])

  // Demander la position du client pour le tri "Plus proche"
  const demanderPosition = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoErr('Géolocalisation non disponible sur cet appareil.'); return
    }
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoErr('') },
      () => setGeoErr('Localisation refusée — impossible de classer par proximité.')
    )
  }

  const choisirTri = (id: string) => {
    setTri(id)
    if (id === 'proche' && !position) demanderPosition()
  }

  const distanceDe = (s: any) => {
    const m = s.partenaires_magasins
    if (!position || m?.latitude == null || m?.longitude == null) return null
    return haversine(position.lat, position.lng, Number(m.latitude), Number(m.longitude))
  }

  // Liste triée selon le critère choisi
  const partenairesTries = [...partenaires].sort((a: any, b: any) => {
    const enAvant = (x: any) => (x.mis_en_avant ? 1 : 0)
    if (tri === 'prix') {
      const pa = a.prix_local > 0 ? a.prix_local : Infinity
      const pb = b.prix_local > 0 ? b.prix_local : Infinity
      if (pa !== pb) return pa - pb
      return enAvant(b) - enAvant(a)
    }
    if (tri === 'proche') {
      const da = distanceDe(a) ?? Infinity
      const db = distanceDe(b) ?? Infinity
      if (da !== db) return da - db
      return enAvant(b) - enAvant(a)
    }
    return enAvant(b) - enAvant(a)
  })

  const feedback = (k: string) => { setAjoute(p => ({ ...p, [k]: true })); setTimeout(() => setAjoute(p => ({ ...p, [k]: false })), 1800) }

  // Prix affiché et facturé pour BatiShop = moyenne des partenaires (repli sur prix catalogue si aucun)
  const prixBatishop = (prixMoyen && prixMoyen.nb_partenaires > 0 && prixMoyen.prix_moyen)
    ? prixMoyen.prix_moyen
    : (produit?.prix ?? 0)

  const ajouterBatishop = () => {
    if (!produit) return
    ajouterLignePanier(produit, { id: 'batishop', nom: 'BatiShop', ville, prix_local: prixBatishop, livre: true, frais_livraison_base: 0 }, getQte('batishop'))
    feedback('batishop')
  }
  const ajouterPartenaire = (s: any) => {
    if (!produit) return
    const m = s.partenaires_magasins
    ajouterLignePanier(produit, { id: m.id, nom: m.nom, ville: m.ville, prix_local: s.prix_local, livre: m.livre ?? true, frais_livraison_base: m.frais_livraison_base ?? 0 }, getQte(m.id))
    feedback(m.id)
  }

  // Sélecteur de quantité éditable (0 → max stock)
  const Stepper = ({ k, max, disabled = false }: { k: string; max: number; disabled?: boolean }) => (
    <div className={`flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white ${disabled ? 'opacity-50' : ''}`}>
      <button onClick={() => setQte(k, getQte(k) - 1, max)} disabled={disabled || getQte(k) <= 0}
        className="px-2 py-1 hover:bg-beton text-acier disabled:opacity-40 disabled:cursor-not-allowed"><Minus size={12}/></button>
      <input
        type="number"
        value={getQte(k)}
        min={0}
        max={max}
        disabled={disabled}
        onChange={e => {
          const val = parseInt(e.target.value)
          setQte(k, isNaN(val) ? 0 : val, max)
        }}
        className="w-12 text-center text-xs font-semibold border-x border-gray-200 py-1 focus:outline-none bg-white disabled:cursor-not-allowed"
        style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
      />
      <button onClick={() => setQte(k, getQte(k) + 1, max)} disabled={disabled || getQte(k) >= max}
        className="px-2 py-1 hover:bg-beton text-acier disabled:opacity-40 disabled:cursor-not-allowed"><Plus size={12}/></button>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-condensed font-bold text-lg text-acier flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-brique"/> Où trouver ce produit ?
        </h3>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-32">
            <label className="text-xs font-semibold text-gray-400 block mb-1">Ma ville</label>
            <select value={ville} onChange={e => setVille(e.target.value)} className="input-field text-sm">
              {VILLES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-32">
            <label className="text-xs font-semibold text-gray-400 block mb-1">Trier par</label>
            <div className="flex gap-1 flex-wrap">
              {TRIS.map(t => (
                <button key={t.id} onClick={() => choisirTri(t.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-full border font-medium transition-colors ${
                    tri === t.id ? 'bg-brique/10 text-brique border-brique/40' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {tri === 'proche' && geoErr && (
              <p className="text-xs text-amber-600 mt-1">{geoErr}</p>
            )}
            {tri === 'proche' && !geoErr && !position && (
              <p className="text-xs text-gray-400 mt-1">Autorisez la localisation pour classer par proximité…</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
        ) : (
          <>
            {/* BatiShop — livraison directe */}
            <div className="flex items-start gap-3 p-3 bg-brique/5 border border-brique/20 rounded-xl mb-3">
              <div className="w-10 h-10 rounded-full bg-brique flex items-center justify-center shrink-0">
                <Package size={18} className="text-white"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-bold text-sm text-acier">BatiShop — Livraison à domicile</span>
                  {produit && (
                    <span className="text-xs bg-brique/10 text-brique px-1.5 py-0.5 rounded-full font-bold">{formatPrix(prixBatishop)}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Commande en ligne · Livraison à {ville} · Prix garanti</p>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <Stepper k="batishop" max={produit?.stock ?? 999}/>
                  <button onClick={ajouterBatishop} disabled={!produit || getQte('batishop') < 1}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${ajoute['batishop'] ? 'bg-green-600 text-white' : 'bg-brique text-white hover:bg-brique-dark'}`}>
                    {ajoute['batishop'] ? <><Check size={12}/> Ajouté</> : <><ShoppingCart size={12}/> Ajouter — {formatPrix(prixBatishop)}</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Partenaires locaux */}
            {partenaires.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  🏪 {partenaires.length} partenaire{partenaires.length > 1 ? 's' : ''} à {ville}
                </p>
                {partenairesTries.map((s: any, i: number) => {
                  const mag = s.partenaires_magasins
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 bg-beton rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-acier/10 flex items-center justify-center shrink-0">
                        <Store size={15} className="text-acier"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-bold text-sm text-acier truncate">{mag.nom}</span>
                          {s.mis_en_avant && (
                            <span className="text-xs bg-or/20 text-acier px-1.5 py-0.5 rounded-full font-bold">⭐ Partenaire officiel</span>
                          )}
                          {s.prix_local > 0 && (
                            <span className="text-xs bg-brique/10 text-brique px-1.5 py-0.5 rounded-full font-bold">{formatPrix(s.prix_local)}</span>
                          )}
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{s.quantite} en stock</span>
                          {s.disponible_immediat && (
                            <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Zap size={9}/> Retrait immédiat</span>
                          )}
                          {tri === 'proche' && distanceDe(s) != null && (
                            <span className="text-xs bg-acier/10 text-acier px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"><MapPin size={9}/> ~{distanceDe(s)!.toFixed(1)} km</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                          <MapPin size={10}/> {mag.quartier ? `${mag.quartier} · ` : ''}{mag.adresse}
                        </p>
                        {mag.horaires && (
                          <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> {mag.horaires}</p>
                        )}
                        <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Stepper k={mag.id} max={s.quantite || 0} disabled={!(s.prix_local > 0)}/>
                            {mag.latitude && (
                              <a href={`https://maps.google.com/?q=${mag.latitude},${mag.longitude}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 border border-gray-200 text-gray-500 text-xs px-2.5 py-1.5 rounded-lg hover:text-brique hover:border-brique">
                                <Navigation size={11}/> GPS
                              </a>
                            )}
                          </div>
                          <button onClick={() => ajouterPartenaire(s)} disabled={!produit || !(s.prix_local > 0) || getQte(mag.id) < 1}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${ajoute[mag.id] ? 'bg-green-600 text-white' : 'bg-brique text-white hover:bg-brique-dark'}`}>
                            {ajoute[mag.id] ? <><Check size={12}/> Ajouté</> : <><ShoppingCart size={12}/> {s.prix_local > 0 ? `Ajouter — ${formatPrix(s.prix_local)}` : 'Ajouter au panier'}</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : cherche && (
              <div className="text-center py-6 text-gray-400">
                <Store size={28} className="mx-auto mb-2 opacity-40"/>
                <p className="text-sm">Pas de stock chez nos partenaires à {ville}</p>
                <p className="text-xs mt-1">Ajoutez chez BatiShop ci-dessus ou essayez une autre ville</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
