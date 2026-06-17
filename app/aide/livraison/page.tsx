import Link from 'next/link'
import { Truck, Store, CreditCard, Clock } from 'lucide-react'

export const metadata = {
  title: 'Livraison & tarifs — BatiShop Cameroun',
  description: 'Zones de livraison, délais et frais pour vos matériaux de construction au Cameroun, ou retrait gratuit en magasin.',
}

const ZONES = [
  { ville: 'Douala', delai: '24 – 48 h', frais: 'À partir de 1 500 FCFA' },
  { ville: 'Yaoundé', delai: '24 – 72 h', frais: 'À partir de 2 000 FCFA' },
  { ville: 'Bafoussam', delai: '48 – 72 h', frais: 'Sur devis' },
  { ville: 'Autres villes', delai: 'Variable', frais: 'Sur devis' },
]

export default function LivraisonPage() {
  return (
    <div className="min-h-screen bg-beton">
      <div className="bg-acier text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-condensed font-bold text-3xl md:text-4xl">Livraison & tarifs</h1>
          <p className="text-white/70 mt-2">Faites-vous livrer sur votre chantier, ou retirez gratuitement en magasin.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-brique/10 flex items-center justify-center shrink-0"><Truck className="text-brique" size={18}/></div>
            <div>
              <div className="font-bold text-acier">Livraison</div>
              <p className="text-sm text-gray-600 mt-1">Les frais et délais dépendent de la boutique choisie et de votre ville. Ils s’affichent au moment de la commande.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Store className="text-green-600" size={18}/></div>
            <div>
              <div className="font-bold text-acier">Retrait en magasin</div>
              <p className="text-sm text-gray-600 mt-1">Gratuit. Choisissez « Retrait » à la commande et récupérez vos produits à la boutique partenaire.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-beton border-b border-gray-100 font-condensed font-bold text-acier">Indications par ville</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase">
                <th className="px-5 py-2 font-semibold">Ville</th>
                <th className="px-5 py-2 font-semibold flex items-center gap-1"><Clock size={12}/> Délai</th>
                <th className="px-5 py-2 font-semibold">Frais indicatifs</th>
              </tr>
            </thead>
            <tbody>
              {ZONES.map(z => (
                <tr key={z.ville} className="border-t border-gray-50">
                  <td className="px-5 py-3 font-semibold text-acier">{z.ville}</td>
                  <td className="px-5 py-3 text-gray-600">{z.delai}</td>
                  <td className="px-5 py-3 text-gray-600">{z.frais}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50">Tarifs et délais donnés à titre indicatif. Le montant exact dépend de la boutique, du volume et du poids des matériaux ; il est confirmé à la commande ou par devis.</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-acier/10 flex items-center justify-center shrink-0"><CreditCard className="text-acier" size={18}/></div>
          <div>
            <div className="font-bold text-acier">Paiement</div>
            <p className="text-sm text-gray-600 mt-1">En ligne par Orange Money / MTN Mobile Money, ou en espèces en magasin (au retrait) ou à la livraison.</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/devis" className="inline-block bg-brique hover:bg-brique-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Demander un devis avec livraison
          </Link>
        </div>
      </div>
    </div>
  )
}
