'use client'
import { useEffect, useState } from 'react'
import { SITE, PAYS } from '../../lib/config'

// jsPDF (helvetica) ne gère pas bien les accents/caractères spéciaux.
// On translittère en ASCII le texte destiné au PDF (ex. "Côte d'Ivoire" -> "Cote d'Ivoire").
const ascii = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’]/g, "'")

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://batishop-cameroun.com'
const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, '')

export default function RecapImpression({ num }: { num?: string }) {
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('batishop_last_order')
      if (raw) {
        const o = JSON.parse(raw)
        if (!num || o.numero === num) setOrder(o)
      }
    } catch {}
  }, [num])

  if (!order) return null

  // Format ASCII (espace normale comme séparateur) pour éviter les caractères que le PDF ne sait pas afficher
  const fmt = (n: number) => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
  const paie = order.paiement === 'en_ligne' ? `Paiement en ligne (${PAYS.paiements.slice(0, 2).join(' / ')})` : 'Paiement en magasin / à la réception'

  const telechargerPDF = async () => {
    const mod = await import('jspdf')
    const jsPDF = (mod as any).jsPDF || (mod as any).default
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210, M = 15, right = W - M

    // En-tête (bandeau)
    doc.setFillColor(26, 35, 50)
    doc.rect(0, 0, W, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(19)
    doc.text(ascii(SITE.nom), M, 14)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    doc.setTextColor(210, 210, 210)
    doc.text(ascii(`Materiaux de construction - Livraison ${PAYS.prefixe} ${PAYS.nom}`), M, 21)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.text('RECU DE COMMANDE', right, 14, { align: 'right' })

    // Méta commande
    let y = 40
    doc.setTextColor(34, 34, 34); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.text(`Commande ${order.numero}`, M, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(110, 110, 110)
    doc.text(new Date(order.date).toLocaleString('fr-FR'), right, y, { align: 'right' })
    y += 8

    // Bloc client
    doc.setTextColor(34, 34, 34); doc.setFontSize(10)
    if (order.nom) { doc.text(`Client : ${order.nom}`, M, y); y += 5.5 }
    if (order.ville) { doc.text(`Ville : ${order.ville}`, M, y); y += 5.5 }
    if (order.adresse && order.adresse !== '—') { doc.text(`Adresse : ${order.adresse}`, M, y); y += 5.5 }
    y += 3

    // En-tête tableau
    const qteX = 130, puX = 165, totX = right
    doc.setFillColor(242, 237, 232)
    doc.rect(M - 2, y - 5, W - 2 * M + 4, 8, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(80, 80, 80)
    doc.text('ARTICLE', M, y)
    doc.text('QTE', qteX, y, { align: 'center' })
    doc.text('P.U.', puX, y, { align: 'right' })
    doc.text('TOTAL', totX, y, { align: 'right' })
    y += 7

    // Lignes
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(34, 34, 34)
    let produitsTotal = 0
    ;(order.articles || []).forEach((a: any) => {
      const ligneTotal = (a.prix || 0) * a.quantite
      produitsTotal += ligneTotal
      const nom = doc.splitTextToSize(String(a.nom || ''), 100)
      doc.text(nom, M, y)
      doc.text(`${a.quantite} ${a.unite || ''}`.trim(), qteX, y, { align: 'center' })
      doc.text(fmt(a.prix || 0), puX, y, { align: 'right' })
      doc.text(fmt(ligneTotal), totX, y, { align: 'right' })
      const h = Array.isArray(nom) ? nom.length * 5 : 5
      y += Math.max(h, 6)
      doc.setDrawColor(235, 235, 235); doc.line(M, y - 2, right, y - 2)
      if (y > 250) { doc.addPage(); y = 20 }
    })

    // Totaux
    y += 4
    doc.setFontSize(10); doc.setTextColor(90, 90, 90)
    doc.text('Sous-total produits', puX, y, { align: 'right' })
    doc.text(fmt(produitsTotal), totX, y, { align: 'right' }); y += 6
    if (order.totalLivraison) {
      doc.text('Livraison', puX, y, { align: 'right' })
      doc.text(fmt(order.totalLivraison), totX, y, { align: 'right' }); y += 6
    }
    doc.setDrawColor(192, 57, 43); doc.line(120, y - 2, right, y - 2); y += 4
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(192, 57, 43)
    doc.text('TOTAL', puX, y, { align: 'right' })
    doc.text(fmt(order.total), totX, y, { align: 'right' }); y += 10

    // Paiement
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(34, 34, 34)
    doc.text(`Mode de paiement : ${paie}`, M, y); y += 6
    doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text('Notre equipe vous contactera pour confirmer les details de livraison.', M, y)

    // Pied de page
    doc.setDrawColor(220, 220, 220); doc.line(M, 282, right, 282)
    doc.setFontSize(8); doc.setTextColor(150, 150, 150)
    doc.text(ascii(`Merci pour votre confiance - ${SITE.nom}`), M, 288)
    doc.text(SITE_DOMAIN, right, 288, { align: 'right' })

    doc.save(`commande-${order.numero}.pdf`)
  }

  return (
    <div className="text-left bg-white border border-gray-200 rounded-lg p-4 mb-6 print:border-0">
      <div className="font-condensed font-bold text-acier mb-2">Récapitulatif</div>
      <div className="divide-y divide-gray-100">
        {(order.articles || []).map((a: any, i: number) => (
          <div key={i} className="flex justify-between py-1.5 text-sm">
            <span className="text-gray-700">{a.nom} <span className="text-gray-400">× {a.quantite} {a.unite || ''}</span></span>
            <span className="text-gray-800 whitespace-nowrap">{fmt((a.prix || 0) * a.quantite)}</span>
          </div>
        ))}
      </div>
      {order.totalLivraison ? (
        <div className="flex justify-between py-1.5 text-sm text-gray-600 border-t border-gray-100">
          <span>Livraison</span><span>{fmt(order.totalLivraison)}</span>
        </div>
      ) : null}
      <div className="flex justify-between py-2 mt-1 border-t border-gray-200 font-bold">
        <span>TOTAL</span><span className="text-brique">{fmt(order.total)}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">{paie}</div>

      <div className="flex justify-center mt-4 print:hidden">
        <button onClick={telechargerPDF} className="btn-primary flex items-center gap-2">
          📄 Imprimer / Télécharger (PDF)
        </button>
      </div>
    </div>
  )
}
