'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Package, CheckCircle, AlertCircle, Filter } from 'lucide-react'
import { supabase, CATEGORIES } from '../../../../lib/supabase'

export default function GestionStocks() {
  const router = useRouter()
  const [magasin, setMagasin] = useState<any>(null)
  const [stocks, setStocks] = useState<any[]>([])
  const [produitsSansStock, setProduitsSansStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreCat, setFiltreCat] = useState('')
  const [filtreStock, setFiltreStock] = useState('tous')
  const [modifications, setModifications] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [succes, setSucces] = useState(0)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/partenaires/connexion'); return }
      const { data: mag } = await supabase.from('partenaires_magasins').select('*').eq('user_id', user.id).single()
      if (!mag) { router.push('/partenaires/connexion'); return }
      setMagasin(mag)
      const { data: stks } = await supabase
        .from('stocks_partenaires')
        .select('*, produits(id, nom, categorie, reference, prix, unite)')
        .eq('partenaire_id', mag.id)
      setStocks(stks || [])
      setLoading(false)
    }
    charger()
  }, [router])

  const stocksFiltres = stocks.filter(s => {
    const prod = s.produits
    if (!prod) return false
    if (recherche && !prod.nom.toLowerCase().includes(recherche.toLowerCase())) return false
    if (filtreCat && prod.categorie !== filtreCat) return false
    if (filtreStock === 'dispo' && s.quantite === 0) return false
    if (filtreStock === 'rupture' && s.quantite > 0) return false
    return true
  })

  const updateQuantite = (stockId: string, val: number) => {
    setModifications(prev => ({ ...prev, [stockId]: Math.max(0, val) }))
  }

  const sauvegarderTout = async () => {
    if (Object.keys(modifications).length === 0) return
    setSaving(true)
    let ok = 0
    for (const [stockId, qte] of Object.entries(modifications)) {
      const { error } = await supabase.from('stocks_partenaires')
        .update({ quantite: qte, disponible_immediat: qte > 0, updated_at: new Date().toISOString() })
        .eq('id', stockId)
      if (!error) {
        setStocks(prev => prev.map(s => s.id === stockId ? { ...s, quantite: qte, disponible_immediat: qte > 0 } : s))
        ok++
      }
    }
    setModifications({})
    setSucces(ok)
    setSaving(false)
    setTimeout(() => setSucces(0), 3000)
  }

  const nbModif = Object.keys(modifications).length
  const nbRuptures = stocks.filter(s => s.quantite === 0).length

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12 text-center"><div className="animate-pulse h-8 bg-gray-200 rounded w-48 mx-auto"/></div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/partenaires/mon-espace" className="p-2 hover:bg-beton rounded-lg">
          <ArrowLeft size={18} className="text-gray-500"/>
        </Link>
        <div>
          <h1 className="font-condensed font-bold text-2xl text-acier">Gérer mes stocks</h1>
          <p className="text-sm text-gray-500">{magasin?.nom} · {stocks.length} produits</p>
        </div>
      </div>

      {/* Alertes */}
      {nbRuptures > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0"/>
          <p className="text-sm text-amber-700">
            <strong>{nbRuptures} produit{nbRuptures > 1 ? 's' : ''}</strong> en rupture de stock — mettez à jour les quantités pour rester visible sur BatiShop.
          </p>
        </div>
      )}

      {succes > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle size={16}/> {succes} stock{succes > 1 ? 's' : ''} mis à jour !
        </div>
      )}

      {/* Barre d'outils */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Chercher un produit..." className="input-field pl-9 text-sm"/>
        </div>
        <select value={filtreCat} onChange={e => setFiltreCat(e.target.value)} className="input-field w-auto text-sm">
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
        <select value={filtreStock} onChange={e => setFiltreStock(e.target.value)} className="input-field w-auto text-sm">
          <option value="tous">Tous</option>
          <option value="dispo">En stock</option>
          <option value="rupture">En rupture</option>
        </select>
        {nbModif > 0 && (
          <button onClick={sauvegarderTout} disabled={saving}
            className={`flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-lg text-white ${saving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
            <CheckCircle size={15}/>
            {saving ? 'Sauvegarde...' : `Enregistrer ${nbModif} modification${nbModif > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">{stocksFiltres.length} produit{stocksFiltres.length > 1 ? 's' : ''} affiché{stocksFiltres.length > 1 ? 's' : ''}</p>

      {/* Tableau stocks */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-xs text-gray-500 text-left">
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3 text-center">Stock actuel</th>
              <th className="px-4 py-3 text-center">Nouvelle quantité</th>
              <th className="px-4 py-3 text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            {stocksFiltres.map(s => {
              const prod = s.produits
              const qteActuelle = modifications[s.id] !== undefined ? modifications[s.id] : s.quantite
              const modifie = modifications[s.id] !== undefined
              return (
                <tr key={s.id} className={`border-b last:border-0 ${modifie ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-acier">{prod?.nom}</div>
                    <div className="text-xs text-gray-400">{prod?.reference}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-beton px-2 py-0.5 rounded">
                      {CATEGORIES.find(c => c.id === prod?.categorie)?.emoji} {prod?.categorie}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${s.quantite === 0 ? 'text-red-500' : s.quantite < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                      {s.quantite}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">{prod?.unite}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number" min={0}
                      value={modifications[s.id] !== undefined ? modifications[s.id] : ''}
                      onChange={e => updateQuantite(s.id, parseInt(e.target.value) || 0)}
                      placeholder={String(s.quantite)}
                      className={`w-20 text-center border rounded px-2 py-1 text-sm focus:outline-none ${modifie ? 'border-blue-400 bg-white' : 'border-gray-200'} focus:border-brique`}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {modifie ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">✏️ Modifié</span>
                    ) : s.quantite === 0 ? (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">⚠️ Rupture</span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ En stock</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {stocksFiltres.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <Package size={32} className="mx-auto mb-2 opacity-30"/>
            Aucun produit trouvé
          </div>
        )}
      </div>

      {/* Bouton sauvegarder bas de page */}
      {nbModif > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button onClick={sauvegarderTout} disabled={saving}
            className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl text-white shadow-lg ${saving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
            <CheckCircle size={18}/>
            {saving ? 'Sauvegarde...' : `Enregistrer ${nbModif} modification${nbModif > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
