import Link from 'next/link'
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

export const metadata = {
  title: 'Retours & échanges — BatiShop Cameroun',
  description: 'Conditions, délais et procédure pour retourner ou échanger un produit acheté chez BatiShop Cameroun.',
}

const ELIGIBLES = [
  'Produit non utilisé, dans son emballage d’origine',
  'Produit défectueux ou endommagé à la réception',
  'Erreur de référence ou de quantité de notre part',
]
const NON_ELIGIBLES = [
  'Produits sur mesure ou découpés à la demande',
  'Sacs de ciment, sable, gravier ouverts ou entamés',
  'Produits abîmés après utilisation sur chantier',
]

export default function RetoursPage() {
  return (
    <div className="min-h-screen bg-beton">
      <div className="bg-acier text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-condensed font-bold text-3xl md:text-4xl">Retours & échanges</h1>
          <p className="text-white/70 mt-2">Votre satisfaction compte. Voici comment retourner ou échanger un produit.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 text-brique font-bold mb-2"><RotateCcw size={18}/> Délai de retour</div>
          <p className="text-gray-600 text-sm">Vous disposez de <strong>7 jours</strong> après réception pour signaler un problème et demander un retour ou un échange. Passé ce délai, contactez-nous : nous étudions chaque cas.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-green-600 font-bold mb-3"><CheckCircle2 size={18}/> Retours acceptés</div>
            <ul className="space-y-2">
              {ELIGIBLES.map((t, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-green-600">•</span>{t}</li>)}
            </ul>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-brique font-bold mb-3"><XCircle size={18}/> Non éligibles</div>
            <ul className="space-y-2">
              {NON_ELIGIBLES.map((t, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-brique">•</span>{t}</li>)}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="font-condensed font-bold text-acier text-lg mb-3">La procédure en 3 étapes</div>
          <ol className="space-y-3">
            {[
              'Contactez-nous (téléphone, WhatsApp ou email) avec votre numéro de commande et une photo du produit.',
              'Nous validons l’éligibilité et convenons d’un retour en magasin ou d’un enlèvement.',
              'Après vérification, vous êtes remboursé ou le produit est échangé.',
            ].map((t, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600">
                <span className="w-6 h-6 rounded-full bg-brique text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-400 mt-4">Les frais de retour sont à notre charge en cas d’erreur ou de défaut de notre part. Dans les autres cas, ils peuvent rester à la charge du client.</p>
        </div>

        <div className="text-center">
          <Link href="/contact" className="inline-block bg-brique hover:bg-brique-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Signaler un retour
          </Link>
        </div>
      </div>
    </div>
  )
}
