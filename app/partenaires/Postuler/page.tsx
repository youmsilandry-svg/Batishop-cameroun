import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import FormulaireCandidature from '../FormulaireCandidature'

export const metadata = {
  title: 'Postuler — Devenir partenaire BatiShop Cameroun',
  description: 'Remplissez le formulaire pour rejoindre le réseau de partenaires BatiShop.',
}

export default function PagePostuler() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/partenaires" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brique mb-6">
        <ArrowLeft size={16} /> Retour
      </Link>
      <h1 className="font-condensed font-bold text-3xl text-acier mb-1">Devenir partenaire</h1>
      <p className="text-gray-500 mb-8">
        Remplissez ce formulaire pour rejoindre le réseau BatiShop. C'est gratuit et sans engagement —
        nous vous recontactons pour valider votre inscription.
      </p>
      <FormulaireCandidature />
    </div>
  )
}
