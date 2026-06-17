import Link from 'next/link'
import { Phone, MessageCircle, Mail, MapPin, Clock } from 'lucide-react'

export const metadata = {
  title: 'Contactez-nous — BatiShop Cameroun',
  description: 'Joignez l’équipe BatiShop Cameroun par téléphone, WhatsApp ou email pour vos matériaux de construction.',
}

const TEL = '+237 6 90 00 00 00'        // ← à remplacer par ton vrai numéro
const TEL_RAW = '237690000000'           // ← idem (format wa.me / tel, sans espaces)
const EMAIL = 'contact@batishop-cameroun.com' // ← à remplacer

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-beton">
      <div className="bg-acier text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-condensed font-bold text-3xl md:text-4xl">Contactez-nous</h1>
          <p className="text-white/70 mt-2 max-w-2xl">Une question sur un produit, un devis ou une commande ? Notre équipe vous répond du lundi au samedi.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-5">
        <a href={`https://wa.me/${TEL_RAW}`} target="_blank" rel="noopener noreferrer"
          className="bg-white rounded-xl p-6 border border-gray-100 hover:border-brique transition-colors flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0"><MessageCircle className="text-green-600" size={20}/></div>
          <div>
            <div className="font-bold text-acier">WhatsApp</div>
            <div className="text-sm text-gray-500">Réponse rapide, du lun. au sam.</div>
            <div className="text-brique font-semibold mt-1">{TEL}</div>
          </div>
        </a>

        <a href={`tel:${TEL_RAW}`} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-brique transition-colors flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-brique/10 flex items-center justify-center shrink-0"><Phone className="text-brique" size={20}/></div>
          <div>
            <div className="font-bold text-acier">Téléphone</div>
            <div className="text-sm text-gray-500">Appelez-nous directement</div>
            <div className="text-brique font-semibold mt-1">{TEL}</div>
          </div>
        </a>

        <a href={`mailto:${EMAIL}`} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-brique transition-colors flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-acier/10 flex items-center justify-center shrink-0"><Mail className="text-acier" size={20}/></div>
          <div>
            <div className="font-bold text-acier">Email</div>
            <div className="text-sm text-gray-500">Pour vos demandes écrites</div>
            <div className="text-brique font-semibold mt-1 break-all">{EMAIL}</div>
          </div>
        </a>

        <div className="bg-white rounded-xl p-6 border border-gray-100 flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-or/20 flex items-center justify-center shrink-0"><MapPin className="text-or" size={20}/></div>
          <div>
            <div className="font-bold text-acier">Adresse</div>
            <div className="text-sm text-gray-600 mt-1">Douala, Cameroun</div>
            <div className="text-sm text-gray-500 flex items-center gap-1 mt-2"><Clock size={13}/> Lun. – Sam. : 8h – 18h</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
          <p className="text-gray-600">Besoin d’un chiffrage pour un chantier ?</p>
          <Link href="/devis" className="inline-block mt-3 bg-brique hover:bg-brique-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Demander un devis professionnel
          </Link>
        </div>
      </div>
    </div>
  )
}
