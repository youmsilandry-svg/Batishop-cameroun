'use client'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Produit, formatPrix } from '../../lib/supabase'

export function CarteProduit({ produit, prixMoyen }: { produit: Produit; prixMoyen?: number }) {
  const prixEff = produit.prix > 0 ? produit.prix : (prixMoyen || 0)
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
        {(produit as any).partenaire_exclusif && (
          <div className="absolute top-2 left-2 bg-acier text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1" style={{ marginTop: reduction ? 26 : 0 }}>
            🔒 Exclusivité
          </div>
        )}
        <button className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart size={14} className="text-brique"/>
        </button>
        {produit.stock <= 5 && produit.stock > 0 && (
          <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded">
            Plus que {produit.stock} en stock
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
          {prixEff > 0 ? (
            <>
              <span className="font-condensed font-bold text-base text-brique">{formatPrix(prixEff)}</span>
              {produit.prix_ancien ? (
                <span className="text-xs text-gray-400 line-through">{formatPrix(produit.prix_ancien)}</span>
              ) : null}
              <span className="text-xs text-gray-400">/{produit.unite}</span>
            </>
          ) : (
            <span className="font-condensed font-bold text-base text-brique">Voir les prix</span>
          )}
        </div>

        <div className="w-full text-center py-2 rounded text-xs font-semibold bg-acier text-white group-hover:bg-brique transition-colors">
          Choisir où acheter →
        </div>
      </div>
    </Link>
  )
}
