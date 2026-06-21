'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Truck, Shield, RotateCcw, Phone, Star, Check, MapPin } from 'lucide-react'
import { supabase, formatPrix, CATEGORIES } from '../../../lib/supabase'
import { OuTrouver } from '../../../components/produits/OuTrouver'
import { SITE } from '../../../lib/config'

// Affiche une description en respectant les retours à la ligne et les listes (lignes en "- ")
function DescriptionFormatee({ texte }: { texte: string }) {
  const lignes = (texte || '').split('\n')
  const blocs: any[] = []
  let puces: string[] = []
  const vider = (k: string) => {
    if (puces.length) {
      blocs.push(
        <ul key={'ul' + k} className="list-disc pl-5 space-y-1 text-gray-600 mb-3">
          {puces.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      )
      puces = []
    }
  }
  lignes.forEach((brut, i) => {
    const ligne = brut.trim()
    if (!ligne) { vider('e' + i); return }
    if (/^[-•*]\s+/.test(ligne)) { puces.push(ligne.replace(/^[-•*]\s+/, '')); return }
    vider('p' + i)
    blocs.push(<p key={'p' + i} className="text-gray-600 leading-relaxed mb-3">{ligne}</p>)
  })
  vider('fin')
  return <>{blocs}</>
}

export default function PageDetailProduit() {
  const { id } = useParams()
  const router = useRouter()
  const [produit, setProduit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stockPartenaires, setStockPartenaires] = useState(0)
  const [prixMoyenClient, setPrixMoyenClient] = useState(0)
  const [onglet, setOnglet] = useState('description')
  const [imgActive, setImgActive] = useState(0)

  // ===== AVIS =====
  const [avisListe, setAvisListe] = useState<any[]>([])
  const [noteMoyenne, setNoteMoyenne] = useState(0)
  const [nbAvis, setNbAvis] = useState(0)
  const [formNom, setFormNom] = useState('')
  const [formNote, setFormNote] = useState(0)
  const [hoverNote, setHoverNote] = useState(0)
  const [formCommentaire, setFormCommentaire] = useState('')
  const [envoiAvis, setEnvoiAvis] = useState(false)
  const [avisEnvoye, setAvisEnvoye] = useState(false)
  const [erreurAvis, setErreurAvis] = useState('')

  const chargerAvis = async () => {
    const { data } = await supabase.from('avis').select('*')
      .eq('produit_id', id).eq('approuve', true)
      .order('created_at', { ascending: false })
    const liste = data || []
    setAvisListe(liste)
    setNbAvis(liste.length)
    setNoteMoyenne(liste.length ? Math.round((liste.reduce((s: number, a: any) => s + a.note, 0) / liste.length) * 10) / 10 : 0)
  }

  const envoyerAvis = async () => {
    if (!formNom.trim() || formNote < 1) {
      setErreurAvis('Indiquez votre nom et une note (étoiles).')
      return
    }
    setEnvoiAvis(true); setErreurAvis('')
    const { error } = await supabase.from('avis').insert({
      produit_id: produit.id,
      nom: formNom.trim().slice(0, 60),
      note: formNote,
      commentaire: formCommentaire.trim().slice(0, 600) || null,
    })
    setEnvoiAvis(false)
    if (error) { setErreurAvis("Impossible d'enregistrer votre avis pour le moment. Réessayez."); return }
    setFormNom(''); setFormNote(0); setFormCommentaire(''); setAvisEnvoye(true)
    setTimeout(() => setAvisEnvoye(false), 4000)
    chargerAvis()
  }

  useEffect(() => {
    async function charger() {
      const { data } = await supabase.from('produits').select('*').eq('id', id).single()
      setProduit(data)
      const { data: stk } = await supabase.from('stocks_partenaires').select('quantite').eq('produit_id', id)
      setStockPartenaires(Array.isArray(stk) ? stk.reduce((s: number, x: any) => s + (x.quantite || 0), 0) : 0)
      // Le prix moyen PAR VILLE est fourni par le composant "Où trouver" (callback onPrixMoyen)
      setLoading(false)
    }
    if (id) charger()
    if (id) chargerAvis()
  }, [id])

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
          {(() => {
            const images: string[] = (Array.isArray(produit.images) && produit.images.length)
              ? produit.images
              : (produit.image_url ? [produit.image_url] : [])
            const active = images[Math.min(imgActive, images.length - 1)] || produit.image_url
            return (
              <>
                <div className="bg-beton rounded-xl flex items-center justify-center h-80 lg:h-96 relative overflow-hidden border border-gray-100">
                  {active ? (
                    <img src={active} alt={produit.nom} className="object-contain w-full h-full p-4"
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
                {images.length > 1 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {images.map((url, i) => (
                      <button key={i} onClick={() => setImgActive(i)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 bg-beton ${i === imgActive ? 'border-brique' : 'border-transparent'}`}>
                        <img src={url} alt="" className="object-cover w-full h-full"
                          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}/>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )
          })()}
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
                <Star key={i} size={14} className={i <= Math.round(noteMoyenne) ? 'text-or fill-or' : 'text-gray-300'}/>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {nbAvis > 0
                ? `${noteMoyenne}/5 (${nbAvis} avis)`
                : 'Pas encore d\u2019avis'}
            </span>
          </div>

          {/* PRIX */}
          <div className="bg-beton rounded-xl p-4 mb-4">
            {(() => {
              const prixEff = produit.prix > 0 ? produit.prix : prixMoyenClient
              return (
                <>
                  <div className="flex items-baseline gap-3 mb-1">
                    {prixEff > 0 ? (
                      <>
                        <span className="font-condensed font-bold text-3xl text-brique">{formatPrix(prixEff)}</span>
                        <span className="text-sm text-gray-500">/ {produit.unite}</span>
                      </>
                    ) : (
                      <span className="font-condensed font-bold text-2xl text-brique">Prix selon le point de vente</span>
                    )}
                  </div>
                  {prixEff > 0 && produit.prix_ancien ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 line-through">{formatPrix(produit.prix_ancien)}</span>
                      <span className="text-sm font-bold text-green-600">Économisez {formatPrix(produit.prix_ancien - prixEff)}</span>
                    </div>
                  ) : null}
                  <p className="text-xs text-gray-500 mt-1">{prixEff > 0 ? 'Prix moyen indicatif — voir les prix par magasin ci-dessous' : 'Voir les prix par magasin ci-dessous'}</p>
                </>
              )
            })()}
          </div>

          {/* Stock */}
          <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
            (produit.stock + stockPartenaires) > 10 ? 'bg-green-50 text-green-700' :
            (produit.stock + stockPartenaires) > 0 ? 'bg-amber-50 text-amber-700' :
            'bg-gray-50 text-gray-600'}`}>
            <Check size={16}/>
            <span className="text-sm font-medium">
              {(produit.stock + stockPartenaires) > 10 ? `En stock — ${produit.stock + stockPartenaires} disponibles` :
               (produit.stock + stockPartenaires) > 0 ? `Stock limité — Plus que ${produit.stock + stockPartenaires} en stock !` :
               'Disponibilité selon le point de vente'}
            </span>
          </div>

          {/* Bouton Choisir où acheter — scroll vers la section "Où trouver" */}
          <button
            onClick={() => document.getElementById('ou-trouver')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-bold text-base transition-colors bg-brique text-white hover:bg-brique-dark">
            <MapPin size={20}/>
            Choisir où acheter
          </button>

          {/* Contact */}
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg mt-4">
            <Phone size={20} className="text-brique shrink-0"/>
            <div>
              <p className="text-xs font-bold text-acier">Besoin de conseils ?</p>
              <p className="text-xs text-gray-500">
                Appelez-nous : <a href={`tel:${SITE.telLien}`} className="text-brique font-medium">{SITE.tel}</a>
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
            { id: 'avis', label: `Avis (${nbAvis})` },
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
              <DescriptionFormatee texte={produit.description || `${produit.nom} — produit de qualité professionnelle disponible chez BatiShop Cameroun.`} />
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
                  ['Stock disponible', `${produit.stock + stockPartenaires} unités`],
                  ['Prix unitaire', produit.prix > 0 ? formatPrix(produit.prix) : 'Selon le point de vente'],
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
              {/* Résumé note moyenne */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-beton rounded-xl">
                <div className="text-center">
                  <div className="font-condensed font-bold text-4xl text-acier">{nbAvis > 0 ? noteMoyenne : '—'}</div>
                  <div className="flex justify-center mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} className={i <= Math.round(noteMoyenne) ? 'text-or fill-or' : 'text-gray-300'}/>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{nbAvis} avis</div>
                </div>
                <p className="text-sm text-gray-500">
                  {nbAvis > 0
                    ? `Note moyenne sur ${nbAvis} avis client${nbAvis > 1 ? 's' : ''}.`
                    : 'Aucun avis pour le moment. Soyez le premier à donner le vôtre !'}
                </p>
              </div>

              {/* Formulaire : laisser un avis */}
              <div className="border border-gray-200 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-acier text-sm mb-3">Donner mon avis</h4>

                {avisEnvoye && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <Check size={16}/> Merci ! Votre avis a bien été publié.
                  </div>
                )}

                {/* Note en étoiles cliquables */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Votre note</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <button key={i} type="button"
                        onClick={() => setFormNote(i)}
                        onMouseEnter={() => setHoverNote(i)}
                        onMouseLeave={() => setHoverNote(0)}
                        className="p-0.5">
                        <Star size={26}
                          className={i <= (hoverNote || formNote) ? 'text-or fill-or' : 'text-gray-300'}/>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nom */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Votre nom</label>
                  <input type="text" value={formNom} onChange={e => setFormNom(e.target.value)}
                    maxLength={60} placeholder="Ex: Jean K."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brique"/>
                </div>

                {/* Commentaire */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Votre commentaire <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <textarea value={formCommentaire} onChange={e => setFormCommentaire(e.target.value)}
                    maxLength={600} rows={3} placeholder="Qu'avez-vous pensé de ce produit ?"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brique resize-none"/>
                </div>

                {erreurAvis && <p className="text-xs text-red-600 mb-2">{erreurAvis}</p>}

                <button onClick={envoyerAvis} disabled={envoiAvis}
                  className="bg-brique text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brique-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {envoiAvis ? 'Envoi...' : 'Publier mon avis'}
                </button>
              </div>

              {/* Liste des avis */}
              {avisListe.length > 0 ? (
                <div className="space-y-4">
                  {avisListe.map((avis: any) => (
                    <div key={avis.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brique text-white flex items-center justify-center text-xs font-bold">
                          {(avis.nom || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-acier">{avis.nom}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} size={10} className={i <= avis.note ? 'text-or fill-or' : 'text-gray-300'}/>
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(avis.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {avis.commentaire && <p className="text-sm text-gray-600">{avis.commentaire}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Aucun avis publié pour l'instant.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div id="ou-trouver" className="mb-6 scroll-mt-24">
        <OuTrouver produitId={produit.id} produitNom={produit.nom} onPrixMoyen={setPrixMoyenClient} />
      </div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-brique">
        <ArrowLeft size={16}/> Retour au catalogue
      </button>
    </div>
  )
}
