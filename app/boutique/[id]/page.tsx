'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Store, Zap, Package, ArrowLeft } from 'lucide-react'
import { supabase, formatPrix } from '../../../lib/supabase'

export default function PageBoutique() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const villeParam = searchParams.get('ville') || ''

  const [entreprise, setEntreprise] = useState<any>(null)
  const [magasins, setMagasins] = useState<any[]>([])
  const [ville, setVille] = useState('')
  const [produits, setProduits] = useState<any[]>([])
  const [taux, setTaux] = useState(0)
  const [loading, setLoading] = useState(true)

  // Entreprise + magasins + commission (une fois)
  useEffect(() => {
    (async () => {
      const [ent, mags, cc] = await Promise.all([
        supabase.from('entreprises').select('nom').eq('id', id).maybeSingle(),
        supabase.from('partenaires_magasins').select('id, nom, ville, quartier, horaires').eq('entreprise_id', id).eq('actif', true),
        supabase.from('commission_config').select('taux').eq('id', 1).maybeSingle(),
      ])
      setEntreprise(ent.data)
      setMagasins(mags.data || [])
      setTaux(Number(cc.data?.taux || 0))
      const villes = Array.from(new Set((mags.data || []).map((m: any) => m.ville)))
      setVille((villeParam && villes.includes(villeParam)) ? villeParam : (villes[0] as string || ''))
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Produits du partenaire pour la ville choisie + disponibilité par magasin
  useEffect(() => {
    if (!ville) { if (magasins.length) setLoading(false); return }
    (async () => {
      setLoading(true)
      const magsVille = magasins.filter(m => m.ville === ville)
      const ids = magsVille.map(m => m.id)
      if (!ids.length) { setProduits([]); setLoading(false); return }

      const { data: stocks } = await supabase
        .from('stocks_partenaires')
        .select('quantite, prix_local, disponible_immediat, point_vente_id, produit_id')
        .in('point_vente_id', ids)
        .gt('quantite', 0)

      const prodIds = Array.from(new Set((stocks || []).map((s: any) => s.produit_id)))
      let prodMap = new Map<string, any>()
      if (prodIds.length) {
        const { data: prods } = await supabase
          .from('produits')
          .select('id, nom, image_url, images, unite, reference')
          .in('id', prodIds)
          .eq('actif', true)
        prodMap = new Map((prods || []).map((p: any) => [p.id, p]))
      }

      const groupes = new Map<string, any>()
      ;(stocks || []).forEach((s: any) => {
        const p = prodMap.get(s.produit_id)
        if (!p) return // produit inactif ou supprimé
        if (!groupes.has(p.id)) groupes.set(p.id, { produit: p, stores: [] as any[], prixMin: Infinity })
        const g = groupes.get(p.id)
        const mag = magsVille.find(m => m.id === s.point_vente_id)
        g.stores.push({ mag, quantite: s.quantite, prix_local: s.prix_local, dispo: s.disponible_immediat })
        if (s.prix_local > 0) g.prixMin = Math.min(g.prixMin, s.prix_local)
      })
      setProduits(Array.from(groupes.values()).sort((a, b) => a.produit.nom.localeCompare(b.produit.nom)))
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville, magasins])

  const prixClient = (base: number) => Math.round(base * (1 + taux / 100))
  const villes = Array.from(new Set(magasins.map(m => m.ville)))
  const photo = (p: any) => (Array.isArray(p.images) && p.images.length ? p.images[0] : p.image_url) || ''

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/produits" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brique mb-5">
        <ArrowLeft size={16} /> Retour au catalogue
      </Link>

      {/* En-tête boutique */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-brique flex items-center justify-center shrink-0">
          <Store size={26} className="text-white" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Boutique partenaire</p>
          <h1 className="font-condensed font-bold text-2xl text-acier">{entreprise?.nom || 'Partenaire'}</h1>
        </div>
      </div>

      {/* Sélecteur de ville */}
      {villes.length > 0 && (
        <div className="mb-6 max-w-xs">
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Ville</label>
          <select value={ville} onChange={e => setVille(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-acier focus:border-brique outline-none">
            {villes.map(v => <option key={v as string} value={v as string}>{v as string}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : produits.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun produit disponible chez ce partenaire à {ville || 'cette ville'}.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{produits.length} produit{produits.length > 1 ? 's' : ''} disponible{produits.length > 1 ? 's' : ''} à {ville}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {produits.map(({ produit, stores, prixMin }) => (
              <div key={produit.id} className="card overflow-hidden flex flex-col">
                <Link href={`/produits/${produit.id}`} className="block">
                  <div className="h-36 bg-beton flex items-center justify-center overflow-hidden">
                    {photo(produit) ? (
                      <img src={photo(produit)} alt={produit.nom} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>
                </Link>
                <div className="p-3 flex-1 flex flex-col">
                  <Link href={`/produits/${produit.id}`} className="font-bold text-sm text-acier leading-snug hover:text-brique line-clamp-2">
                    {produit.nom}
                  </Link>
                  <div className="mt-1 mb-2">
                    {prixMin !== Infinity
                      ? <span className="font-condensed font-bold text-brique">À partir de {formatPrix(prixClient(prixMin))}</span>
                      : <span className="text-sm text-gray-400">Voir le prix</span>}
                  </div>

                  {/* Disponibilité par magasin (même ville) */}
                  <div className="mt-auto space-y-1.5 border-t pt-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Disponible à</p>
                    {stores.map((st: any, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <MapPin size={12} className="text-brique mt-0.5 shrink-0" />
                        <span className="text-gray-600 flex-1 min-w-0">
                          <span className="font-medium text-acier">{st.mag?.quartier || st.mag?.nom}</span>
                          {' · '}{st.quantite} en stock
                          {st.dispo && <span className="text-green-600 font-medium inline-flex items-center gap-0.5 ml-1"><Zap size={9} /> retrait immédiat</span>}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link href={`/produits/${produit.id}`}
                    className="mt-3 text-center text-xs font-semibold bg-acier text-white rounded-lg py-2 hover:bg-acier/90">
                    Voir / acheter
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
