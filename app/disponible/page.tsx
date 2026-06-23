'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, MapPin, Clock, Store, Phone, Navigation, Filter, ChevronRight, CheckCircle, Package } from 'lucide-react'
import { supabase, CATEGORIES, VILLES, formatPrix } from '../../lib/supabase'
import { SITE } from '../../lib/config'
import Link from 'next/link'

const DELAIS = [
  { id: 'maintenant', label: 'Maintenant', desc: 'Disponible immédiatement', icon: '⚡', color: 'text-green-700 bg-green-100 border-green-200' },
  { id: 'aujourd_hui', label: "Aujourd'hui", desc: 'Retrait ou livraison J', icon: '🌅', color: 'text-blue-700 bg-blue-100 border-blue-200' },
  { id: 'demain', label: 'Demain', desc: 'Livraison J+1', icon: '📅', color: 'text-purple-700 bg-purple-100 border-purple-200' },
  { id: 'semaine', label: 'Cette semaine', desc: 'Sous 3-5 jours', icon: '📆', color: 'text-amber-700 bg-amber-100 border-amber-200' },
]

type ResultatDisponibilite = {
  type: 'partenaire' | 'batishop'
  nom: string
  ville: string
  quartier?: string
  adresse: string
  telephone: string
  horaires?: string
  stock?: number
  delai: string
  distance?: string
  produits: any[]
  id?: string
}

function DisponibleContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [recherche, setRecherche] = useState(searchParams.get('q') || '')
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '')
  const [ville, setVille] = useState(searchParams.get('ville') || VILLES[0])
  const [delai, setDelai] = useState(searchParams.get('delai') || 'maintenant')
  const [categorie, setCategorie] = useState(searchParams.get('categorie') || '')

  const [resultats, setResultats] = useState<ResultatDisponibilite[]>([])
  const [produits, setProduits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [cherche, setCherche] = useState(false)

  const chercher = useCallback(async () => {
    setLoading(true)
    setCherche(true)

    // 1. Chercher les produits correspondants
    let queryProd = supabase.from('produits').select('*').eq('actif', true)
    if (recherche) queryProd = queryProd.ilike('nom', `%${recherche}%`)
    if (categorie) queryProd = queryProd.eq('categorie', categorie)
    const { data: prodsData } = await queryProd.limit(20)
    const prods = prodsData || []
    setProduits(prods)

    if (prods.length === 0) { setResultats([]); setLoading(false); return }

    const produitIds = prods.map(p => p.id)

    // 2. Chercher les stocks chez les partenaires dans la ville
    const { data: stocksData } = await supabase
      .from('stocks_partenaires')
      .select(`
        quantite, disponible_immediat, prix_local,
        partenaires_magasins!inner(id, nom, ville, quartier, adresse, telephone, horaires),
        produits!inner(id, nom, prix, categorie, reference, unite)
      `)
      .in('produit_id', produitIds)
      .eq('partenaires_magasins.ville', ville)
      .eq('partenaires_magasins.actif', true)
      .gt('quantite', 0)

    // 3. Grouper par partenaire
    const partenairesMap = new Map<string, ResultatDisponibilite>()

    stocksData?.forEach((s: any) => {
      const mag = s.partenaires_magasins
      const prod = s.produits
      const magId = mag.id

      const disponibleMaintenant = s.disponible_immediat && s.quantite > 0
      const delaiDisponible = disponibleMaintenant ? 'maintenant' :
        delai === 'maintenant' ? null : 'aujourd_hui'

      if (!delaiDisponible && delai === 'maintenant' && !disponibleMaintenant) return

      if (!partenairesMap.has(magId)) {
        partenairesMap.set(magId, {
          type: 'partenaire',
          id: magId,
          nom: mag.nom,
          ville: mag.ville,
          quartier: mag.quartier,
          adresse: mag.adresse,
          telephone: mag.telephone,
          horaires: mag.horaires,
          stock: s.quantite,
          delai: disponibleMaintenant ? 'maintenant' : 'aujourd_hui',
          produits: [],
        })
      }
      partenairesMap.get(magId)!.produits.push({
        ...prod,
        quantiteDisponible: s.quantite,
        prixLocal: s.prix_local || prod.prix,
      })
    })

    // 4. Ajouter BatiShop comme option livraison
    const batishopDelai = delai === 'maintenant' || delai === 'aujourd_hui' ? 'aujourd_hui' :
      delai === 'demain' ? 'demain' : 'semaine'
    const batishop: ResultatDisponibilite = {
      type: 'batishop',
      nom: SITE.nom,
      ville,
      adresse: `Livraison à domicile — ${ville}`,
      telephone: SITE.tel,
      horaires: 'Commande en ligne 24h/24',
      delai: batishopDelai,
      produits: prods.map(p => ({ ...p, quantiteDisponible: p.stock, prixLocal: p.prix })),
    }

    const listeResultats: ResultatDisponibilite[] = [batishop, ...Array.from(partenairesMap.values())]

    // Trier : délai correspondant en premier
    listeResultats.sort((a, b) => {
      const ordre = ['maintenant', 'aujourd_hui', 'demain', 'semaine']
      return ordre.indexOf(a.delai) - ordre.indexOf(b.delai)
    })

    setResultats(listeResultats)
    setLoading(false)
  }, [recherche, ville, delai, categorie])

  useEffect(() => {
    if (searchParams.get('q') || searchParams.get('categorie')) chercher()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setRecherche(inputVal)
    router.push(`/disponible?q=${encodeURIComponent(inputVal)}&ville=${ville}&delai=${delai}${categorie ? `&categorie=${categorie}` : ''}`)
    chercher()
  }

  const delaiLabel = (d: string) => DELAIS.find(x => x.id === d) || DELAIS[0]
  const delaiConfig = delaiLabel(delai)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="inline-block bg-brique text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest">
          Disponibilité locale
        </div>
        <h1 className="font-condensed font-bold text-3xl text-acier mb-2">
          Où trouver ce produit ?
        </h1>
        <p className="text-gray-500 text-sm">
          Trouvez un produit disponible maintenant près de chez vous — chez nos partenaires ou via livraison BatiShop.
        </p>
      </div>

      {/* Formulaire de recherche */}
      <form onSubmit={handleSubmit} className="card p-5 mb-6">
        <div className="grid md:grid-cols-4 gap-3">
          {/* Recherche produit */}
          <div className="md:col-span-1">
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Produit recherché</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
                placeholder="Ciment, câble, carrelage..." className="input-field pl-9 text-sm"/>
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Catégorie</label>
            <select value={categorie} onChange={e => setCategorie(e.target.value)} className="input-field text-sm">
              <option value="">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          {/* Ville */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5 flex items-center gap-1">
              <MapPin size={11}/> Ma ville
            </label>
            <select value={ville} onChange={e => setVille(e.target.value)} className="input-field text-sm">
              {VILLES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          {/* Délai */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5 flex items-center gap-1">
              <Clock size={11}/> Quand ?
            </label>
            <select value={delai} onChange={e => setDelai(e.target.value)} className="input-field text-sm">
              {DELAIS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {/* Raccourcis délai */}
          <div className="flex gap-2 flex-wrap">
            {DELAIS.map(d => (
              <button key={d.id} type="button" onClick={() => setDelai(d.id)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  delai === d.id ? `${d.color} border-current` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {d.icon} {d.label}
              </button>
            ))}
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2 shrink-0">
            <Search size={16}/> Chercher
          </button>
        </div>
      </form>

      {/* Résultats */}
      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"/>)}
        </div>
      )}

      {!loading && cherche && (
        <div>
          {/* Résumé */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-acier">
                {resultats.length > 0
                  ? `${resultats.length} point${resultats.length > 1 ? 's' : ''} de disponibilité à ${ville}`
                  : `Aucun résultat à ${ville}`}
                {recherche && <span className="text-gray-400 font-normal"> pour "{recherche}"</span>}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {delaiConfig.icon} {delaiConfig.label} — {delaiConfig.desc}
              </p>
            </div>
            <div className="text-sm text-gray-400">{produits.length} produit{produits.length > 1 ? 's' : ''} trouvé{produits.length > 1 ? 's' : ''}</div>
          </div>

          {resultats.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-4">📍</div>
              <h3 className="font-condensed font-bold text-xl text-acier mb-2">
                Aucun stock disponible à {ville}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Ce produit n'est pas disponible immédiatement dans votre ville.<br/>
                Essayez un délai plus long ou une autre ville.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => setDelai('semaine')} className="btn-outline text-sm">
                  Voir disponibilité cette semaine
                </button>
                <Link href="/devis" className="btn-primary text-sm">
                  Faire une demande de devis
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {resultats.map((r, idx) => (
                <div key={idx} className={`card overflow-hidden border-2 ${
                  r.type === 'batishop' ? 'border-brique' : 'border-transparent hover:border-gray-200'} transition-colors`}>

                  {/* Badge BatiShop */}
                  {r.type === 'batishop' && (
                    <div className="bg-brique text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2">
                      <CheckCircle size={12}/> Livraison officielle BatiShop — Prix garantis
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {/* Nom + badge délai */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="font-condensed font-bold text-lg text-acier flex items-center gap-2">
                            {r.type === 'partenaire' ? <Store size={18} className="text-brique shrink-0"/> : <Package size={18} className="text-brique shrink-0"/>}
                            {r.nom}
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${delaiLabel(r.delai).color}`}>
                            {delaiLabel(r.delai).icon} {delaiLabel(r.delai).label}
                          </span>
                          {r.type === 'partenaire' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              ✓ Partenaire certifié
                            </span>
                          )}
                        </div>

                        {/* Infos pratiques */}
                        <div className="grid md:grid-cols-3 gap-2 mb-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-brique shrink-0"/>
                            <span className="truncate">{r.adresse}{r.quartier ? ` (${r.quartier})` : ''}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone size={13} className="text-brique shrink-0"/>
                            <a href={`tel:${r.telephone}`} className="hover:text-brique font-medium">{r.telephone}</a>
                          </div>
                          {r.horaires && (
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-brique shrink-0"/>
                              <span className="text-xs">{r.horaires}</span>
                            </div>
                          )}
                        </div>

                        {/* Produits disponibles */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {r.produits.length} produit{r.produits.length > 1 ? 's' : ''} disponible{r.produits.length > 1 ? 's' : ''}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {r.produits.slice(0, 4).map((p, i) => (
                              <Link key={i} href={`/produits/${p.id}`}
                                className="flex items-center gap-2 bg-beton hover:bg-gray-100 rounded-lg px-3 py-1.5 text-xs transition-colors group">
                                <span className="font-medium text-acier group-hover:text-brique truncate max-w-32">{p.nom}</span>
                                <span className="font-bold text-brique shrink-0">{formatPrix(p.prixLocal || p.prix)}</span>
                                {p.quantiteDisponible && (
                                  <span className="text-gray-400 shrink-0">({p.quantiteDisponible} en stock)</span>
                                )}
                              </Link>
                            ))}
                            {r.produits.length > 4 && (
                              <span className="flex items-center gap-1 text-xs text-brique px-2 py-1.5">
                                +{r.produits.length - 4} autres <ChevronRight size={11}/>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {r.type === 'partenaire' ? (
                          <>
                            <a href={`tel:${r.telephone}`}
                              className="flex items-center gap-2 bg-brique text-white text-sm px-4 py-2 rounded-lg hover:bg-brique-dark font-medium transition-colors">
                              <Phone size={14}/> Appeler
                            </a>
                            {r.latitude && r.longitude && (
                              <a href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 border border-gray-200 text-acier text-sm px-4 py-2 rounded-lg hover:border-brique hover:text-brique font-medium transition-colors">
                                <Navigation size={14}/> Itinéraire
                              </a>
                            )}
                          </>
                        ) : (
                          <>
                            <Link href={`/produits${recherche ? `?q=${encodeURIComponent(recherche)}` : ''}`}
                              className="flex items-center gap-2 bg-brique text-white text-sm px-4 py-2 rounded-lg hover:bg-brique-dark font-medium transition-colors">
                              <Package size={14}/> Commander
                            </Link>
                            <Link href="/devis"
                              className="flex items-center gap-2 border border-gray-200 text-acier text-sm px-4 py-2 rounded-lg hover:border-brique hover:text-brique transition-colors">
                              Devis groupé
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* État initial — pas encore cherché */}
      {!cherche && !loading && (
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {[
            { ico: '⚡', titre: 'Retrait immédiat', desc: `Le produit est en stock chez un partenaire à ${VILLES[0]}. Vous pouvez venir maintenant.` },
            { ico: '🏪', titre: 'Partenaires locaux', desc: 'Des quincailleries certifiées près de chez vous, avec leurs propres prix affichés.' },
            { ico: '🚚', titre: 'Livraison BatiShop', desc: 'Commandez en ligne. Livraison à domicile sous 24h à 72h selon votre ville.' },
          ].map(c => (
            <div key={c.titre} className="card p-5 text-center">
              <div className="text-3xl mb-3">{c.ico}</div>
              <h3 className="font-condensed font-bold text-base text-acier mb-2">{c.titre}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PageDisponible() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Chargement...</div>}>
      <DisponibleContent/>
    </Suspense>
  )
}
