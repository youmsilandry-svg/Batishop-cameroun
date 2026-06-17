'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Download, Phone, Store, Truck, Package } from 'lucide-react'
import { supabase, formatPrix } from '../../../lib/supabase'

const TEL_BATISHOP = '+237 6 90 00 00 00' // ← à remplacer par ton numéro

export default function ConfirmationClient({ num }: { num?: string }) {
  const [cmd, setCmd] = useState<any>(null)
  const [scs, setScs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gen, setGen] = useState(false)

  useEffect(() => {
    if (!num) { setLoading(false); return }
    ;(async () => {
      const { data: c } = await supabase.from('commandes').select('*').eq('numero', num).maybeSingle()
      setCmd(c)
      if (c) {
        const { data: s } = await supabase.from('sous_commandes')
          .select('*,partenaires_magasins(nom,ville),commande_lignes(*)')
          .eq('commande_id', c.id).order('numero')
        setScs(s || [])
      }
      setLoading(false)
    })()
  }, [num])

  const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' FCFA'

  const telechargerPDF = async () => {
    if (!cmd) return
    setGen(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      let y = 18
      doc.setFontSize(18); doc.setTextColor(192, 57, 43); doc.text('BatiShop Cameroun', 14, y)
      doc.setFontSize(10); doc.setTextColor(120, 120, 120); doc.text('Récapitulatif de commande', 14, y + 6)
      doc.setDrawColor(192, 57, 43); doc.line(14, y + 9, 196, y + 9)
      doc.setTextColor(34, 34, 34); doc.setFontSize(11); y += 20
      doc.text(`N° de commande : ${cmd.numero}`, 14, y); y += 6
      doc.text(`Client : ${cmd.client_nom} - ${cmd.client_telephone}`, 14, y); y += 6
      doc.text(`Ville : ${cmd.client_ville || ''}`, 14, y); y += 6
      if (cmd.client_adresse && cmd.client_adresse !== '—') { doc.text(`Adresse : ${cmd.client_adresse}`, 14, y); y += 6 }
      doc.text(`Paiement : ${(cmd.paiement_methode || '').replace('_', ' ')}`, 14, y); y += 10

      scs.forEach((sc: any) => {
        doc.setFont('helvetica', 'bold')
        doc.text(`${sc.partenaires_magasins?.nom || 'BatiShop'}  (${sc.mode === 'livraison' ? 'Livraison' : 'Retrait'})`, 14, y)
        doc.setFont('helvetica', 'normal'); y += 6
        ;(sc.commande_lignes || []).forEach((l: any) => {
          doc.text(`- ${l.nom}  x${l.quantite} ${l.unite || ''}`, 18, y)
          doc.text(fmt(l.sous_total), 196, y, { align: 'right' })
          y += 6
          if (y > 272) { doc.addPage(); y = 18 }
        })
        if (sc.frais_livraison > 0) { doc.text('  Frais de livraison', 18, y); doc.text(fmt(sc.frais_livraison), 196, y, { align: 'right' }); y += 6 }
        y += 3
      })

      doc.setDrawColor(200, 200, 200); doc.line(14, y, 196, y); y += 8
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
      doc.text('TOTAL', 14, y); doc.text(fmt(cmd.total), 196, y, { align: 'right' })
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(150, 150, 150)
      doc.text('Merci de votre confiance - BatiShop Cameroun', 105, 285, { align: 'center' })
      doc.save(`commande-${cmd.numero}.pdf`)
    } finally { setGen(false) }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-green-600" size={32} />
        </div>
        <h1 className="font-condensed font-bold text-2xl text-acier mb-2">Commande validée !</h1>
        {num && <div className="inline-block bg-beton rounded-lg px-4 py-2 mb-4 font-mono text-sm text-gray-600">N° {num}</div>}
        <p className="text-gray-600 mb-6">Votre commande nous est transmise. Notre équipe vous contacte rapidement pour confirmer la suite.</p>
      </div>

      <button onClick={telechargerPDF} disabled={loading || gen || !cmd}
        className={`flex items-center justify-center gap-2 w-full font-bold py-4 rounded-xl transition-colors mb-3 ${loading || gen || !cmd ? 'bg-gray-300 text-white' : 'bg-brique hover:bg-brique-dark text-white'}`}>
        <Download size={20} /> {gen ? 'Génération…' : 'Télécharger le récapitulatif (PDF)'}
      </button>
      <a href={`tel:${TEL_BATISHOP.replace(/\s/g, '')}`}
        className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 hover:border-brique hover:text-brique font-semibold py-3 rounded-xl transition-colors mb-6">
        <Phone size={18} /> Une question ? {TEL_BATISHOP}
      </a>

      {loading ? (
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      ) : cmd ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-beton border-b border-gray-100 font-condensed font-bold text-acier">Récapitulatif</div>
          {scs.map((sc: any) => (
            <div key={sc.id} className="border-b border-gray-50">
              <div className="flex items-center gap-2 px-5 py-2.5 text-sm">
                <Store size={14} className="text-acier" />
                <span className="font-semibold text-acier">{sc.partenaires_magasins?.nom || 'BatiShop'}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  {sc.mode === 'livraison' ? <><Truck size={11} /> Livraison</> : <><Package size={11} /> Retrait</>}
                </span>
              </div>
              {(sc.commande_lignes || []).map((l: any) => (
                <div key={l.id} className="flex justify-between px-5 py-1.5 text-sm">
                  <span className="text-gray-600">{l.nom} <span className="text-gray-400">×{l.quantite}</span></span>
                  <span className="font-medium">{formatPrix(l.sous_total)}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="flex justify-between px-5 py-3 bg-acier text-white">
            <span className="font-bold">Total</span>
            <span className="font-bold text-or">{formatPrix(cmd.total)}</span>
          </div>
        </div>
      ) : null}

      <div className="flex gap-3 justify-center mt-8">
        <Link href="/produits" className="text-sm font-semibold text-gray-600 hover:text-brique px-5 py-2.5 rounded-lg border border-gray-200">Continuer mes achats</Link>
        <Link href="/compte/commandes" className="text-sm font-semibold text-white bg-brique hover:bg-brique-dark px-5 py-2.5 rounded-lg">Suivre ma commande</Link>
      </div>
    </div>
  )
}
