'use client'
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react'
import { supabase, Produit, CATEGORIES, fetchCategories, formatPrix } from '../../lib/supabase'
import { CarteProduit } from '../../components/produits/CarteProduit'
import { getVilleMemo, setVilleMemo, haversineKm } from '../../lib/ville'

const PAR_PAGE = 16

const TRANCHES = [
  { id: '', label: 'Tous les prix', min: 0, max: Infinity },
  { id: 'a', label: 'Moins de 5 000', min: 0, max: 5000 },
  { id: 'b', label: '5 000 – 15 000', min: 5000, max: 15000 },
  { id: 'c', label: '15 000 – 50 000', min: 15000, max: 50000 },
  { id: 'd', label: 'Plus de 50 000', min: 50000, max: Infinity },
]

type Info = { villes: string[]; prixVille: Record<string, number>; prixMin: number; coords: { ville: string; lat: number; lng: number }[] }

function PageProduitsContent() {
  const searchParams = useSearchParams()

  const [produits, setProduits] = useState<Produit[]>([])
  const [infos, setInfos] = useState<Record<string, Info>>({})
  const [villes, setVilles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filtresOuverts, setFiltresOuverts] = useState(false)

  const [recherche, setRecherche] = useState(searchParams.get('q') || '')
  const [categorie, setCategorie] = useState(searchParams.get('categorie') || '')
  const [sousCategorie, setSousCategorie] = useState(searchParams.get('sousCategorie') || '')
  const [cats, setCats] = useState<any[]>(CATEGORIES)
  const [ville, setVilleState] = useState('')
  const [tranche, setTranche] = useState('')
  const [tri, setTri] = useState('pertinence')
  const [badge, setBadge] = useState('')
  const [page, setPage] = useState(1)

  // Position (géolocalisation)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoErr, setGeoErr] = useState('')

  // Ville mémorisée (partagée avec la fiche produit)
  useEffect(() => {
    const v = searchParams.get('ville') || getVilleMemo()
    if (v) setVilleState(v)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const choisirVille = (v: string) => { setVilleState(v); setVilleMemo(v); setPage(1) }

  const chargerProduits = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('produits').select('*').eq('actif', true)
    if (recherche) query = query.ilike('nom', `%${recherche}%`)
    if (categorie) query = query.eq('categorie', categorie)
    if (sousCategorie) query = query.eq('sous_categorie', sousCategorie)
    if (badge) query = query.eq('badge', badge)
    query = query.order('created_at', { ascending: false }).limit(300)

    const [{ data }, magR, ccR] = await Promise.all([
      query,
      supabase.from('partenaires_magasins').select('id, ville, latitude, longitude').eq('actif', true),
      supabase.from('commission_config').select('taux').eq('id', 1).maybeSingle(),
    ])
    const liste = data || []
    setProduits(liste)

    const magById: Record<string, any> = {}
    const villesSet = new Set<string>()
    ;(magR.data || []).forEach((m: any) => { magById[m.id] = m; if (m.ville) villesSet.add(m.ville) })
    setVilles(Array.from(villesSet).sort())

    const taux = Number(ccR.data?.taux || 0)
    const ids = liste.map((p: any) => p.id)
    const infoMap: Record<string, Info> = {}
    if (ids.length) {
      const { data: stk } = await supabase
        .from('stocks_partenaires')
        .select('produit_id, prix_local, partenaire_id, quantite')
        .in('produit_id', ids).gt('quantite', 0)
      const byProd: Record<string, any[]> = {}
      ;(stk || []).forEach((s: any) => { (byProd[s.produit_id] = byProd[s.produit_id] || []).push(s) })
      liste.forEach((p: any) => {
        const ss = byProd[p.id] || []
        const vset = new Set<string>()
        const minRawVille: Record<string, number> = {}
        const coords: { ville: string; lat: number; lng: number }[] = []
        let minRaw = Infinity
        ss.forEach((s: any) => {
          const m = magById[s.partenaire_id]
          if (!m) return
          if (m.ville) vset.add(m.ville)
          const pl = Number(s.prix_local)
          if (pl > 0 && m.ville) {
            if (minRawVille[m.ville] === undefined || pl < minRawVille[m.ville]) minRawVille[m.ville] = pl
            if (pl < minRaw) minRaw = pl
          }
          if (m.latitude && m.longitude) coords.push({ ville: m.ville, lat: Number(m.latitude), lng: Number(m.longitude) })
        })
        const prixVille: Record<string, number> = {}
        Object.entries(minRawVille).forEach(([v, raw]) => { prixVille[v] = Math.round(raw * (1 + taux / 100)) })
        infoMap[p.id] = {
          villes: Array.from(vset),
          prixVille,
          prixMin: minRaw === Infinity ? 0 : Math.round(minRaw * (1 + taux / 100)),
          coords,
        }
      })
    }
    setInfos(infoMap)
    setLoading(false)
  }, [recherche, categorie, sousCategorie, badge])

  useEffect(() => { chargerProduits() }, [chargerProduits])
  useEffect(() => { fetchCategories().then(setCats) }, [])
  useEffect(() => {
    setCategorie(searchParams.get('categorie') || '')
    setSousCategorie(searchParams.get('sousCategorie') || '')
    setRecherche(searchParams.get('q') || '')
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const activerPosition = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setGeoErr('Géolocalisation indisponible sur cet appareil.'); return }
    setGeoLoading(true); setGeoErr('')
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); setTri('proche'); setPage(1) },
      () => { setGeoErr('Position non autorisée.'); setGeoLoading(false) },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  // Liste filtrée + triée (côté client)
  const { items, totalFiltre } = useMemo(() => {
    let list = produits.map((p: any) => {
      const inf = infos[p.id] || { villes: [], prixVille: {}, prixMin: 0, coords: [] }
      const prix = ville ? (inf.prixVille[ville] ?? 0) : inf.prixMin
      let dist = Infinity
      if (position) {
        const rel = ville ? inf.coords.filter(c => c.ville === ville) : inf.coords
        rel.forEach(c => { const d = haversineKm(position.lat, position.lng, c.lat, c.lng); if (d < dist) dist = d })
      }
      const dispoVille = ville ? inf.villes.includes(ville) : true
      return { p, prix, dist, dispoVille }
    })
    if (ville) list = list.filter(x => x.dispoVille)
    const t = TRANCHES.find(tr => tr.id === tranche)
    if (t && t.id) list = list.filter(x => x.prix > 0 && x.prix >= t.min && x.prix < t.max)
    if (tri === 'prix_asc') list.sort((a, b) => (a.prix || Infinity) - (b.prix || Infinity))
    else if (tri === 'prix_desc') list.sort((a, b) => (b.prix || 0) - (a.prix || 0))
    else if (tri === 'proche') list.sort((a, b) => a.dist - b.dist)
    return { items: list, totalFiltre: list.length }
  }, [produits, infos, ville, tranche, tri, position])

  const nbPages = Math.ceil(totalFiltre / PAR_PAGE)
  const pageItems = items.slice((page - 1) * PAR_PAGE, page * PAR_PAGE)

  const resetFiltres = () => {
    setRecherche(''); setCategorie(''); setSousCategorie(''); setBadge('')
    setTranche(''); setTri('pertinence'); setPage(1)
    setVilleState(''); setVilleMemo(''); setPosition(null); setGeoErr('')
  }
  const filtresActifs = recherche || categorie || sousCategorie || ville || tranche || badge || position

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-condensed font-bold text-acier">
            {categorie
              ? cats.find(c => c.id === categorie)?.label || 'Produits'
              : recherche ? `Résultats pour "${recherche}"` : 'Tous les produits'}
          </h1>
          {!loading && <p className="text-sm text-gray-500">{totalFiltre} produit{totalFiltre > 1 ? 's' : ''} trouvé{totalFiltre > 1 ? 's' : ''}{ville ? ` à ${ville}` : ''}</p>}
        </div>
        <div className="flex items-center gap-2">
          <select value={tri} onChange={e => { setTri(e.target.value); setPage(1) }}
            className="input-field w-auto text-sm">
            <option value="pertinence">Pertinence</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
            <option value="proche" disabled={!position}>Plus proche</option>
          </select>
          <button onClick={() => setFiltresOuverts(!filtresOuverts)}
            className="flex items-center gap-2 border border-gray-200 rounded px-3 py-2 text-sm hover:border-brique md:hidden">
            <SlidersHorizontal size={15}/> Filtres
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {filtresOuverts && (
          <div onClick={() => setFiltresOuverts(false)} className="fixed inset-0 bg-black/30 z-40 md:hidden"/>
        )}
        <aside className={`${filtresOuverts ? 'block' : 'hidden'} md:block fixed left-3 right-3 top-20 max-h-[80vh] overflow-y-auto z-50 shadow-2xl rounded-xl md:static md:left-auto md:right-auto md:top-auto md:max-h-none md:overflow-visible md:z-auto md:shadow-none md:rounded-none md:w-56 shrink-0`}>
          <div className="card p-4 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-condensed font-bold text-acier">Filtres</h2>
              <div className="flex items-center gap-3">
                {filtresActifs && (
                  <button onClick={resetFiltres} className="text-xs text-brique hover:underline flex items-center gap-1">
                    <X size={12}/> Effacer
                  </button>
                )}
                <button onClick={() => setFiltresOuverts(false)} aria-label="Fermer" className="md:hidden text-gray-400 hover:text-acier">
                  <X size={20}/>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Recherche</label>
              <div className="flex">
                <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && chargerProduits()}
                  placeholder="Mot-clé..." className="input-field rounded-r-none text-sm"/>
                <button onClick={chargerProduits} className="bg-brique text-white px-3 rounded-r hover:bg-brique-dark">
                  <Search size={15}/>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Ville</label>
              <select value={ville} onChange={e => choisirVille(e.target.value)}
                className="input-field text-sm">
                <option value="">Toutes les villes</option>
                {villes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Autour de moi</label>
              <button onClick={activerPosition} disabled={geoLoading}
                className={`w-full flex items-center justify-center gap-2 text-sm rounded-lg py-2 border transition-colors ${position ? 'bg-brique text-white border-brique' : 'border-gray-200 hover:border-brique text-acier'}`}>
                <MapPin size={14}/> {geoLoading ? 'Localisation…' : position ? 'Position activée' : 'Utiliser ma position'}
              </button>
              {geoErr && <p className="text-xs text-gray-400 mt-1">{geoErr}</p>}
              {position && <p className="text-xs text-gray-400 mt-1">Trie les produits par magasin le plus proche.</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Catégorie</label>
              <div className="space-y-1">
                <button onClick={() => { setCategorie(''); setSousCategorie(''); setPage(1) }}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded ${!categorie ? 'bg-brique text-white' : 'hover:bg-beton'}`}>
                  Toutes
                </button>
                {cats.map(c => (
                  <div key={c.id}>
                    <button onClick={() => { setCategorie(c.id); setSousCategorie(''); setPage(1) }}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded flex items-center gap-2 ${categorie === c.id ? 'bg-brique text-white' : 'hover:bg-beton'}`}>
                      <span>{c.emoji}</span> {c.label}
                    </button>
                    {categorie === c.id && (c as any).sous && (
                      <div className="ml-7 mt-1 mb-1 space-y-0.5 border-l border-gray-200 pl-2">
                        {(c as any).sous.map((s: string) => (
                          <button key={s} onClick={() => { setSousCategorie(sousCategorie === s ? '' : s); setPage(1) }}
                            className={`w-full text-left text-xs px-2 py-1 rounded ${sousCategorie === s ? 'bg-brique/10 text-brique font-semibold' : 'text-gray-600 hover:bg-beton'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Prix</label>
              <div className="space-y-1">
                {TRANCHES.map(t => (
                  <button key={t.id || 'all'} onClick={() => { setTranche(t.id); setPage(1) }}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded ${tranche === t.id ? 'bg-brique text-white' : 'hover:bg-beton'}`}>
                    {t.label}{t.id ? ' FCFA' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Offres</label>
              <div className="space-y-1">
                {[['', 'Tous'], ['promo', '🏷️ Promos'], ['nouveau', '🆕 Nouveautés'], ['solaire', '☀️ Solaire']].map(([val, label]) => (
                  <button key={val} onClick={() => { setBadge(val); setPage(1) }}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded ${badge === val ? 'bg-brique text-white' : 'hover:bg-beton'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setFiltresOuverts(false)} className="md:hidden w-full btn-primary mt-2">
              Voir les résultats{!loading ? ` (${totalFiltre})` : ''}
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card h-64 animate-pulse bg-gray-100 rounded-lg"/>
              ))}
            </div>
          ) : pageItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-condensed font-bold text-xl text-acier mb-2">Aucun produit trouvé{ville ? ` à ${ville}` : ''}</h3>
              <button onClick={resetFiltres} className="btn-primary">Voir tous les produits</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pageItems.map(x => (
                  <CarteProduit key={x.p.id} produit={x.p} prixMoyen={x.prix} aPartirDe
                    distanceKm={position && x.dist !== Infinity ? x.dist : undefined}/>
                ))}
              </div>
              {nbPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-beton">
                    ← Précédent
                  </button>
                  {Array.from({ length: Math.min(nbPages, 5) }).map((_, i) => (
                    <button key={i+1} onClick={() => setPage(i+1)}
                      className={`w-8 h-8 rounded text-sm font-medium ${page === i+1 ? 'bg-brique text-white' : 'hover:bg-beton'}`}>
                      {i+1}
                    </button>
                  ))}
                  <button disabled={page === nbPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-beton">
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PageProduits() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Chargement des produits...</div>}>
      <PageProduitsContent />
    </Suspense>
  )
}
