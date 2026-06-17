import Link from 'next/link'
import { Store, TrendingUp, Tag, Package, Users, MapPin, ArrowRight, Phone } from 'lucide-react'
import FormulaireCandidature from './FormulaireCandidature'

export const metadata = {
  title: 'Devenir partenaire — BatiShop Cameroun',
  description: 'Rejoignez le réseau BatiShop : affichez vos produits, fixez vos prix et touchez de nouveaux clients dans votre ville.',
}

const AVANTAGES = [
  { icon: TrendingUp, titre: 'Plus de visibilité', desc: 'Votre magasin apparaît auprès des clients qui cherchent vos produits dans votre ville.' },
  { icon: Tag, titre: 'Vous fixez vos prix', desc: 'Vous définissez librement votre prix de vente et voyez le prix moyen pratiqué sur le site.' },
  { icon: Package, titre: 'Vous gérez vos stocks', desc: 'Ajoutez uniquement les produits que vous vendez et indiquez vos quantités en temps réel.' },
  { icon: Users, titre: 'Des clients qualifiés', desc: 'Les clients vous appellent ou viennent retirer directement le produit chez vous.' },
]

const ETAPES = [
  ['1', 'Vous postulez', 'Remplissez le formulaire de candidature ci-dessous. Nous vérifions votre activité.'],
  ['2', 'Nous créons votre compte', 'Vous recevez vos identifiants pour accéder à votre espace partenaire.'],
  ['3', 'Vous publiez vos produits', 'Choisissez vos produits, fixez vos prix et déclarez vos stocks.'],
  ['4', 'Les clients vous trouvent', 'Votre magasin apparaît dans les résultats de recherche de votre ville.'],
]

export default function PartenairesPage() {
  return (
    <div className="bg-beton min-h-screen">
      {/* HERO */}
      <section className="bg-acier text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brique flex items-center justify-center mx-auto mb-5">
            <Store size={30} className="text-white" />
          </div>
          <h1 className="font-condensed font-bold text-3xl sm:text-4xl mb-3">Devenez partenaire BatiShop</h1>
          <p className="text-white/70 max-w-2xl mx-auto mb-8">
            Rejoignez le réseau des quincailleries et professionnels de référence au Cameroun.
            Affichez vos produits, fixez vos prix et touchez de nouveaux clients — gratuitement.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="#candidature"
              className="inline-flex items-center gap-2 bg-brique hover:bg-brique-dark text-white font-bold px-6 py-3 rounded-lg transition-colors">
              Rejoindre le réseau <ArrowRight size={18} />
            </a>
            <Link href="/partenaires/connexion"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-white text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              J'ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="font-condensed font-bold text-2xl text-acier text-center mb-10">Pourquoi rejoindre BatiShop ?</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {AVANTAGES.map(a => (
            <div key={a.titre} className="bg-white rounded-2xl border border-gray-100 p-6 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-brique/10 flex items-center justify-center shrink-0">
                <a.icon size={22} className="text-brique" />
              </div>
              <div>
                <h3 className="font-bold text-acier mb-1">{a.titre}</h3>
                <p className="text-sm text-gray-500">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <h2 className="font-condensed font-bold text-2xl text-acier text-center mb-10">Comment ça marche ?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ETAPES.map(([num, titre, desc]) => (
              <div key={num} className="text-center">
                <div className="w-11 h-11 rounded-full bg-acier text-white font-bold flex items-center justify-center mx-auto mb-3">{num}</div>
                <h3 className="font-bold text-acier text-sm mb-1">{titre}</h3>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CANDIDATURE */}
      <section id="candidature" className="max-w-3xl mx-auto px-4 py-16 scroll-mt-20">
        <div className="text-center mb-8">
          <MapPin size={28} className="text-brique mx-auto mb-3" />
          <h2 className="font-condensed font-bold text-2xl text-acier mb-2">Déposez votre candidature</h2>
          <p className="text-gray-500">Remplissez ce formulaire — c'est gratuit et sans engagement.</p>
        </div>
        <FormulaireCandidature />
        <p className="text-sm text-gray-400 mt-8 text-center flex flex-col sm:flex-row gap-2 justify-center items-center">
          <span>Une question ?</span>
          <a href="tel:+237600000000" className="inline-flex items-center gap-1 text-brique font-semibold hover:underline"><Phone size={14} /> Nous appeler</a>
          <span className="hidden sm:inline">·</span>
          <Link href="/partenaires/connexion" className="text-brique font-semibold hover:underline">Déjà partenaire ? Accéder à mon espace</Link>
        </p>
      </section>
    </div>
  )
}
