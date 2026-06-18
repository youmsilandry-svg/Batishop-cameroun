'use client'
import { useEffect, useState } from 'react'

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

  const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'
  const paie = order.paiement === 'en_ligne' ? 'Paiement en ligne' : 'Paiement à la réception'

  const telechargerPDF = async () => {
    const mod = await import('jspdf')
    const jsPDF = (mod as any).jsPDF || (mod as any).default
    const doc = new jsPDF()
    let y = 18
    doc.setFontSize(18); doc.text('BatiShop Cameroun', 14, y); y += 8
    doc.setFontSize(11); doc.text(`Commande : ${order.numero}`, 14, y); y += 6
    doc.text(`Date : ${new Date(order.date).toLocaleString('fr-FR')}`, 14, y); y += 6
    if (order.nom) { doc.text(`Client : ${order.nom}`, 14, y); y += 6 }
    if (order.ville) { doc.text(`Ville : ${order.ville}${order.adresse && order.adresse !== '—' ? ' — ' + order.adresse : ''}`, 14, y); y += 6 }
    y += 2; doc.setFontSize(12); doc.text('Articles', 14, y); y += 7
    doc.setFontSize(10)
    ;(order.articles || []).forEach((a: any) => {
      doc.text(`${a.nom}  x${a.quantite} ${a.unite || ''}`, 16, y)
      doc.text(fmt((a.prix || 0) * a.quantite), 196, y, { align: 'right' })
      y += 6
      if (y > 270) { doc.addPage(); y = 18 }
    })
    y += 3
    if (order.totalLivraison) {
      doc.text('Livraison', 16, y); doc.text(fmt(order.totalLivraison), 196, y, { align: 'right' }); y += 6
    }
    doc.setFontSize(12)
    doc.text('TOTAL', 16, y); doc.text(fmt(order.total), 196, y, { align: 'right' }); y += 8
    doc.setFontSize(10); doc.text(paie, 16, y)
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
