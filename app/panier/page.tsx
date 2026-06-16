'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { formatPrix } from '../../lib/supabase'
import { usePanier } from '../../lib/panier'

export default function PagePanier() {
  const { articles, retirerDuPanier, changerQuantite, viderPanier, total, nbArticles } = usePanier()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const livraison = total > 100000 ? 0 : 5000

  if (articles.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4"/>
      <h1 className="font-condensed font-bold text-2xl text-acier mb-2">Votre panier est vide</h1>
      <p className="text-gray-500 mb-6">Ajoutez des produits pour passer commande</p>
      <Link href="/produits" className="btn-primary">Voir les produits</Link>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-condensed font-bold text-2xl text-acier mb-6">
        Mon panier <span className="text-gray-400 font-normal">({nbArticles} article{nbArticles > 1 ? 's' : ''})</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Articles */}
        <div className="flex-1 space-y-3">
          {articles.map(({ produit, quantite }) => (
            <div key={produit.id} className="card p-4 flex gap-4 items-start">
              <div className="w-20 h-20 bg-beton rounded flex items-center justify-center text-3xl shrink-0">
                {produit.image_url ? (
                  <img src={produit.image_url} alt={produit.nom} className="object-cover w-full h-full rounded"/>
                ) : (
                  produit.categorie === 'maconnerie' ? '🧱' :
                  produit.categorie === 'plomberie' ? '🔧' :
                  produit.categorie === 'electricite' ? '⚡' : '🏗️'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-acier leading-snug mb-0.5 truncate">{produit.nom}</h3>
                <p className="text-xs text-gray-400 mb-2">Réf: {produit.reference}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Quantité */}
                  <div className="flex items-center border rounded overflow-hidden">
                    <button onClick={() => changerQuantite(produit.id, quantite - 1)}
                      className="px-2 py-1 hover:bg-beton text-acier"><Minus size={14}/></button>
                    <span className="px-3 py-1 text-sm font-medium border-x">{quantite}</span>
                    <button onClick={() => changerQuantite(produit.id, quantite + 1)}
                      className="px-2 py-1 hover:bg-beton text-acier"><Plus size={14}/></button>
                  </div>
                  <span className="text-xs text-gray-400">× {formatPrix(produit.prix)}/{produit.unite}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-condensed font-bold text-brique text-base">{formatPrix(produit.prix * quantite)}</div>
                <button onClick={() => retirerDuPanier(produit.id)}
                  className="mt-2 text-gray-400 hover:text-brique p-1"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          <button onClick={viderPanier} className="text-sm text-gray-400 hover:text-brique flex items-center gap-1 mt-2">
            <Trash2 size={14}/> Vider le panier
          </button>
        </div>

        {/* Récapitulatif */}
        <div className="lg:w-80 shrink-0">
          <div className="card p-5 sticky top-24">
            <h2 className="font-condensed font-bold text-lg text-acier mb-4">Récapitulatif</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Sous-total</span>
                <span>{formatPrix(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Livraison</span>
                <span className={livraison === 0 ? 'text-green-600 font-medium' : ''}>{livraison === 0 ? 'Gratuite 🎉' : formatPrix(livraison)}</span>
              </div>
              {livraison > 0 && (
                <p className="text-xs text-gray-400">Livraison gratuite dès {formatPrix(100000)} d'achat</p>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-brique">{formatPrix(total + livraison)}</span>
              </div>
            </div>
            <Link href="/commande" className="btn-primary w-full text-center block py-3 text-center">
              Passer la commande →
            </Link>
            <Link href="/produits" className="block text-center text-sm text-gray-500 hover:text-brique mt-3">
              ← Continuer mes achats
            </Link>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-400 text-center mb-2">Paiement accepté</p>
              <div className="flex justify-center gap-2 text-xs text-gray-500">
                <span>📱 Orange</span> <span>📱 MTN</span> <span>💳 CB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
