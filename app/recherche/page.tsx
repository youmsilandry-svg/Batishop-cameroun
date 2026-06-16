'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X, Grid, List } from 'lucide-react'
import { supabase, formatPrix, CATEGORIES } from '../../lib/supabase'
import { CarteProduit } from '../../components/produits/CarteProduit'

const PRIX_MAX = 1000000

// Enlever les accents pour comparaison côté client
function normaliser(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function RechercheContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''

  const [produits, setProduits] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [inputVal, setInputVal] = useState(q)
  const [categorie, setCategorie] = useState('')
  const [prixMax, setPrixMax] = useState(PRIX_MAX)
  const [tri, setTri] = useState('pertinence')
  const [vue, setVue] = useState<'grille'|'liste'>('grille')
  const [filtresOuverts, setFiltresOuverts] = useState(false)
  const [showSugg, setShowSugg] = useState(false)

  const chercher = useCallback(async (terme: string, cat: string, pMax: number) => {
    if (!terme.trim()) return
    setLoading(true)
    try {
      // Essayer la fonction RPC avec support accents
      const { data, error } = await supabase.rpc('recherche_produits', {
        terme: terme.trim(),
        cat: cat || null,
        prix_min: 0,
        prix_max: pMax,
        limite: 24,
        offset_val: 0
      })
      if (!error && data) {
        setProduits(data)
        setTotal(data.length)
        setLoading(false)
        return
      }
    } catch {}

    // Fallback : recherche manuelle avec normalisation accents
    try {
      const { data: tous } = await supabase
        .from('produits')
        .select('*')
        .eq('actif', true)
        .lte('prix', pMax)
        .limit(200)

      if (tous) {
        const termeN = normaliser(terme)
        const resultats = tous.filter(p => {
          if (cat && p.categorie !== cat) return false
          const nomN = normaliser(p.nom || '')
          const descN = normaliser(p.description || '')
          const refN = normaliser(p.reference || '')
          const catN = normaliser(p.categorie || '')
          // Correspondance exacte sans accents
          if (nomN.includes(termeN) || descN.includes(termeN) || refN.includes(termeN) || catN.includes(termeN)) return true
          // Correspondance approchée : chaque mot du terme dans le nom
          const mots = termeN.split(' ').filter(m => m.length > 2)
          return mots.every(m => nomN.includes(m) || descN.includes(m))
        })
        setProduits(resultats)
        setTotal(resultats.length)
      }
    } catch {}
    setLoading(false)
  }, [])

  const chercherSuggestions = useCallback(async (terme: string) => {
    if (!terme || terme.length < 2) { setSuggestions([]); return }
    try {
      const { data } = await supabase.rpc('recherche_produits', {
        terme: terme.trim(),
        cat: null,
        prix_min: 0,
        prix_max: PRIX_MAX,
        limite: 6,
        offset_val: 0
      })
      if (data) { setSuggestions(data); return }
    } catch {}
    // Fallback suggestions
    const { data } = await supabase.from('produits').select('nom, categorie, prix').eq('actif', true).limit(200)
    if (data) {
      const termeN = normaliser(terme)
      const filtre = data.filter(p => normaliser(p.nom).includes(termeN)).slice(0, 6)
      setSuggestions(filtre)
    }
  }, [])

  useEffect(() => {
    setInputVal(q)
    if (q) chercher(q, categorie, prixMax)
  }, [q, categorie, prixMax, chercher])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSugg(false)
    if (inputVal.trim()) router.push('/recherche?q=' + encodeURIComponent(inputVal.trim()))
  }

  const handleSugg = (nom: string) => {
    setInputVal(nom)
    setShowSugg(false)
    router.push('/recherche?q=' + encodeURIComponent(nom))
  }

  const produitsTries = [...produits].sort((a, b) => {
    if (tri === 'prix_asc') return a.prix - b.prix
    if (tri === 'prix_desc') return b.prix - a.prix
    return 0
  })

  const TENDANCES = ['Ciment', 'Câble', 'Panneau solaire', 'Carrelage', 'Robinet', 'Perceuse', 'Peinture', 'Fer béton']

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* BARRE DE RECHERCHE */}
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex shadow-lg rounded-xl overflow-hidden border-2 border-brique">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input
                type="text"
                value={inputVal}
                onChange={e => {
                  setInputVal(e.target.value)
                  setShowSugg(true)
                  chercherSuggestions(e.target.value)
                }}
                onFocus={() => inputVal.length > 1 && setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 200)}
                placeholder="Chercher ciment, câble, panneau solaire..."
                className="w-full pl-12 pr-10 py-4 text-base focus:outline-none"
                autoComplete="off"
              />
              {inputVal && (
                <button type="button" onClick={() => { setInputVal(''); setSuggestions([]) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={18}/>
                </button>
              )}
            </div>
            <button type="submit" className="bg-brique text-white px-8 font-bold hover:bg-brique-dark transition-colors text-sm">
              Rechercher
            </button>
          </div>

          {/* Suggestions */}
          {showSugg && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-xl border border-gray-200 rounded-b-xl z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button key={i} type="button" onMouseDown={() => handleSugg(s.nom)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-beton border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Search size={14} className="text-gray-400 shrink-0"/>
                    <span className="text-sm text-acier">{s.nom}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400 hidden md:block">
                      {CATEGORIES.find(c => c.id === s.categorie)?.label}
                    </span>
                    <span className="text-sm font-bold text-brique">{formatPrix(s.prix)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Tendances */}
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 font-medium">Populaire :</span>
          {TENDANCES.map(t => (
            <button key={t}
              onClick={() => router.push('/recherche?q=' + encodeURIComponent(t))}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                q === t ? 'bg-brique text-white border-brique' : 'bg-white border-gray-200 text-acier hover:border-brique hover:text-brique'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {q && (
        <div className="flex gap-6">
          {/* FILTRES */}
          <aside className={`${filtresOuverts ? 'block' : 'hidden'} md:block w-56 shrink-0`}>
            <div className="card p-4 space-y-5 sticky top-24">
              <div className="flex items-center justify-between">
                <h2 className="font-condensed font-bold text-acier">Affiner</h2>
                {(categorie || prixMax < PRIX_MAX) && (
                  <button onClick={() => { setCategorie(''); setPrixMax(PRIX_MAX) }}
                    className="text-xs text-brique flex items-center gap-1 hover:underline">
                    <X size={12}/> Effacer
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Catégorie</label>
                <div className="space-y-0.5">
                  <button onClick={() => setCategorie('')}
                    className={`w-full text-left text-sm px-3 py-2 rounded ${!categorie ? 'bg-brique text-white' : 'hover:bg-beton text-acier'}`}>
                    Toutes
                  </button>
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setCategorie(c.id)}
                      className={`w-full text-left text-sm px-3 py-2 rounded flex items-center gap-2 ${categorie === c.id ? 'bg-brique text-white' : 'hover:bg-beton text-acier'}`}>
                      <span>{c.emoji}</span><span className="truncate text-xs">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">
                  Prix max : {prixMax >= PRIX_MAX ? 'Tous' : formatPrix(prixMax)}
                </label>
                <input type="range" min={0} max={PRIX_MAX} step={5000} value={prixMax}
                  onChange={e => setPrixMax(Number(e.target.value))}
                  className="w-full accent-brique"/>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span><span>1M FCFA</span>
                </div>
              </div>
            </div>
          </aside>

          {/* RÉSULTATS */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                {loading ? (
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"/>
                ) : (
                  <>
                    <h1 className="font-condensed font-bold text-xl text-acier">
                      {total > 0
                        ? <>{total} résultat{total > 1 ? 's' : ''} pour <span className="text-brique">"{q}"</span></>
                        : <>Aucun résultat pour <span className="text-brique">"{q}"</span></>
                      }
                    </h1>
                    {categorie && <p className="text-sm text-gray-500">dans {CATEGORIES.find(c => c.id === categorie)?.label}</p>}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select value={tri} onChange={e => setTri(e.target.value)} className="input-field w-auto text-sm">
                  <option value="pertinence">Pertinence</option>
                  <option value="prix_asc">Prix ↑</option>
                  <option value="prix_desc">Prix ↓</option>
                </select>
                <button onClick={() => setVue('grille')} className={`p-2 rounded border ${vue === 'grille' ? 'bg-brique text-white border-brique' : 'border-gray-200 hover:bg-beton'}`}>
                  <Grid size={16}/>
                </button>
                <button onClick={() => setVue('liste')} className={`p-2 rounded border ${vue === 'liste' ? 'bg-brique text-white border-brique' : 'border-gray-200 hover:bg-beton'}`}>
                  <List size={16}/>
                </button>
                <button onClick={() => setFiltresOuverts(!filtresOuverts)} className="md:hidden border border-gray-200 rounded px-3 py-2 text-sm flex items-center gap-1">
                  <SlidersHorizontal size={14}/> Filtres
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse"/>
                ))}
              </div>
            ) : produitsTries.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-condensed font-bold text-xl text-acier mb-2">Aucun produit trouvé pour "{q}"</h3>
                <p className="text-gray-500 text-sm mb-4">Essayez avec d'autres mots-clés ou parcourez nos catégories</p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {TENDANCES.slice(0,4).map(t => (
                    <button key={t} onClick={() => router.push('/recherche?q=' + encodeURIComponent(t))}
                      className="text-sm bg-beton hover:bg-brique hover:text-white text-acier px-3 py-1.5 rounded-full transition-colors">
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={() => router.push('/produits')} className="btn-primary">
                  Voir tous les produits
                </button>
              </div>
            ) : vue === 'grille' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {produitsTries.map(p => <CarteProduit key={p.id} produit={p}/>)}
              </div>
            ) : (
              <div className="space-y-3">
                {produitsTries.map(p => (
                  <div key={p.id} className="card p-4 flex gap-4 items-center hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push('/produits/' + p.id)}>
                    <div className="w-20 h-20 bg-beton rounded-lg flex items-center justify-center shrink-0 overflow-hidden text-3xl">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.nom} className="w-full h-full object-cover rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display='none' }}/>
                        : CATEGORIES.find(c => c.id === p.categorie)?.emoji || '🏗️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">{CATEGORIES.find(c => c.id === p.categorie)?.label} · Réf: {p.reference}</p>
                      <h3 className="font-medium text-sm text-acier mb-1 line-clamp-2">{p.nom}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="font-condensed font-bold text-base text-brique">{formatPrix(p.prix)}</span>
                        <span className="text-xs text-gray-400">/{p.unite}</span>
                        {p.prix_ancien && <span className="text-xs text-gray-400 line-through">{formatPrix(p.prix_ancien)}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`text-xs font-medium mb-2 ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {p.stock > 0 ? '✓ En stock' : '✗ Rupture'}
                      </div>
                      <button className="btn-primary text-xs py-1.5 px-3">Voir →</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PageRecherche() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Chargement...</div>}>
      <RechercheContent/>
    </Suspense>
  )
}
