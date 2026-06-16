'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShoppingCart, ArrowLeft, Truck, Shield, RotateCcw, Phone, Star, ChevronDown, ChevronUp, Check, Minus, Plus } from 'lucide-react'
import { supabase, formatPrix, CATEGORIES } from '../../../lib/supabase'
import { OuTrouver } from '../../../components/produits/OuTrouver'

export default function PageDetailProduit() {
  const { id } = useParams()
  const router = useRouter()
  const [produit, setProduit] = useState(null)
  const [prixMoyen, setPrixMoyen] = useState<any>(null)
  const [quantite, setQuantite] = useState(1)
  const [inputQuantite, setInputQuantite] = useState('1')
  const [ajoute, setAjoute] = useState(false)
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState('description')

  useEffect(() => {
    async function charger() {
      const { data } = await supabase.from('produits').select('*').eq('id', id).single()
      setProduit(data)
      const { data: pm } = await supabase.from('prix_moyen_partenaires')
        .select('prix_moyen, nb_partenaires').eq('produit_id', id).maybeSingle()
      setPrixMoyen(pm)
      setLoading(false)
    }
    if (id) charger()
  }, [id])

  // Sync quantite -> inputQuantite quand on clique +/-
  useEffect(() => {
    setInputQuantite(String(quantite))
  }, [quantite])

  const diminuer = () => {
    const nouvelle = Math.max(1, quantite - 1)
    setQuantite(nouvelle)
  }

  const augmenter = () => {
    const max = produit?.stock || 999
    const nouvelle = Math.min(max, quantite + 1)
    setQuantite(nouvelle)
  }

  const handleInputChange = (e) => {
    // Laisser l'utilisateur taper librement
    setInputQuantite(e.target.value)
  }

  const handleInputBlur = () => {
    // Valider quand l'utilisateur quitte le champ
    const val = parseInt(inputQuantite)
    const max = produit?.stock || 999
    if (!isNaN(val) && val >= 1 && val <= max) {
      setQuantite(val)
    } else if (!isNaN(val) && val < 1) {
      setQuantite(1)
      setInputQuantite('1')
    } else if (!isNaN(val) && val > max) {
      setQuantite(max)
      setInputQuantite(String(max))
    } else {
      // Valeur invalide → revenir à l'ancienne
      setInputQuantite(String(quantite))
    }
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur()
  }

  const ajouterAuPanier = () => {
    if (!produit) return
    const data = localStorage.getItem('batishop_panier')
    const items = data ? JSON.parse(data) : []
    const existe = items.find((a) => a.produit.id === produit.id)
    const nouveau = existe
      ? items.map((a) => a.produit.id === produit.id ? { ...a, quantite: a.quantite + quantite } : a)
      : [...items, { produit, quantite }]
    localStorage.setItem('batishop_panier', JSON.stringify(nouveau))
    window.dispatchEvent(new Event('panier-updated'))
    setAjoute(true)
    setTimeout(() => setAjoute(false), 2000)
  }

  const cat = CATEGORIES.find((c) => c.id === produit?.categorie)
  const reduction = produit?.prix_ancien ? Math.round((1 - produit.prix / produit.prix_ancien) * 100) : null

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"/>
        <div className="h-64 bg-gray-200 rounded"/>
      </div>
    </div>
  )

  if (!produit) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="font-condensed font-bold text-2xl text-acier mb-2">Produit introuvable</h1>
      <button onClick={() => router.push('/produits')} className="btn-primary mt-4">Voir tous les produits</button>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4 flex-wrap">
        <button onClick={() => router.push('/')} className="hover:text-brique">Accueil</button>
        <span>/</span>
        <button onClick={() => router.push('/produits')} className="hover:text-brique">Produits</button>
        <span>/</span>
        <button onClick={() => router.push(`/produits?categorie=${produit.categorie}`)} className="hover:text-brique">{cat?.label}</button>
        <span>/</span>
        <span className="text-acier font-medium truncate max-w-xs">{produit.nom}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* IMAGE */}
        <div>
          <div className="bg-beton rounded-xl flex items-center justify-center h-80 lg:h-96 relative overflow-hidden border border-gray-100">
            {produit.image_url ? (
              <img src={produit.image_url} alt={produit.nom} className="object-contain w-full h-full p-4"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}/>
            ) : (
              <span className="text-9xl">{cat?.emoji || '🏗️'}</span>
            )}
            {reduction && (
              <div className="absolute top-4 left-4 bg-brique text-white font-bold text-sm px-3 py-1 rounded">
                -{reduction}%
              </div>
            )}
            {produit.badge === 'nouveau' && (
              <div className="absolute top-4 right-4 bg-green-600 text-white font-bold text-xs px-2 py-1 rounded">
                NOUVEAU
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { icon: Truck, titre: 'Livraison 48h', sub: 'Partout au CM' },
              { icon: Shield, titre: 'Qualité garantie', sub: 'Produits certifiés' },
              { icon: RotateCcw, titre: 'Retour facile', sub: 'Sous 7 jours' },
            ].map(item => (
              <div key={item.titre} className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-gray-100">
                <item.icon size={20} className="text-brique mb-1"/>
                <span className="text-xs font-medium text-acier">{item.titre}</span>
                <span className="text-xs text-gray-400">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* INFOS */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs bg-beton text-gray-500 px-2 py-0.5 rounded font-medium">{cat?.label}</span>
            <span className="text-xs text-gray-400">Réf: {produit.reference}</span>
          </div>

          <h1 className="font-condensed font-bold text-2xl lg:text-3xl text-acier mb-3 leading-tight">{produit.nom}</h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={14} className={i <= 4 ? 'text-or fill-or' : 'text-gray-300'}/>
              ))}
            </div>
            <span className="text-xs text-gray-500">4.0/5 (12 avis)</span>
          </div>

          {/* PRIX */}
          <div className="bg-beton rounded-xl p-4 mb-4">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="font-condensed font-bold text-3xl text-brique">{formatPrix(prixMoyen?.prix_moyen || produit.prix)}</span>
              <span className="text-sm text-gray-500">/ {produit.unite}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {prixMoyen?.nb_partenaires > 0
                ? `Prix moyen sur ${prixMoyen.nb_partenaires} boutique${prixMoyen.nb_partenaires > 1 ? 's' : ''} — choisissez votre boutique ci-dessous`
                : 'Prix indicatif — choisissez votre boutique ci-dessous'}
            </p>
          </div>

          {/* Stock */}
          <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
            produit.stock > 10 ? 'bg-green-50 text-green-700' :
            produit.stock > 0 ? 'bg-amber-50 text-amber-700' :
            'bg-red-50 text-red-700'}`}>
            <Check size={16}/>
            <span className="text-sm font-medium">
              {produit.stock > 10 ? `En stock — ${produit.stock} disponibles` :
               produit.stock > 0 ? `Stock limité — Plus que ${produit.stock} en stock !` :
               'Rupture de stock'}
            </span>
          </div>

          {/* ===== CHOIX DE LA BOUTIQUE ===== */}
          <button
            onClick={() => document.getElementById('ou-trouver')?.scrollIntoView({ behavior: 'smooth' })}
            disabled={produit.stock === 0}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-bold text-base transition-colors ${
              produit.stock === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
              'bg-brique text-white hover:bg-brique-dark'}`}>
            <ShoppingCart size={20}/>
            {produit.stock === 0 ? 'Rupture de stock' : 'Choisir une boutique ↓'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">Comparez les prix des partenaires et achetez chez celui de votre choix.</p>

          {/* Contact */}
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg mt-4">
            <Phone size={20} className="text-brique shrink-0"/>
            <div>
              <p className="text-xs font-bold text-acier">Besoin de conseils ?</p>
              <p className="text-xs text-gray-500">
                Appelez-nous : <a href="tel:+237600000000" className="text-brique font-medium">+237 6XX XXX XXX</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'description', label: 'Description' },
            { id: 'caracteristiques', label: 'Caractéristiques' },
            { id: 'livraison', label: 'Livraison & Paiement' },
            { id: 'avis', label: 'Avis (12)' },
          ].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                onglet === o.id ? 'border-brique text-brique' : 'border-transparent text-gray-500 hover:text-acier'}`}>
              {o.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {onglet === 'description' && (
            <div>
              <p className="text-gray-600 leading-relaxed mb-4">
                {produit.description || `${produit.nom} — produit de qualité professionnelle disponible chez BatiShop Cameroun.`}
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {[
                  { titre: 'Points forts', items: ['Qualité professionnelle', 'Livraison rapide', 'Prix compétitif', 'Stock disponible'] },
                  { titre: 'Applications', items: ['Construction neuve', 'Rénovation', 'Usage professionnel', 'Particuliers'] },
                ].map(bloc => (
                  <div key={bloc.titre} className="bg-beton rounded-lg p-4">
                    <h4 className="font-bold text-acier text-sm mb-2">{bloc.titre}</h4>
                    <ul className="space-y-1">
                      {bloc.items.map(item => (
                        <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check size={14} className="text-green-600 shrink-0"/> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onglet === 'caracteristiques' && (
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Référence', produit.reference],
                  ['Catégorie', cat?.label],
                  ['Unité de vente', produit.unite],
                  ['Stock disponible', `${produit.stock} unités`],
                  ['Prix unitaire', formatPrix(produit.prix)],
                  ['Garantie', '6 mois'],
                ].map(([label, val], i) => (
                  <tr key={label} className={i % 2 === 0 ? 'bg-beton' : 'bg-white'}>
                    <td className="px-4 py-2.5 font-medium text-gray-600 w-1/3">{label}</td>
                    <td className="px-4 py-2.5 text-acier">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {onglet === 'livraison' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-acier mb-3 flex items-center gap-2">
                  <Truck size={18} className="text-brique"/> Livraison
                </h3>
                <div className="space-y-2">
                  {[
                    { ville: 'Douala', delai: '24h', prix: 'Gratuite dès 100 000 FCFA' },
                    { ville: 'Yaoundé', delai: '48h', prix: 'Gratuite dès 100 000 FCFA' },
                    { ville: 'Bafoussam', delai: '48-72h', prix: '5 000 FCFA' },
                    { ville: 'Autres villes', delai: '3-5 jours', prix: 'Sur devis' },
                  ].map(l => (
                    <div key={l.ville} className="flex justify-between p-3 bg-beton rounded-lg text-sm">
                      <div>
                        <span className="font-medium text-acier">{l.ville}</span>
                        <span className="text-gray-500 ml-2">({l.delai})</span>
                      </div>
                      <span className="text-brique font-medium">{l.prix}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-acier mb-3 flex items-center gap-2">
                  <Shield size={18} className="text-brique"/> Paiement accepté
                </h3>
                <div className="space-y-2">
                  {['Orange Money', 'MTN Mobile Money', 'Visa / Mastercard', 'Paiement à la livraison'].map(m => (
                    <div key={m} className="flex items-center gap-3 p-3 bg-beton rounded-lg text-sm">
                      <Check size={14} className="text-green-600 shrink-0"/>
                      <span className="font-medium text-acier">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {onglet === 'avis' && (
            <div>
              <div className="flex items-center gap-4 mb-6 p-4 bg-beton rounded-xl">
                <div className="text-center">
                  <div className="font-condensed font-bold text-4xl text-acier">4.0</div>
                  <div className="flex justify-center mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} className={i <= 4 ? 'text-or fill-or' : 'text-gray-300'}/>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">12 avis</div>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { nom: 'Jean-Pierre K.', note: 5, date: 'Il y a 2 semaines', texte: 'Excellent produit, livraison rapide à Douala !' },
                  { nom: 'Marie T.', note: 4, date: 'Il y a 1 mois', texte: 'Bonne qualité, prix correct.' },
                  { nom: 'Paul N.', note: 4, date: 'Il y a 2 mois', texte: 'Conforme à la description. Bon rapport qualité-prix.' },
                ].map((avis, i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-brique text-white flex items-center justify-center text-xs font-bold">
                        {avis.nom[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-acier">{avis.nom}</div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} size={10} className={i <= avis.note ? 'text-or fill-or' : 'text-gray-300'}/>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{avis.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{avis.texte}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <OuTrouver produit={produit} />
      </div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-brique">
        <ArrowLeft size={16}/> Retour au catalogue
      </button>
    </div>
  )
}
