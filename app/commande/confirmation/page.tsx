import Link from 'next/link'
import RecapImpression from '../../../components/commande/RecapImpression'

export default function Confirmation({ searchParams }: { searchParams: { num?: string } }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="font-condensed font-bold text-2xl text-acier mb-2">Commande confirmée !</h1>
      {searchParams.num && (
        <div className="bg-beton rounded-lg p-4 mb-4 font-mono text-sm text-gray-600">
          N° de commande : <strong>{searchParams.num}</strong>
        </div>
      )}
      <p className="text-gray-600 mb-2">Merci pour votre commande. Notre équipe vous contactera dans les prochaines heures pour confirmer les détails de livraison.</p>
      <p className="text-sm text-gray-500 mb-8">📞 En cas de question, appelez-nous au <strong>+237 6XX XXX XXX</strong></p>

      <RecapImpression num={searchParams.num} />

      <div className="flex gap-3 justify-center print:hidden">
        <Link href="/produits" className="btn-outline">Continuer mes achats</Link>
        <Link href="/" className="btn-primary">Retour à l'accueil</Link>
      </div>
    </div>
  )
}
