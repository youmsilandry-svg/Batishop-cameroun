import Link from 'next/link'
import { supabase, VILLES } from '../lib/supabase'
import { PAYS } from '../lib/config'
import { CarteProduit } from '../components/produits/CarteProduit'

const CATEGORIES = [
  { id: 'maconnerie',     label: 'Maçonnerie',     emoji: '🧱' },
  { id: 'plomberie',      label: 'Plomberie',      emoji: '🔧' },
  { id: 'electricite',    label: 'Électricité',    emoji: '⚡' },
  { id: 'carrelage',      label: 'Carrelage',      emoji: '🪟' },
  { id: 'photovoltaique', label: 'Solaire',        emoji: '☀️' },
  { id: 'menuiserie',     label: 'Menuiserie',     emoji: '🚪' },
  { id: 'couverture',     label: 'Toiture',        emoji: '🏠' },
  { id: 'outillage',      label: 'Outillage',      emoji: '🔨' },
  { id: 'peinture',       label: 'Peinture',       emoji: '🎨' },
  { id: 'assainissement', label: 'Assainissement', emoji: '💧' },
]

const UNIVERS = [
  { label: 'Construire', emoji: '🏗️', desc: 'Gros œuvre & Structure', href: '/produits?categorie=maconnerie', bg: 'from-slate-800 to-slate-600' },
  { label: 'Équiper', emoji: '⚡', desc: 'Électricité & Plomberie', href: '/produits?categorie=electricite', bg: 'from-yellow-700 to-yellow-500' },
  { label: 'Finir', emoji: '🎨', desc: 'Carrelage, Peinture & Décor', href: '/produits?categorie=carrelage', bg: 'from-orange-700 to-orange-500' },
  { label: 'Énergie Solaire', emoji: '☀️', desc: 'Autonomie énergétique', href: '/produits?categorie=photovoltaique', bg: 'from-amber-600 to-yellow-400' },
]

const CONSEILS = [
  { titre: 'Calculer le béton d\'une dalle', desc: 'La méthode simple pour ne pas se tromper sur les quantités', emoji: '🧱', href: '/conseils#dalle' },
  { titre: 'Bien choisir son carrelage', desc: 'Format, surface et résistance selon la pièce', emoji: '🪟', href: '/conseils#carrelage' },
  { titre: 'Dimensionner son solaire', desc: 'Panneaux, batterie et onduleur : les bases', emoji: '☀️', href: '/conseils#solaire' },
]

const SERVICES = [
  { ico: '📋', titre: 'Devis professionnel', desc: 'Chiffrage rapide pour vos chantiers', href: '/devis' },
  { ico: '🚚', titre: 'Livraison & tarifs', desc: `Partout ${PAYS.prefixe} ${PAYS.nom}`, href: '/aide/livraison' },
  { ico: '🏬', titre: 'Retrait en magasin', desc: 'Chez nos quincailleries partenaires', href: '/produits' },
  { ico: '🤝', titre: 'Devenir partenaire', desc: 'Quincailleries & artisans', href: '/partenaires' },
]

// Arrondi "marketing" : 647 -> "600+", 12 -> "12". Évite d'afficher un
// chiffre exact qui paraît petit, tout en restant honnête.
function formatCompteur(n: number): string {
  if (n >= 100) {
    const base = Math.floor(n / 100) * 100
    return `${base}+`
  }
  return String(n)
}

export default async function HomePage() {
  const { data: vedettes } = await supabase.from('produits')
    .select('*').eq('actif', true).order('created_at', { ascending: false }).limit(10)
  const { data: promos } = await supabase.from('produits')
    .select('*').eq('actif', true).not('prix_ancien', 'is', null).order('created_at', { ascending: false }).limit(10)

  // ---- Compteurs réels (produits, villes livrées, boutiques) ----
  const [nbProduitsRes, magasinsRes] = await Promise.all([
    // nombre de produits actifs (head:true -> ne récupère que le count)
    supabase.from('produits').select('id', { count: 'exact', head: true }).eq('actif', true),
    // boutiques actives : on récupère leurs villes pour compter les villes distinctes
    supabase.from('partenaires_magasins').select('ville').eq('actif', true).eq('statut', 'actif'),
  ])
  const nbProduits = nbProduitsRes.count ?? 0
  const boutiques = magasinsRes.data || []
  const nbBoutiques = boutiques.length
  const nbVillesLivrees = new Set(boutiques.map((m: any) => m.ville).filter(Boolean)).size

  const STATS: [string, string][] = [
    [formatCompteur(nbProduits), 'Produits'],
    [String(nbVillesLivrees), nbVillesLivrees > 1 ? 'Villes livrées' : 'Ville livrée'],
    [String(nbBoutiques), nbBoutiques > 1 ? 'Boutiques' : 'Boutique'],
    ['📱', 'Mobile Money'],
  ]

  // Prix moyen (avec commission) par produit, depuis les stocks partenaires
  const idsHome = Array.from(new Set([...(vedettes || []), ...(promos || [])].map((p: any) => p.id)))
  const prixMoyens: Record<string, number> = {}
  if (idsHome.length) {
    const [stk, cc] = await Promise.all([
      supabase.from('stocks_partenaires').select('produit_id, prix_local').in('produit_id', idsHome).gt('prix_local', 0),
      supabase.from('commission_config').select('taux').eq('id', 1).maybeSingle(),
    ])
    const taux = Number(cc.data?.taux || 0)
    const minPrix: Record<string, number> = {} // prix le plus bas par produit
    ;(stk.data || []).forEach((s: any) => {
      const p = Number(s.prix_local)
      if (p > 0 && (minPrix[s.produit_id] === undefined || p < minPrix[s.produit_id])) minPrix[s.produit_id] = p
    })
    Object.entries(minPrix).forEach(([pid, p]) => { prixMoyens[pid] = Math.round(p * (1 + taux / 100)) })
  }

  return (
    <div className="bg-beton min-h-screen">

      {/* HERO */}
      <section className="bg-acier text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '20px 20px' }} />
        <div className="max-w-7xl mx-auto px-4 py-14 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-block bg-brique text-white text-xs font-bold px-3 py-1 rounded mb-4 uppercase tracking-widest">N°1 {PAYS.prefixe} {PAYS.nom}</div>
            <h1 className="font-condensed font-bold text-4xl lg:text-5xl leading-tight mb-4">
              Tout pour <span className="text-or">construire</span><br />votre projet
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Matériaux de construction, plomberie, électricité, carrelage et énergie solaire.<br />
              Comparez les prix des quincailleries près de chez vous.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/produits" className="bg-brique hover:bg-brique-dark text-white font-bold px-6 py-3 rounded transition-colors">Explorer le catalogue →</Link>
              <Link href="/devis" className="border border-white/40 hover:border-white text-white font-medium px-6 py-3 rounded transition-colors">Demander un devis</Link>
            </div>
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
              {STATS.map(([n, l]) => (
                <div key={l}><div className="font-condensed font-bold text-2xl text-or">{n}</div><div className="text-xs text-white/60 mt-0.5">{l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BARRE CONFIANCE */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['🚚', 'Livraison rapide', `${VILLES[0]} & ${VILLES[1]} en 24h`],
            ['✅', 'Qualité garantie', 'Produits certifiés'],
            ['📱', 'Paiement mobile', PAYS.paiements.slice(0, 2).join(' & ')],
            ['📞', 'Support 7j/7', 'À votre écoute'],
          ].map(([ico, titre, desc]) => (
            <div key={titre} className="flex items-center gap-3">
              <span className="text-2xl">{ico}</span>
              <div><div className="font-semibold text-sm text-acier">{titre}</div><div className="text-xs text-gray-500">{desc}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* UNIVERS */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="font-condensed font-bold text-2xl text-acier mb-6">Nos univers</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {UNIVERS.map(u => (
            <Link key={u.label} href={u.href} className={`bg-gradient-to-br ${u.bg} text-white rounded-xl p-6 hover:scale-105 transition-transform`}>
              <div className="text-4xl mb-3">{u.emoji}</div>
              <div className="font-condensed font-bold text-xl">{u.label}</div>
              <div className="text-white/70 text-sm mt-1">{u.desc}</div>
              <div className="mt-4 text-xs font-bold text-white/90">Découvrir →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-condensed font-bold text-2xl text-acier">Toutes les catégories</h2>
          <Link href="/produits" className="text-sm text-brique font-medium hover:underline">Voir tout →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.map(cat => (
            <Link key={cat.id} href={`/produits?categorie=${cat.id}`} className="bg-white rounded-xl p-4 text-center hover:shadow-md hover:border-brique border-2 border-transparent transition-all group">
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <div className="font-semibold text-sm text-acier group-hover:text-brique">{cat.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUITS VEDETTES (réels) */}
      {vedettes && vedettes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-condensed font-bold text-2xl text-acier">Nos produits</h2>
            <Link href="/produits" className="text-sm text-brique font-medium hover:underline">Voir tout →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {vedettes.slice(0, 10).map((p: any) => <CarteProduit key={p.id} produit={p} prixMoyen={prixMoyens[p.id]} aPartirDe />)}
          </div>
        </section>
      )}

      {/* PROMOTIONS (réelles) */}
      {promos && promos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-condensed font-bold text-2xl text-brique">🔥 Bons plans & promotions</h2>
              <Link href="/produits" className="text-sm text-brique font-medium hover:underline">Tout voir →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {promos.slice(0, 10).map((p: any) => <CarteProduit key={p.id} produit={p} prixMoyen={prixMoyens[p.id]} aPartirDe />)}
            </div>
          </div>
        </section>
      )}

      {/* BANDEAU SOLAIRE */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="bg-acier rounded-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
            <div>
              <div className="text-or text-sm font-bold uppercase tracking-widest mb-2">Offre spéciale</div>
              <h3 className="font-condensed font-bold text-2xl text-white mb-2">Kits Solaires Complets ☀️</h3>
              <p className="text-white/70 text-sm mb-4">Panneaux, batteries, onduleurs — tout pour votre autonomie énergétique.</p>
              <Link href="/produits?categorie=photovoltaique" className="inline-block bg-or text-acier font-bold px-5 py-2.5 rounded hover:bg-or-light transition-colors text-sm">Voir les offres solaires →</Link>
            </div>
            <div className="text-8xl shrink-0">☀️</div>
          </div>
        </div>
      </section>

      {/* CONSEILS & IDÉES — masqué temporairement (mettre {true && ...} pour réafficher) */}
      {false && (
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-condensed font-bold text-2xl text-acier">Conseils & idées</h2>
            <p className="text-sm text-gray-500">Nos guides pour réussir vos travaux</p>
          </div>
          <Link href="/conseils" className="text-sm text-brique font-medium hover:underline">Tous les conseils →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONSEILS.map(c => (
            <Link key={c.titre} href={c.href} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="h-32 bg-gradient-to-br from-acier to-acier-light flex items-center justify-center text-5xl">{c.emoji}</div>
              <div className="p-4">
                <div className="font-bold text-acier group-hover:text-brique">{c.titre}</div>
                <div className="text-sm text-gray-500 mt-1">{c.desc}</div>
                <div className="text-xs font-bold text-brique mt-3">Lire le guide →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* NOS SERVICES */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <h2 className="font-condensed font-bold text-2xl text-acier mb-6">Nos services</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SERVICES.map(s => (
            <Link key={s.titre} href={s.href} className="bg-white rounded-xl p-5 border border-gray-100 hover:border-brique hover:shadow-md transition-all text-center group">
              <div className="text-3xl mb-2">{s.ico}</div>
              <div className="font-bold text-acier group-hover:text-brique text-sm">{s.titre}</div>
              <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* BANDEAU PRO */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-brique rounded-2xl p-8 text-white">
            <div className="text-3xl mb-3">🏗️</div>
            <h3 className="font-condensed font-bold text-xl mb-2">Vous êtes professionnel ?</h3>
            <p className="text-white/80 text-sm mb-4">Tarifs préférentiels, devis rapides et livraison prioritaire pour vos chantiers.</p>
            <Link href="/devis" className="inline-block bg-white text-brique font-bold px-4 py-2 rounded text-sm hover:bg-gray-100 transition-colors">Demander un devis pro →</Link>
          </div>
          <div className="bg-acier rounded-2xl p-8 text-white">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-condensed font-bold text-xl mb-2">Paiement facilité</h3>
            <p className="text-white/80 text-sm mb-4">{PAYS.paiements.join(', ')}, ou paiement en magasin / à la livraison. Sécurisé et rapide.</p>
            <div className="flex gap-3 flex-wrap">
              {[...PAYS.paiements, 'En magasin'].map(m => <span key={m} className="bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full">{m}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* VILLES */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <h2 className="font-condensed font-bold text-2xl text-acier mb-4">Livraison dans tout le pays</h2>
        <div className="flex flex-wrap gap-2">
          {VILLES.map(v => (
            <span key={v} className="bg-white border border-gray-200 text-acier text-sm px-4 py-1.5 rounded-full font-medium">📍 {v}</span>
          ))}
        </div>
      </section>

    </div>
  )
}
