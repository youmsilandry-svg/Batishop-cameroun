'use client'
import { useState, useEffect, useMemo } from 'react'
import { MapPin, Phone, Clock, Navigation, Store, Truck, Check, Minus, Plus, ShoppingCart, TrendingDown, Star, Crosshair, Package } from 'lucide-react'
import { supabase, VILLES, formatPrix, Produit } from '../../lib/supabase'
import { ajouterLignePanier } from '../../lib/panier'

type Tri = 'prix_asc' | 'prix_desc' | 'distance' | 'note'

const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371, toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function OuTrouver({ produit }: { produit: Produit }) {
  const [ville, setVille] = useState('Douala')
  const [tri, setTri] = useState<Tri>('prix_asc')
  const [partenaires, setPartenaires] = useState<any[]>([])
  const [prixMoyen, setPrixMoyen] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [qtes, setQtes] = useState<Record<string, number>>({})
  const [ajoute, setAjoute] = useState('')
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [geo, setGeo] = useState<'idle' | 'asking' | 'ok' | 'refused' | 'unsupported'>('idle')

  useEffect(() => {
    supabase.from('prix_moyen_partenaires')
      .select('prix_moyen, prix_min, prix_max, nb_partenaires')
      .eq('produit_id', produit.id).maybeSingle()
      .then(({ data }) => setPrixMoyen(data))
  }, [produit.id])

  const chercher = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('stocks_partenaires')
      .select(`quantite, disponible_immediat, prix_local, prix_local_ancien,
        partenaires_magasins!inner(id, nom, ville, quartier, adresse, telephone, horaires, latitude, longitude, livre, frais_livraison_base, note, nb_avis)`)
      .eq('produit_id', produit.id)
      .eq('partenaires_magasins.ville', ville)
      .eq('partenaires_magasins.actif', true)
      .gt('quantite', 0)
    setPartenaires(data || [])
    setLoading(false)
  }
  useEffect(() => { chercher() }, [ville])

  const localiser = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setGeo('unsupported'); return }
    setGeo('asking')
    navigator.geolocation.getCurrentPosition(
      p => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setGeo('ok'); setTri('distance') },
      () => setGeo('refused'),
      { timeout: 8000, enableHighAccuracy: true },
    )
  }

  const moyenne = prixMoyen?.prix_moyen || 0
  const qteDe = (id: string) => qtes[id] || 1
  const setQte = (id: string, q: number, max: number) => setQtes(s => ({ ...s, [id]: Math.max(1, Math.min(max, q)) }))

  // Calcule distance + tri
  const liste = useMemo(() => {
    const avecDist = partenaires.map(s => {
      const m = s.partenaires_magasins
      const dist = pos && m.latitude && m.longitude ? distanceKm(pos.lat, pos.lng, m.latitude, m.longitude) : null
      return { ...s, _dist: dist }
    })
    const min = Math.min(...avecDist.map(s => s.prix_local || Infinity))
    avecDist.forEach(s => { s._meilleurPrix = s.prix_local === min })
    avecDist.sort((a, b) => {
      if (tri === 'prix_asc') return (a.prix_local || 0) - (b.prix_local || 0)
      if (tri === 'prix_desc') return (b.prix_local || 0) - (a.prix_local || 0)
      if (tri === 'distance') return (a._dist ?? Infinity) - (b._dist ?? Infinity)
      if (tri === 'note') return (b.partenaires_magasins.note ?? -1) - (a.partenaires_magasins.note ?? -1)
      return 0
    })
    return avecDist
  }, [partenaires, pos, tri])

  const ajouter = (s: any) => {
    if (!s.prix_local || s.prix_local <= 0) return
    const mag = s.partenaires_magasins
    ajouterLignePanier(produit, { id: mag.id, nom: mag.nom, ville: mag.ville, prix_local: s.prix_local, livre: mag.livre, frais_livraison_base: mag.frais_livraison_base }, qteDe(mag.id))
    setAjoute(mag.id); setTimeout(() => setAjoute(''), 1800)
  }
  const prixBatishop = moyenne || produit.prix
  const ajouterBatishop = () => {
    if (!prixBatishop || prixBatishop <= 0) return
    ajouterLignePanier(produit, { id: 'batishop', nom: 'BatiShop', ville, prix_local: prixBatishop, livre: true, frais_livraison_base: 0 }, qteDe('batishop'))
    setAjoute('batishop'); setTimeout(() => setAjoute(''), 1800)
  }

  return (
    <div id="ou-trouver" className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-condensed font-bold text-lg text-acier flex items-center gap-2 mb-1">
          <MapPin size={18} className="text-brique"/> Choisissez votre boutique
        </h3>
        <p className="text-xs text-gray-500 mb-4">Comparez prix, distance et notes, puis achetez chez le partenaire de votre choix.</p>

        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Ma ville</label>
            <select value={ville} onChange={e => setVille(e.target.value)} className="input-field text-sm">
              {VILLES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Trier par</label>
            <select value={tri} onChange={e => setTri(e.target.value as Tri)} className="input-field text-sm">
              <option value="prix_asc">Prix croissant</option>
              <option value="prix_desc">Prix décroissant</option>
              <option value="distance">Distance</option>
              <option value="note">Note de la boutique</option>
            </select>
          </div>
          <button type="button" onClick={localiser}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${pos ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-brique hover:text-brique'}`}>
            <Crosshair size={15}/> {geo === 'asking' ? 'Localisation…' : pos ? 'Position activée' : 'Près de moi'}
          </button>
        </div>
        {geo === 'refused' && <p className="text-xs text-amber-600 mt-2">Localisation refusée — le tri par distance est indisponible.</p>}
        {geo === 'unsupported' && <p className="text-xs text-amber-600 mt-2">Votre navigateur ne supporte pas la géolocalisation.</p>}
        {tri === 'distance' && !pos && <p className="text-xs text-amber-600 mt-2">Activez « Près de moi » pour trier par distance.</p>}
      </div>

      <div className="p-5">
        {/* BatiShop — toujours commandable */}
        <div className="p-3 bg-brique/5 border border-brique/30 rounded-xl mb-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-brique flex items-center justify-center shrink-0"><Package size={16} className="text-white"/></div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-acier">BatiShop — Livraison à domicile</div>
              <div className="text-xs text-gray-500">Commande en ligne · livraison à {ville}{prixMoyen?.nb_partenaires > 0 && <> · prix moyen sur {prixMoyen.nb_partenaires} boutique{prixMoyen.nb_partenaires > 1 ? 's' : ''}</>}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-condensed font-bold text-lg text-brique">{formatPrix(prixBatishop)}</div>
              <div className="text-xs text-gray-400">/ {produit.unite}</div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
              <button onClick={() => setQte('batishop', qteDe('batishop') - 1, 999)} className="px-2 py-1 hover:bg-beton text-acier"><Minus size={13}/></button>
              <input type="number" min={1} max={999} value={qteDe('batishop')}
                onChange={e => setQte('batishop', e.target.value === '' ? 1 : parseInt(e.target.value) || 1, 999)}
                className="w-14 text-center py-1 text-sm font-medium border-x focus:outline-none" style={{ MozAppearance: 'textfield' }}/>
              <button onClick={() => setQte('batishop', qteDe('batishop') + 1, 999)} className="px-2 py-1 hover:bg-beton text-acier"><Plus size={13}/></button>
            </div>
            <button onClick={ajouterBatishop} className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${ajoute === 'batishop' ? 'bg-green-600 text-white' : 'bg-brique text-white hover:bg-brique-dark'}`}>
              {ajoute === 'batishop' ? <><Check size={15}/> Ajouté</> : <><ShoppingCart size={15}/> Ajouter au panier</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
        ) : liste.length > 0 ? (
          <div className="space-y-2.5">
            {liste.map((s: any) => {
              const mag = s.partenaires_magasins
              const moinsCher = moyenne > 0 && s.prix_local < moyenne
              const sansPrix = !s.prix_local || s.prix_local <= 0
              const enPromo = s.prix_local_ancien && s.prix_local && s.prix_local_ancien > s.prix_local
              const remise = enPromo ? Math.round((1 - s.prix_local / s.prix_local_ancien) * 100) : 0
              return (
                <div key={mag.id} className={`p-3 rounded-xl border transition-colors ${s._meilleurPrix ? 'bg-green-50 border-green-300' : 'bg-beton border-transparent hover:bg-gray-100'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-acier/10 flex items-center justify-center shrink-0"><Store size={15} className="text-acier"/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-sm text-acier truncate">{mag.nom}</span>
                        {s._meilleurPrix && <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"><TrendingDown size={10}/> Meilleur prix</span>}
                        {!s._meilleurPrix && moinsCher && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Sous la moyenne</span>}
                        {mag.note != null && <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Star size={10} className="fill-amber-500 text-amber-500"/> {mag.note}{mag.nb_avis ? ` (${mag.nb_avis})` : ''}</span>}
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{s.quantite} en stock</span>
                        {mag.livre && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Truck size={10}/> Livraison</span>}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><MapPin size={10}/> {mag.quartier ? `${mag.quartier} · ` : ''}{mag.adresse}{s._dist != null && <span className="text-acier font-medium"> · à {s._dist.toFixed(1)} km</span>}</p>
                      {mag.horaires && <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> {mag.horaires}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {sansPrix ? (
                        <div className="text-xs text-gray-400 font-medium">Prix non<br/>communiqué</div>
                      ) : (
                        <>
                          {enPromo && <div className="text-xs bg-brique text-white font-bold px-1.5 py-0.5 rounded inline-block mb-0.5">-{remise}%</div>}
                          <div className={`font-condensed font-bold text-lg ${enPromo ? 'text-brique' : moinsCher ? 'text-green-700' : 'text-brique'}`}>{formatPrix(s.prix_local)}</div>
                          {enPromo && <div className="text-xs text-gray-400 line-through">{formatPrix(s.prix_local_ancien)}</div>}
                          <div className="text-xs text-gray-400">/ {produit.unite}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button onClick={() => setQte(mag.id, qteDe(mag.id) - 1, s.quantite)} className="px-2 py-1 hover:bg-beton text-acier"><Minus size={13}/></button>
                        <input type="number" min={1} max={s.quantite} value={qteDe(mag.id)}
                          onChange={e => setQte(mag.id, e.target.value === '' ? 1 : parseInt(e.target.value) || 1, s.quantite)}
                          className="w-14 text-center py-1 text-sm font-medium border-x focus:outline-none" style={{ MozAppearance: 'textfield' }}/>
                        <button onClick={() => setQte(mag.id, qteDe(mag.id) + 1, s.quantite)} className="px-2 py-1 hover:bg-beton text-acier"><Plus size={13}/></button>
                      </div>
                      <a href={`tel:${mag.telephone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brique"><Phone size={12}/> Appeler</a>
                      {mag.latitude && <a href={`https://maps.google.com/?q=${mag.latitude},${mag.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-brique"><Navigation size={12}/> GPS</a>}
                    </div>
                    {sansPrix ? (
                      <a href={`tel:${mag.telephone}`} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                        <Phone size={15}/> Appeler pour le prix
                      </a>
                    ) : (
                      <button onClick={() => ajouter(s)} className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${ajoute === mag.id ? 'bg-green-600 text-white' : 'bg-brique text-white hover:bg-brique-dark'}`}>
                        {ajoute === mag.id ? <><Check size={15}/> Ajouté</> : <><ShoppingCart size={15}/> Ajouter</>}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Store size={28} className="mx-auto mb-2 opacity-40"/>
            <p className="text-sm">Aucune boutique partenaire à {ville} pour ce produit</p>
            <p className="text-xs mt-1">Vous pouvez commander chez BatiShop ci-dessus.</p>
          </div>
        )}
      </div>
    </div>
  )
}
