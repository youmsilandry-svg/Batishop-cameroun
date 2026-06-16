import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-acier text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8 mb-0">

        {/* Logo & contact */}
        <div className="col-span-2 md:col-span-1">
          <div className="font-condensed font-bold text-xl mb-3">
            Bati<span className="text-brique">Shop</span> CM
          </div>
          <p className="text-sm text-white/60 leading-relaxed mb-4">
            Votre partenaire de confiance pour tous vos matériaux de construction au Cameroun.
          </p>
          <div className="text-sm text-or font-medium">📞 +237 6XX XXX XXX</div>
          <div className="text-sm text-white/60 mt-1">✉️ contact@batishop.cm</div>
        </div>

        {/* Catégories */}
        <div>
          <h4 className="font-condensed font-bold text-sm uppercase tracking-wider text-or mb-3">Catégories</h4>
          {[
            ['Maçonnerie', 'maconnerie'],
            ['Plomberie', 'plomberie'],
            ['Électricité', 'electricite'],
            ['Carrelage', 'carrelage'],
            ['Énergie solaire', 'photovoltaique'],
            ['Menuiserie', 'menuiserie'],
            ['Outillage', 'outillage'],
            ['Peinture', 'peinture'],
          ].map(([label, id]) => (
            <Link key={id} href={`/produits?categorie=${id}`}
              className="block text-sm text-white/60 hover:text-or py-0.5">
              {label}
            </Link>
          ))}
        </div>

        {/* Service client */}
        <div>
          <h4 className="font-condensed font-bold text-sm uppercase tracking-wider text-or mb-3">Service client</h4>
          {[
            ['Suivre ma commande', '/compte/commandes'],
            ['Retours & échanges', '/aide/retours'],
            ['Devis professionnel', '/devis'],
            ['Livraison & tarifs', '/aide/livraison'],
            ['FAQ', '/aide/faq'],
            ['Contactez-nous', '/contact'],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="block text-sm text-white/60 hover:text-or py-0.5">
              {label}
            </Link>
          ))}
        </div>

        {/* ===== PARTENAIRES ===== */}
        <div>
          <h4 className="font-condensed font-bold text-sm uppercase tracking-wider text-or mb-3">Partenaires</h4>
          <p className="text-xs text-white/50 mb-3 leading-relaxed">
            Rejoignez le réseau BatiShop et développez votre activité.
          </p>
          <Link href="/partenaires"
            className="block text-sm text-white/60 hover:text-or py-0.5">
            🏪 Devenir partenaire quincaillerie
          </Link>
          <Link href="/partenaires"
            className="block text-sm text-white/60 hover:text-or py-0.5">
            👷 Partenaire professionnel
          </Link>
          <Link href="/partenaires"
            className="block text-sm text-white/60 hover:text-or py-0.5">
            📋 Soumettre une candidature
          </Link>
          <Link href="mailto:partenaires@batishop.cm"
            className="block text-sm text-white/60 hover:text-or py-0.5">
            ✉️ partenaires@batishop.cm
          </Link>
          <Link href="/partenaires"
            className="inline-block mt-3 bg-brique hover:bg-brique-dark text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
            Rejoindre le réseau →
          </Link>
        </div>

        {/* Paiement */}
        <div>
          <h4 className="font-condensed font-bold text-sm uppercase tracking-wider text-or mb-3">Paiement accepté</h4>
          <div className="space-y-2 text-sm text-white/70">
            <div className="bg-white/10 rounded px-3 py-2">📱 Orange Money</div>
            <div className="bg-white/10 rounded px-3 py-2">📱 MTN MoMo</div>
            <div className="bg-white/10 rounded px-3 py-2">💳 Visa / Mastercard</div>
            <div className="bg-white/10 rounded px-3 py-2">💵 Paiement à la livraison</div>
          </div>
          <p className="text-xs text-white/40 mt-3">Livraison dans 12 villes du Cameroun</p>
        </div>

      </div>

      {/* Bande partenaires CTA */}
      <div className="border-t border-white/10 mx-4">
        <div className="max-w-7xl mx-auto py-4 flex flex-col md:flex-row items-center justify-between gap-3 px-0">
          <div className="text-sm text-white/50">
            🤝 <span className="text-white/70 font-medium">Vous êtes une quincaillerie ou un professionnel du bâtiment ?</span>{' '}
            Rejoignez le réseau BatiShop Cameroun.
          </div>
          <Link href="/partenaires"
            className="shrink-0 bg-or hover:bg-or-light text-acier font-bold text-sm px-5 py-2 rounded-lg transition-colors">
            Devenir partenaire →
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} BatiShop Cameroun · Tous droits réservés ·{' '}
        <Link href="/aide/confidentialite" className="hover:text-or">Politique de confidentialité</Link>
      </div>
    </footer>
  )
}
