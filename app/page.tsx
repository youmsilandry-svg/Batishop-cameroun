import Link from 'next/link'

const CATEGORIES = [
  { id: 'maconnerie',     label: 'Maçonnerie',     emoji: '🧱', count: '245 produits' },
  { id: 'plomberie',      label: 'Plomberie',      emoji: '🔧', count: '189 produits' },
  { id: 'electricite',    label: 'Électricité',    emoji: '⚡', count: '312 produits' },
  { id: 'carrelage',      label: 'Carrelage',      emoji: '🪟', count: '156 produits' },
  { id: 'photovoltaique', label: 'Solaire',        emoji: '☀️', count: '98 produits'  },
  { id: 'menuiserie',     label: 'Menuiserie',     emoji: '🚪', count: '203 produits' },
  { id: 'couverture',     label: 'Toiture',        emoji: '🏠', count: '134 produits' },
  { id: 'outillage',      label: 'Outillage',      emoji: '🔨', count: '278 produits' },
  { id: 'peinture',       label: 'Peinture',       emoji: '🎨', count: '167 produits' },
  { id: 'assainissement', label: 'Assainissement', emoji: '💧', count: '89 produits'  },
]

const PROMOS = [
  { nom: 'Ciment Portland CPA 42.5', cat: 'maconnerie', prix: 4500, ancien: 5200, emoji: '🧱', badge: 'Promo -13%' },
  { nom: 'Panneau solaire 300W', cat: 'photovoltaique', prix: 87000, ancien: null, emoji: '☀️', badge: 'Solaire' },
  { nom: 'Robinet mélangeur chromé', cat: 'plomberie', prix: 12000, ancien: 15000, emoji: '🔧', badge: 'Promo -20%' },
  { nom: 'Carrelage 60x60 beige', cat: 'carrelage', prix: 12500, ancien: null, emoji: '🪟', badge: 'Nouveau' },
  { nom: 'Câble électrique 2.5mm', cat: 'electricite', prix: 35000, ancien: null, emoji: '⚡', badge: 'Nouveau' },
  { nom: 'Perceuse visseuse 18V', cat: 'outillage', prix: 45000, ancien: 55000, emoji: '🔨', badge: 'Promo -18%' },
]

const UNIVERS = [
  { label: 'Construire', emoji: '🏗️', desc: 'Gros oeuvre & Structure', href: '/produits?categorie=maconnerie', bg: 'from-slate-800 to-slate-600' },
  { label: 'Équiper', emoji: '⚡', desc: 'Électricité & Plomberie', href: '/produits?categorie=electricite', bg: 'from-yellow-700 to-yellow-500' },
  { label: 'Finir', emoji: '🎨', desc: 'Carrelage, Peinture & Décor', href: '/produits?categorie=carrelage', bg: 'from-orange-700 to-orange-500' },
  { label: 'Énergie Solaire', emoji: '☀️', desc: 'Autonomie énergétique', href: '/produits?categorie=photovoltaique', bg: 'from-amber-600 to-yellow-400' },
]

function formatPrix(n) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(n)
}

export default function HomePage() {
  return (
    <div className="bg-beton min-h-screen">

      {/* ===== HERO BANNER ===== */}
      <section className="bg-acier text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',backgroundSize:'20px 20px'}}></div>
        <div className="max-w-7xl mx-auto px-4 py-14 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-block bg-brique text-white text-xs font-bold px-3 py-1 rounded mb-4 uppercase tracking-widest">
              N°1 au Cameroun
            </div>
            <h1 className="font-condensed font-bold text-4xl lg:text-5xl leading-tight mb-4">
              Tout pour <span className="text-or">construire</span><br/>
              votre projet
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Matériaux de construction, plomberie, électricité, carrelage et énergie solaire.<br/>
              Livraison 48h dans tout le Cameroun.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/produits" className="bg-brique hover:bg-brique-dark text-white font-bold px-6 py-3 rounded transition-colors">
                Explorer le catalogue →
              </Link>
              <Link href="/devis" className="border border-white/40 hover:border-white text-white font-medium px-6 py-3 rounded transition-colors">
                Demander un devis
              </Link>
            </div>
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
              {[['5 000+','Produits'],['12','Villes livrées'],['48h','Délai moyen'],['98%','Satisfaits']].map(([n,l]) => (
                <div key={l}>
                  <div className="font-condensed font-bold text-2xl text-or">{n}</div>
                  <div className="text-xs text-white/60 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BARRE CONFIANCE ===== */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['🚚', 'Livraison rapide', 'Douala & Yaoundé en 24h'],
            ['✅', 'Qualité garantie', 'Produits certifiés'],
            ['📱', 'Paiement mobile', 'Orange Money & MTN MoMo'],
            ['📞', 'Support 7j/7', '+237 6XX XXX XXX'],
          ].map(([ico, titre, desc]) => (
            <div key={titre} className="flex items-center gap-3">
              <span className="text-2xl">{ico}</span>
              <div>
                <div className="font-semibold text-sm text-acier">{titre}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== UNIVERS ===== */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="font-condensed font-bold text-2xl text-acier mb-6">Nos univers</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {UNIVERS.map(u => (
            <Link key={u.label} href={u.href}
              className={`bg-gradient-to-br ${u.bg} text-white rounded-xl p-6 hover:scale-105 transition-transform`}>
              <div className="text-4xl mb-3">{u.emoji}</div>
              <div className="font-condensed font-bold text-xl">{u.label}</div>
              <div className="text-white/70 text-sm mt-1">{u.desc}</div>
              <div className="mt-4 text-xs font-bold text-white/90">Découvrir →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== BANNER SOLAIRE ===== */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="bg-acier rounded-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
            <div>
              <div className="text-or text-sm font-bold uppercase tracking-widest mb-2">Offre spéciale</div>
              <h3 className="font-condensed font-bold text-2xl text-white mb-2">
                Kits Solaires Complets ☀️
              </h3>
              <p className="text-white/70 text-sm mb-4">
                Panneaux 300W, batteries, onduleurs — tout pour votre autonomie énergétique.<br/>
                Économisez jusqu'à 20% sur les kits complets ce mois-ci.
              </p>
              <Link href="/produits?categorie=photovoltaique"
                className="inline-block bg-or text-acier font-bold px-5 py-2.5 rounded hover:bg-or-light transition-colors text-sm">
                Voir les offres solaires →
              </Link>
            </div>
            <div className="text-8xl shrink-0">☀️</div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-condensed font-bold text-2xl text-acier">Toutes les catégories</h2>
          <Link href="/produits" className="text-sm text-brique font-medium hover:underline">Voir tout →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.map(cat => (
            <Link key={cat.id} href={`/produits?categorie=${cat.id}`}
              className="bg-white rounded-xl p-4 text-center hover:shadow-md hover:border-brique border-2 border-transparent transition-all group">
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <div className="font-semibold text-sm text-acier group-hover:text-brique">{cat.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{cat.count}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== PRODUITS VEDETTES ===== */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-condensed font-bold text-2xl text-acier">Produits vedettes</h2>
          <Link href="/produits" className="text-sm text-brique font-medium hover:underline">Voir tout →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PROMOS.map(p => (
            <Link key={p.nom} href={`/produits?categorie=${p.cat}`}
              className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow border border-gray-50 group">
              <div className="h-28 bg-beton flex items-center justify-center text-5xl relative">
                {p.emoji}
                <span className="absolute top-2 left-2 bg-brique text-white text-xs font-bold px-2 py-0.5 rounded">
                  {p.badge}
                </span>
              </div>
              <div className="p-3">
                <div className="text-xs font-medium text-acier leading-tight mb-2 line-clamp-2 group-hover:text-brique">{p.nom}</div>
                <div className="font-condensed font-bold text-base text-brique">{formatPrix(p.prix)}</div>
                {p.ancien && <div className="text-xs text-gray-400 line-through">{formatPrix(p.ancien)}</div>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== BANNER PRO ===== */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-brique rounded-2xl p-8 text-white">
            <div className="text-3xl mb-3">🏗️</div>
            <h3 className="font-condensed font-bold text-xl mb-2">Vous êtes professionnel ?</h3>
            <p className="text-white/80 text-sm mb-4">Obtenez des tarifs préférentiels, des devis rapides et une livraison prioritaire pour vos chantiers.</p>
            <Link href="/devis" className="inline-block bg-white text-brique font-bold px-4 py-2 rounded text-sm hover:bg-gray-100 transition-colors">
              Demander un devis pro →
            </Link>
          </div>
          <div className="bg-acier rounded-2xl p-8 text-white">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-condensed font-bold text-xl mb-2">Paiement facilité</h3>
            <p className="text-white/80 text-sm mb-4">Payez facilement par Orange Money, MTN MoMo, carte bancaire ou à la livraison. Sécurisé et rapide.</p>
            <div className="flex gap-3 flex-wrap">
              {['Orange Money', 'MTN MoMo', 'Visa'].map(m => (
                <span key={m} className="bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== VILLES ===== */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <h2 className="font-condensed font-bold text-2xl text-acier mb-4">Livraison dans tout le Cameroun</h2>
        <div className="flex flex-wrap gap-2">
          {['Douala','Yaoundé','Bafoussam','Garoua','Bamenda','Maroua','Ngaoundéré','Bertoua','Ebolowa','Kumba','Limbe','Kribi'].map(v => (
            <span key={v} className="bg-white border border-gray-200 text-acier text-sm px-4 py-1.5 rounded-full font-medium">
              📍 {v}
            </span>
          ))}
        </div>
      </section>

    </div>
  )
}
