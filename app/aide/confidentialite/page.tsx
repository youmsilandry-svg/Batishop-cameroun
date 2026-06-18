import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialité — BatiShop Cameroun',
  description: "Comment BatiShop Cameroun collecte, utilise et protège vos données personnelles.",
}

export default function Confidentialite() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-condensed font-bold text-3xl text-acier mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>

      <div className="space-y-6 text-gray-700 leading-relaxed text-[15px]">
        <p>
          Chez <strong>BatiShop Cameroun</strong>, nous attachons une grande importance à la protection de vos données
          personnelles. Cette politique explique quelles informations nous collectons, comment nous les utilisons et
          quels sont vos droits lorsque vous utilisez notre site.
        </p>

        <section>
          <h2 className="font-condensed font-bold text-xl text-acier mb-2">1. Données que nous collectons</h2>
          <p>Lorsque vous passez une commande ou créez un compte, nous pouvons collecter :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>vos informations d'identité : nom, prénom ;</li>
            <li>vos coordonnées : numéro de téléphone, adresse e-mail (facultative) ;</li>
            <li>vos informations de livraison : ville, quartier, adresse, et éventuellement votre position pour faciliter la livraison ;</li>
            <li>le détail de vos commandes et devis ;</li>
            <li>des données techniques de navigation (pages consultées, appareil utilisé).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-condensed font-bold text-xl text-acier mb-2">2. Utilisation de vos données</h2>
          <p>Vos données nous servent uniquement à :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>traiter et livrer vos commandes ;</li>
            <li>vous contacter au sujet de votre commande ou de votre devis ;</li>
            <li>vous envoyer le récapitulatif de votre commande ;</li>
            <li>améliorer notre catalogue et votre expérience d'achat ;</li>
            <li>respecter nos obligations légales et comptables.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-condensed font-bold text-xl text-acier mb-2">3. Partage de vos données</h2>
          <p>
            Nous ne vendons jamais vos données. Elles peuvent être partagées uniquement avec :
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>la quincaillerie partenaire chez qui vous achetez, afin de préparer votre commande ;</li>
            <li>nos prestataires de livraison, pour acheminer vos produits ;</li>
            <li>nos prestataires de paiement (par exemple Orange Money, MTN MoMo) lors d'un paiement en ligne ;</li>
            <li>les autorités compétentes lorsque la loi l'exige.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-condensed font-bold text-xl text-acier mb-2">4. Conservation</h2>
          <p>
            Nous conservons vos données aussi longtemps que nécessaire pour traiter vos commandes et respecter nos
            obligations légales, puis nous les supprimons ou les anonymisons.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-bold text-xl text-acier mb-2">5. Sécurité</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données
            contre la perte, l'accès non autorisé ou la divulgation.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-bold text-xl text-acier mb-2">6. Vos droits</h2>
          <p>
            Vous pouvez à tout moment demander l'accès à vos données, leur rectification ou leur suppression. Pour
            exercer ces droits, contactez-nous via la page <Link href="/contact" className="text-brique hover:underline">Contact</Link>.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-bold text-xl text-acier mb-2">7. Cookies</h2>
          <p>
            Notre site utilise des cookies et un stockage local strictement nécessaires à son fonctionnement (par
            exemple pour mémoriser votre panier). Ils ne servent pas à vous suivre à des fins publicitaires.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-bold text-xl text-acier mb-2">8. Contact</h2>
          <p>
            Pour toute question relative à cette politique, écrivez-nous via la page{' '}
            <Link href="/contact" className="text-brique hover:underline">Contact</Link> ou par e-mail à{' '}
            <a href="mailto:contact@batishop-cameroun.com" className="text-brique hover:underline">contact@batishop-cameroun.com</a>.
          </p>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/" className="btn-outline">← Retour à l'accueil</Link>
      </div>
    </div>
  )
}
