'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { supabase, Produit, CATEGORIES, fetchCategories, formatPrix } from '../../lib/supabase'
import { CarteProduit } from '../../components/produits/CarteProduit'

const PRIX_MAX = 500000

function PageProduitsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filtresOuverts, setFiltresOuverts] = useState(false)

  const [recherche, setRecherche] = useState(searchParams.get('q') || '')
  const [categorie, setCategorie] = useState(searchParams.get('categorie') || '')
  const [sousCategorie, setSousCategorie] = useState(searchParams.get('sousCategorie') || '')
  const [cats, setCats] = useState<any[]>(CATEGORIES)
  const [prixMax, setPrixMax] = useState(PRIX_MAX)
  const [tri, setTri] = useState('pertinence')
  const [badge, setBadge] = useState('')
  const [page, setPage] = useState(1)
  const PAR_PAGE = 12

  const chargerProduits = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('produits').select('*', { count: 'exact' }).eq('actif', true)

    if (recherche) query = query.ilike('nom', `%${recherche}%`)
    if (categorie) query = query.eq('categorie', categorie)
    if (sousCategorie) query = query.eq('sous_categorie', sousCategorie)
    if (prixMax < PRIX_MAX) query = query.lte('prix', prixMax)
    if (badge) query = query.eq('badge', badge)

    switch (tri) {
      case 'prix_asc':  query = query.order('prix', { ascending: true }); break
      case 'prix_desc': query = query.order('prix', { ascending: false }); break
      default:          query = query.order('created_at', { ascending: false })
    }

    query = query.range((page - 1) * PAR_PAGE, page * PAR_PAGE - 1)

    const { data, count, error } = await query
    if (!error && data) {
      setProduits(data)
      setTotal(count || 0)
    }
    setLoading(false)
  }, [recherche, categorie, sousCategorie, prixMax, badge, tri, page])

  useEffect(() => { chargerProduits() }, [chargerProduits])
  useEffect(() => { fetchCategories().then(setCats) }, [])
  useEffect(() => {
    setRecherche(searchParams.get('q') || '')
    setCategorie(searchParams.get('categorie') || '')
    setSousCategorie(searchParams.get('sousCategorie') || '')
  }, [searchParams])

  const resetFiltres = () => {
    setRecherche(''); setCategorie(''); setSousCategorie(''); setPrixMax(PRIX_MAX)
    setBadge(''); setTri('pertinence'); setPage(1)
    router.push('/produits')
  }

  const nbPages = Math.ceil(total / PAR_PAGE)
  const filtresActifs = recherche || categorie || sousCategorie || prixMax < PRIX_MAX || badge

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-condensed font-bold text-acier">
            {categorie
              ? cats.find(c => c.id === categorie)?.label || 'Produits'
              : recherche ? `Résultats pour "${recherche}"` : 'Tous les produits'}
          </h1>
          {!loading && <p className="text-sm text-gray-500">{total} produit{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}</p>}
        </div>
        <div className="flex items-center gap-2">
          <select value={tri} onChange={e => { setTri(e.target.value); setPage(1) }}
            className="input-field w-auto text-sm">
            <option value="pertinence">Pertinence</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
          </select>
          <button onClick={() => setFiltresOuverts(!filtresOuverts)}
            className="flex items-center gap-2 border border-gray-200 rounded px-3 py-2 text-sm hover:border-brique md:hidden">
            <SlidersHorizontal size={15}/> Filtres
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className={`${filtresOuverts ? 'block' : 'hidden'} md:block w-full md:w-56 shrink-0`}>
          <div className="card p-4 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-condensed font-bold text-acier">Filtres</h2>
              {filtresActifs && (
                <button onClick={resetFiltres} className="text-xs text-brique hover:underline flex items-center gap-1">
                  <X size={12}/> Effacer
                </button>
              )}
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                Prix max : {prixMax >= PRIX_MAX ? '500 000+' : formatPrix(prixMax)}
              </label>
              <input type="range" min={0} max={PRIX_MAX} step={5000} value={prixMax}
                onChange={e => { setPrixMax(Number(e.target.value)); setPage(1) }}
                className="w-full accent-brique"/>
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
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card h-64 animate-pulse bg-gray-100 rounded-lg"/>
              ))}
            </div>
          ) : produits.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-condensed font-bold text-xl text-acier mb-2">Aucun produit trouvé</h3>
              <button onClick={resetFiltres} className="btn-primary">Voir tous les produits</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {produits.map(p => <CarteProduit key={p.id} produit={p}/>)}
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
