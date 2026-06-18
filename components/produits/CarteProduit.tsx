'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Check } from 'lucide-react'
import { Produit, formatPrix } from '../../lib/supabase'
import BoutonFavori from './BoutonFavori'

export function CarteProduit({ produit }: { produit: Produit }) {
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

  const reduction = produit.prix_ancien
    ? Math.round((1 - produit.prix / produit.prix_ancien) * 100)
    : null

  return (
    <Link href={`/produits/${produit.id}`} className="card group hover:shadow-md transition-shadow block">
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

        {/* Petite marque de rappel : produit déjà dans le panier */}
        {dansPanier && (
          <p className="text-xs text-green-600 font-medium mb-1.5 flex items-center gap-1">
            <Check size={13}/> Déjà dans votre panier
          </p>
        )}

        {/* Choisir où acheter (mène à la page produit pour choisir le partenaire) */}
        <div
          className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-semibold transition-colors ${
            produit.stock === 0 ? 'bg-gray-100 text-gray-400' : 'bg-acier text-white group-hover:bg-brique'
          }`}>
          <ShoppingCart size={14}/>
          {produit.stock === 0 ? 'Indisponible' : 'Choisir où acheter'}
        </div>
      </div>
    </Link>
  )
}
