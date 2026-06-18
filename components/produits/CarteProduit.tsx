'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Heart, Eye } from 'lucide-react'
import { Produit, formatPrix } from '../../lib/supabase'
import BoutonFavori from './BoutonFavori'

export function CarteProduit({ produit }: { produit: Produit }) {
  const [ajoute, setAjoute] = useState(false)
  const [dansPanier, setDansPanier] = useState(false)

  useEffect(() => {
    const check = () => {
      try {
        const data = localStorage.getItem('batishop_panier')
        const items = data ? JSON.parse(data) : []
        setDansPanier(items.some((a: any) => a.produit?.id === produit.id))
      } catch { setDansPanier(false) }
    }
    check()
    window.addEventListener('panier-updated', check)
    window.addEventListener('storage', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.removeEventListener('panier-updated', check)
      window.removeEventListener('storage', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [produit.id])

  const ajouterAuPanier = (e: React.MouseEvent) => {
    e.preventDefault()
    const data = localStorage.getItem('batishop_panier')
    const items = data ? JSON.parse(data) : []
    const existe = items.find((a: any) => a.produit.id === produit.id)
    const nouveau = existe
      ? items.map((a: any) => a.produit.id === produit.id ? { ...a, quantite: a.quantite + 1 } : a)
      : [...items, { produit, quantite: 1 }]
    localStorage.setItem('batishop_panier', JSON.stringify(nouveau))
    window.dispatchEvent(new Event('panier-updated'))
    setDansPanier(true)
    setAjoute(true)
    setTimeout(() => setAjoute(false), 2000)
  }

  const reduction = produit.prix_ancien
    ? Math.round((1 - produit.prix / produit.prix_ancien) * 100)
    : null

  return (
    <Link href={`/produits/${produit.id}`} className={`card group hover:shadow-md transition-shadow block ${dansPanier ? 'ring-2 ring-green-500' : ''}`}>
      {/* Image */}
      <div className="relative overflow-hidden h-40 bg-beton rounded-t-lg flex items-center justify-center">
        {produit.image_url ? (
          <img src={produit.image_url} alt={produit.nom} className="object-cover w-full h-full group-hover:scale-105 transition-transform"/>
        ) : (
          <span className="text-5xl">
            {produit.categorie === 'maconnerie' ? '🧱' :
             produit.categorie === 'plomberie' ? '🔧' :
             produit.categorie === 'electricite' ? '⚡' :
             produit.categorie === 'carrelage' ? '🪟' :
             produit.categorie === 'photovoltaique' ? '☀️' :
             produit.categorie === 'menuiserie' ? '🚪' :
             produit.categorie === 'outillage' ? '🔨' : '🏗️'}
          </span>
        )}
        {reduction && (
          <div className="absolute top-2 left-2 bg-brique text-white text-xs font-bold px-2 py-0.5 rounded">
            -{reduction}%
          </div>
        )}
        <BoutonFavori produitId={produit.id} variant="card" />
        {produit.stock <= 5 && produit.stock > 0 && (
          <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded">
            Plus que {produit.stock} en stock
          </div>
        )}
        {produit.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t-lg">
            <span className="bg-white text-acier text-xs font-bold px-3 py-1 rounded">Rupture de stock</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-3">
        {produit.badge && (
          <span className={`badge-${produit.badge} inline-block mb-1.5`}>
            {produit.badge === 'nouveau' ? 'Nouveau' :
             produit.badge === 'promo' ? 'Promo' : 'Solaire'}
          </span>
        )}
        <h3 className="font-medium text-sm text-acier leading-snug mb-1 line-clamp-2">{produit.nom}</h3>
        <p className="text-xs text-gray-400 mb-2">Réf: {produit.reference}</p>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-condensed font-bold text-base text-brique">{formatPrix(produit.prix)}</span>
          {produit.prix_ancien && (
            <span className="text-xs text-gray-400 line-through">{formatPrix(produit.prix_ancien)}</span>
          )}
          <span className="text-xs text-gray-400">/{produit.unite}</span>
        </div>

        <button
          onClick={ajouterAuPanier}
          disabled={produit.stock === 0}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-semibold transition-colors ${
            ajoute ? 'bg-green-600 text-white' :
            produit.stock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
            dansPanier ? 'bg-green-50 text-green-700 border border-green-600 hover:bg-green-100' :
            'bg-acier text-white hover:bg-brique'
          }`}>
          <ShoppingCart size={14}/>
          {ajoute ? '✓ Ajouté !' :
           produit.stock === 0 ? 'Indisponible' :
           dansPanier ? '✓ Dans le panier' : 'Ajouter au panier'}
        </button>
      </div>
    </Link>
  )
}
