'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Package, Truck, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { supabase, formatPrix } from '../../../lib/supabase'

export default function PageCommandes() {
  const router = useRouter()
  const [commandes, setCommandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('toutes')
  const [commandeOuverte, setCommandeOuverte] = useState<string | null>(null)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/compte'); return }
      const { data: prof } = await supabase.from('profils').select('telephone').eq('id', user.id).single()
      const tel = (prof?.telephone || '').trim()
      let query = supabase.from('commandes').select('*')
      query = tel
        ? query.or(`user_id.eq.${user.id},client_telephone.eq.${tel}`)
        : query.eq('user_id', user.id)
      const { data } = await query.order('created_at', { ascending: false })
      setCommandes(data || [])
      setLoading(false)
    }
    charger()
  }, [router])

  const statutConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    en_attente:   { label: 'En attente',   icon: Clock,         color: 'text-amber-700',  bg: 'bg-amber-100' },
    confirmee:    { label: 'Confirmée',    icon: CheckCircle,   color: 'text-blue-700',   bg: 'bg-blue-100'  },
    en_livraison: { label: 'En livraison', icon: Truck,         color: 'text-purple-700', bg: 'bg-purple-100'},
    livree:       { label: 'Livrée',       icon: CheckCircle,   color: 'text-green-700',  bg: 'bg-green-100' },
    annulee:      { label: 'Annulée',      icon: XCircle,       color: 'text-red-700',    bg: 'bg-red-100'   },
  }

  const commandesFiltrees = filtre === 'toutes'
    ? commandes
    : commandes.filter(c => c.statut === filtre)

  const recomander = (commande: any) => {
    const panier = commande.articles?.map((a: any) => ({
      produit: { id: a.produit_id, nom: a.nom, prix: a.prix, unite: a.unite, categorie: '', reference: '', stock: 99, actif: true },
      quantite: a.quantite
    }))
    localStorage.setItem('batishop_panier', JSON.stringify(panier || []))
    window.dispatchEvent(new Event('panier-updated'))
    router.push('/panier')
  }

  const telechargerPDF = async (c: any) => {
    const { default: jsPDF } = await import('jspdf')
    const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' FCFA'
    const doc = new jsPDF()
    let y = 18
    doc.setFontSize(18); doc.setTextColor(192, 57, 43); doc.text('BatiShop Cameroun', 14, y)
    doc.setFontSize(10); doc.setTextColor(120, 120, 120); doc.text('Récapitulatif de commande', 14, y + 6)
    doc.setDrawColor(192, 57, 43); doc.line(14, y + 9, 196, y + 9)
    doc.setTextColor(34, 34, 34); doc.setFontSize(11); y += 20
    doc.text(`N° de commande : ${c.numero}`, 14, y); y += 6
    doc.text(`Date : ${new Date(c.created_at).toLocaleDateString('fr-FR')}`, 14, y); y += 6
    doc.text(`Client : ${c.client_nom || ''} - ${c.client_telephone || ''}`, 14, y); y += 6
    doc.text(`Ville : ${c.client_ville || ''}`, 14, y); y += 6
    if (c.client_adresse && c.client_adresse !== '—') { doc.text(`Adresse : ${c.client_adresse}`, 14, y); y += 6 }
    doc.text(`Paiement : ${(c.paiement_methode || '').replace('_', ' ')}`, 14, y); y += 10
    ;(c.articles || []).forEach((a: any) => {
      doc.text(`- ${a.nom}  x${a.quantite} ${a.unite || ''}${a.partenaire_nom ? ' (' + a.partenaire_nom + ')' : ''}`, 18, y)
      doc.text(fmt(a.prix * a.quantite), 196, y, { align: 'right' })
      y += 6
      if (y > 272) { doc.addPage(); y = 18 }
    })
    y += 4; doc.setDrawColor(200, 200, 200); doc.line(14, y, 196, y); y += 8
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.text('TOTAL', 14, y); doc.text(fmt(c.total), 196, y, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(150, 150, 150)
    doc.text('Merci de votre confiance - BatiShop Cameroun', 105, 285, { align: 'center' })
    doc.save(`commande-${c.numero}.pdf`)
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"/>)}
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/compte/dashboard" className="p-2 hover:bg-beton rounded-lg">
          <ArrowLeft size={18} className="text-gray-500"/>
        </Link>
        <div>
          <h1 className="font-condensed font-bold text-2xl text-acier">Mes commandes</h1>
          <p className="text-sm text-gray-500">{commandes.length} commande{commandes.length > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { val: 'toutes', label: `Toutes (${commandes.length})` },
          { val: 'en_attente', label: 'En attente' },
          { val: 'en_livraison', label: 'En livraison' },
          { val: 'livree', label: 'Livrées' },
          { val: 'annulee', label: 'Annulées' },
        ].map(f => (
          <button key={f.val} onClick={() => setFiltre(f.val)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${filtre === f.val ? 'bg-brique text-white border-brique' : 'border-gray-200 text-gray-600 hover:border-brique hover:text-brique'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {commandesFiltrees.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4"/>
          <h3 className="font-condensed font-bold text-lg text-acier mb-2">Aucune commande</h3>
          <p className="text-gray-500 text-sm mb-4">
            {filtre === 'toutes' ? "Vous n'avez pas encore passé de commande" : `Aucune commande "${filtre}"`}
          </p>
          <Link href="/produits" className="btn-primary">Découvrir nos produits</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {commandesFiltrees.map(c => {
            const cfg = statutConfig[c.statut] || statutConfig.en_attente
            const StatutIcon = cfg.icon
            const isOpen = commandeOuverte === c.id

            return (
              <div key={c.id} className="card overflow-hidden">
                {/* En-tête commande */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-400">{c.numero}</span>
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <StatutIcon size={11}/> {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Passée le {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        📍 {c.client_ville} — {c.client_adresse}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-condensed font-bold text-lg text-brique">{formatPrix(c.total)}</div>
                      <div className="text-xs text-gray-400">{c.articles?.length} article{c.articles?.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {/* Barre progression */}
                  {c.statut !== 'annulee' && (
                    <div className="mt-3 flex items-center gap-1">
                      {['en_attente', 'confirmee', 'en_livraison', 'livree'].map((s, i) => {
                        const etapes = ['en_attente', 'confirmee', 'en_livraison', 'livree']
                        const actuel = etapes.indexOf(c.statut)
                        const done = i <= actuel
                        return (
                          <div key={s} className="flex-1 flex items-center gap-1">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${done ? 'bg-brique' : 'bg-gray-200'}`}/>
                            {i < 3 && <div className={`flex-1 h-0.5 ${i < actuel ? 'bg-brique' : 'bg-gray-200'}`}/>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Détails */}
                <div className="px-4 py-2">
                  <button onClick={() => setCommandeOuverte(isOpen ? null : c.id)}
                    className="w-full flex items-center justify-between py-2 text-sm text-gray-600 hover:text-brique">
                    <span>{isOpen ? 'Masquer les détails' : 'Voir les articles'}</span>
                    <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {isOpen && (
                    <div className="pb-3 space-y-2">
                      {c.articles?.map((a: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-beton rounded-lg px-3 py-2">
                          <div>
                            <div className="text-sm font-medium text-acier">{a.nom}</div>
                            <div className="text-xs text-gray-500">×{a.quantite} {a.unite}</div>
                          </div>
                          <div className="font-medium text-sm text-brique">{formatPrix(a.prix * a.quantite)}</div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-1 px-1">
                        <span>Paiement : {c.paiement_methode?.replace('_', ' ')}</span>
                        <span className={c.paiement_statut === 'paye' ? 'text-green-600 font-medium' : 'text-amber-600'}>
                          {c.paiement_statut === 'paye' ? '✓ Payé' : '⏳ En attente paiement'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2 flex-wrap">
                  <button onClick={() => telechargerPDF(c)}
                    className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-brique hover:text-brique font-medium">
                    📄 Télécharger le PDF
                  </button>
                  {c.statut === 'livree' && (
                    <button onClick={() => recomander(c)}
                      className="flex items-center gap-1.5 text-xs bg-brique text-white px-3 py-1.5 rounded-lg hover:bg-brique-dark font-medium">
                      <RefreshCw size={12}/> Commander à nouveau
                    </button>
                  )}
                  <a href="tel:+237600000000"
                    className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-brique hover:text-brique">
                    📞 Nous contacter
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
