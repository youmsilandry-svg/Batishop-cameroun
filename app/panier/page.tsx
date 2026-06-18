'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingCart, Store, MapPin } from 'lucide-react'
import { formatPrix } from '../../lib/supabase'
import { usePanier, cleLigne } from '../../lib/panier'

export default function PagePanier() {
  const { parPartenaire, changerQuantite, retirerDuPanier, viderPanier, total, nbArticles } = usePanier()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null


  if (parPartenaire.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4"/>
      <h1 className="font-condensed font-bold text-2xl text-acier mb-2">Votre panier est vide</h1>
      <p className="text-gray-500 mb-6">Parcourez les produits et choisissez une boutique pour acheter.</p>
      <Link href="/produits" className="btn-primary">Voir les produits</Link>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-condensed font-bold text-2xl text-acier mb-1">
        Mon panier <span className="text-gray-400 font-normal">({nbArticles} article{nbArticles > 1 ? 's' : ''})</span>
      </h1>
      <p className="text-sm text-gray-500 mb-6">Vos articles sont regroupés par boutique. Le mode (retrait ou livraison) se choisit à l'étape suivante.</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Groupes par partenaire */}
        <div className="flex-1 space-y-5">
          {parPartenaire.map(groupe => (
            <div key={groupe.point_vente_id} className="card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-beton border-b border-gray-100">
                <Store size={16} className="text-acier"/>
                <span className="font-bold text-sm text-acier">{groupe.partenaire_nom}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11}/> {groupe.ville}</span>
                <span className="ml-auto text-xs text-gray-400">{groupe.lignes.length} produit{groupe.lignes.length > 1 ? 's' : ''}</span>
              </div>

              <div className="divide-y divide-gray-50">
                {groupe.lignes.map(a => {
                  const cle = cleLigne(a.produit.id, a.point_vente_id)
                  return (
                    <div key={cle} className="p-4 flex gap-4 items-start">
                      <div className="w-16 h-16 bg-beton rounded flex items-center justify-center text-2xl shrink-0">
                        {a.produit.image_url
                          ? <img src={a.produit.image_url} alt={a.produit.nom} className="object-cover w-full h-full rounded"/>
                          : '🏗️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-acier leading-snug mb-0.5 truncate">{a.produit.nom}</h3>
                        <p className="text-xs text-gray-400 mb-2">{formatPrix(a.prix_unitaire)} / {a.produit.unite}</p>
                        <div className="flex items-center border rounded overflow-hidden w-fit">
                          <button onClick={() => changerQuantite(cle, a.quantite - 1)} className="px-2 py-1 hover:bg-beton text-acier"><Minus size={14}/></button>
                          <input type="number" min={1} value={a.quantite}
                            onChange={e => changerQuantite(cle, e.target.value === '' ? 1 : Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-14 text-center py-1 text-sm font-medium border-x focus:outline-none" style={{ MozAppearance: 'textfield' }}/>
                          <button onClick={() => changerQuantite(cle, a.quantite + 1)} className="px-2 py-1 hover:bg-beton text-acier"><Plus size={14}/></button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-condensed font-bold text-brique text-base">{formatPrix(a.prix_unitaire * a.quantite)}</div>
                        <button onClick={() => retirerDuPanier(cle)} className="mt-2 text-gray-400 hover:text-brique p-1"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="px-4 py-2.5 bg-beton/50 text-sm flex justify-between">
                <span className="text-gray-500">Sous-total {groupe.partenaire_nom}</span>
                <span className="font-bold text-acier">{formatPrix(groupe.sousTotal)}</span>
              </div>
            </div>
          ))}

          <button onClick={viderPanier} className="text-sm text-gray-400 hover:text-brique flex items-center gap-1">
            <Trash2 size={14}/> Vider le panier
          </button>
        </div>

        {/* Récapitulatif */}
        <div className="lg:w-80 shrink-0">
          <div className="card p-5 sticky top-24">
            <h2 className="font-condensed font-bold text-lg text-acier mb-4">Récapitulatif</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Produits</span>
                <span>{formatPrix(total)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Livraison</span>
                <span className="text-xs">calculée à l'étape suivante</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total produits</span>
                <span className="text-brique">{formatPrix(total)}</span>
              </div>
              <p className="text-xs text-gray-400">{parPartenaire.length} boutique{parPartenaire.length > 1 ? 's' : ''} dans ce panier</p>
            </div>
            <Link href="/commande" className="btn-primary w-full text-center block py-3">
              Passer la commande →
            </Link>
            <Link href="/produits" className="block text-center text-sm text-gray-500 hover:text-brique mt-3">
              ← Continuer mes achats
            </Link>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-400 text-center mb-2">Paiement accepté</p>
              <div className="flex justify-center gap-2 text-xs text-gray-500">
                <span>📱 Orange</span> <span>📱 MTN</span> <span>💵 À la réception</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
