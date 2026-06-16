'use client'
import { useState, useEffect } from 'react'
import { MapPin, Phone, Clock, Navigation, Store, Truck, Check, Minus, Plus, ShoppingCart, TrendingDown } from 'lucide-react'
import { supabase, VILLES, formatPrix, Produit } from '../../lib/supabase'
import { ajouterLignePanier } from '../../lib/panier'

export function OuTrouver({ produit }: { produit: Produit }) {
  const [ville, setVille] = useState('Douala')
  const [partenaires, setPartenaires] = useState<any[]>([])
  const [prixMoyen, setPrixMoyen] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [qtes, setQtes] = useState<Record<string, number>>({})
  const [ajoute, setAjoute] = useState<string>('')

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
      .select(`quantite, disponible_immediat, prix_local,
        partenaires_magasins!inner(id, nom, ville, quartier, adresse, telephone, horaires, latitude, longitude, livre, frais_livraison_base)`)
      .eq('produit_id', produit.id)
      .eq('partenaires_magasins.ville', ville)
      .eq('partenaires_magasins.actif', true)
      .gt('quantite', 0)
    // Trier par prix croissant : le moins cher d'abord
    const tri = (data || []).sort((a: any, b: any) => (a.prix_local || 0) - (b.prix_local || 0))
    setPartenaires(tri)
    setLoading(false)
  }
  useEffect(() => { chercher() }, [ville])

  const moyenne = prixMoyen?.prix_moyen || 0
  const qteDe = (id: string) => qtes[id] || 1
  const setQte = (id: string, q: number, max: number) => setQtes(s => ({ ...s, [id]: Math.max(1, Math.min(max, q)) }))

  const ajouter = (s: any) => {
    const mag = s.partenaires_magasins
    ajouterLignePanier(produit, {
      id: mag.id, nom: mag.nom, ville: mag.ville, prix_local: s.prix_local,
      livre: mag.livre, frais_livraison_base: mag.frais_livraison_base,
    }, qteDe(mag.id))
    setAjoute(mag.id); setTimeout(() => setAjoute(''), 1800)
  }

  return (
    <div id="ou-trouver" className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-condensed font-bold text-lg text-acier flex items-center gap-2 mb-1">
          <MapPin size={18} className="text-brique"/> Choisissez votre boutique
        </h3>
        <p className="text-xs text-gray-500 mb-4">Comparez les prix et achetez chez le partenaire de votre choix.</p>
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Ma ville</label>
          <select value={ville} onChange={e => setVille(e.target.value)} className="input-field text-sm max-w-xs">
            {VILLES.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="p-5">
        {/* Prix moyen de référence */}
        {prixMoyen && prixMoyen.nb_partenaires > 0 && (
          <div className="flex items-center justify-between gap-3 p-3 bg-acier/5 border border-acier/10 rounded-xl mb-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prix moyen BatiShop</p>
              <p className="text-xs text-gray-400">
                Sur {prixMoyen.nb_partenaires} boutique{prixMoyen.nb_partenaires > 1 ? 's' : ''}
                {prixMoyen.prix_min !== prixMoyen.prix_max && <> · de {formatPrix(prixMoyen.prix_min)} à {formatPrix(prixMoyen.prix_max)}</>}
              </p>
            </div>
            <span className="font-condensed font-bold text-lg text-acier shrink-0">{formatPrix(prixMoyen.prix_moyen)}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
        ) : partenaires.length > 0 ? (
          <div className="space-y-2.5">
            {partenaires.map((s: any, i: number) => {
              const mag = s.partenaires_magasins
              const moinsCher = moyenne > 0 && s.prix_local < moyenne
              const meilleur = i === 0 && moinsCher
              return (
                <div key={mag.id} className={`p-3 rounded-xl border transition-colors ${meilleur ? 'bg-green-50 border-green-300' : 'bg-beton border-transparent hover:bg-gray-100'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-acier/10 flex items-center justify-center shrink-0">
                      <Store size={15} className="text-acier"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-sm text-acier truncate">{mag.nom}</span>
                        {meilleur && <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"><TrendingDown size={10}/> Meilleur prix</span>}
                        {!meilleur && moinsCher && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Sous la moyenne</span>}
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{s.quantite} en stock</span>
                        {mag.livre && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Truck size={10}/> Livraison</span>}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><MapPin size={10}/> {mag.quartier ? `${mag.quartier} · ` : ''}{mag.adresse}</p>
                      {mag.horaires && <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> {mag.horaires}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-condensed font-bold text-lg ${moinsCher ? 'text-green-700' : 'text-brique'}`}>{formatPrix(s.prix_local)}</div>
                      <div className="text-xs text-gray-400">/ {produit.unite}</div>
                    </div>
                  </div>

                  {/* Quantité + ajout */}
                  <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button onClick={() => setQte(mag.id, qteDe(mag.id) - 1, s.quantite)} className="px-2 py-1 hover:bg-beton text-acier"><Minus size={13}/></button>
                        <span className="px-3 py-1 text-sm font-medium border-x">{qteDe(mag.id)}</span>
                        <button onClick={() => setQte(mag.id, qteDe(mag.id) + 1, s.quantite)} className="px-2 py-1 hover:bg-beton text-acier"><Plus size={13}/></button>
                      </div>
                      <a href={`tel:${mag.telephone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brique"><Phone size={12}/> Appeler</a>
                      {mag.latitude && <a href={`https://maps.google.com/?q=${mag.latitude},${mag.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-brique"><Navigation size={12}/> GPS</a>}
                    </div>
                    <button onClick={() => ajouter(s)}
                      className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${ajoute === mag.id ? 'bg-green-600 text-white' : 'bg-brique text-white hover:bg-brique-dark'}`}>
                      {ajoute === mag.id ? <><Check size={15}/> Ajouté</> : <><ShoppingCart size={15}/> Ajouter</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Store size={28} className="mx-auto mb-2 opacity-40"/>
            <p className="text-sm">Aucune boutique n’a ce produit en stock à {ville}</p>
            <p className="text-xs mt-1">Essayez une autre ville</p>
          </div>
        )}
      </div>
    </div>
  )
}
