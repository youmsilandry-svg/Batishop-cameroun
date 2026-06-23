import Link from 'next/link'
import { PAYS } from '../../../lib/config'

export const metadata = {
  title: `FAQ — Questions fréquentes — BatiShop ${PAYS.nom}`,
  description: `Réponses aux questions fréquentes sur les commandes, le paiement, la livraison et les devis chez BatiShop ${PAYS.nom}.`,
}

// Trois premières villes du pays, pour l'exemple dans la réponse livraison.
const villesExemple = PAYS.villes.slice(0, 3).join(', ')

const FAQ: { q: string; r: string }[] = [
  { q: 'Comment passer une commande ?', r: 'Parcourez le catalogue, ouvrez une fiche produit et choisissez votre boutique (BatiShop ou un partenaire proche de vous), ajoutez au panier, puis validez votre commande. Vous choisissez le retrait en magasin ou la livraison, et le mode de paiement.' },
  { q: 'Quels sont les modes de paiement ?', r: `Vous pouvez payer en ligne par ${PAYS.paiements.join(' / ')}, ou payer en espèces en magasin (au retrait) ou à la livraison.` },
  { q: `Livrez-vous partout ${PAYS.prefixe} ${PAYS.nom} ?`, r: `Nous livrons dans les principales villes (${villesExemple} et environs) via nos boutiques partenaires. La disponibilité et les frais de livraison s’affichent au moment de la commande selon la boutique choisie. Voir la page Livraison & tarifs.` },
  { q: 'Puis-je récupérer ma commande moi-même ?', r: 'Oui. Pour chaque boutique, vous pouvez choisir le retrait en magasin (gratuit) au lieu de la livraison.' },
  { q: 'Les prix sont-ils les mêmes partout ?', r: 'Non. Chaque boutique partenaire fixe son prix ; la fiche produit affiche un prix moyen de référence et la liste des boutiques avec leur prix, leur distance et leur note, pour que vous choisissiez la meilleure offre.' },
  { q: 'Comment demander un devis pour un chantier ?', r: 'Utilisez la page Devis professionnel : indiquez les produits et quantités, joignez vos plans ou listes (photo, PDF, Excel), et nous revenons vers vous avec un chiffrage.' },
  { q: 'Comment suivre ma commande ?', r: 'Connectez-vous à votre compte, rubrique « Mes commandes », pour voir l’état de chaque commande (en attente, confirmée, prête, en livraison, livrée).' },
  { q: 'Puis-je retourner un produit ?', r: 'Oui, sous conditions. Consultez notre page Retours & échanges pour les délais et la procédure.' },
  { q: 'Comment devenir boutique ou artisan partenaire ?', r: 'Rendez-vous sur la page Partenaires et remplissez le formulaire de candidature. Notre équipe étudie votre demande et active votre espace.' },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-beton">
      <div className="bg-acier text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-condensed font-bold text-3xl md:text-4xl">Questions fréquentes</h1>
          <p className="text-white/70 mt-2">Tout ce qu’il faut savoir pour commander en toute confiance.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-3">
        {FAQ.map((item, i) => (
          <details key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
            <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-acier flex items-center justify-between">
              {item.q}
              <span className="text-brique text-xl transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{item.r}</div>
          </details>
        ))}

        <div className="bg-white rounded-xl p-6 border border-gray-100 text-center mt-6">
          <p className="text-gray-600">Vous ne trouvez pas votre réponse ?</p>
          <Link href="/contact" className="inline-block mt-3 bg-brique hover:bg-brique-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Contactez-nous
          </Link>
        </div>
      </div>
    </div>
  )
}
