import Link from 'next/link'

export const metadata = {
  title: 'Conseils & idées travaux — BatiShop Cameroun',
  description: 'Guides pratiques pour vos travaux : calculer le béton d\'une dalle, choisir son carrelage, dimensionner une installation solaire.',
}

const GUIDES = [
  {
    id: 'dalle', emoji: '🧱', titre: 'Calculer le béton d\'une dalle',
    intro: 'Pour ne pas acheter trop (ou pas assez) de ciment, de sable et de gravier.',
    points: [
      'Calculez le volume : surface (m²) × épaisseur (m). Exemple : une dalle de 20 m² sur 10 cm = 20 × 0,10 = 2 m³ de béton.',
      'Pour un béton courant, comptez environ 7 sacs de ciment de 50 kg par m³. Pour 2 m³ → environ 14 sacs.',
      'Ajoutez le sable et le gravier (dosage indicatif 1 volume de ciment, 2 de sable, 3 de gravier).',
      'Prévoyez une petite marge (5 à 10 %) pour les pertes.',
    ],
  },
  {
    id: 'carrelage', emoji: '🪟', titre: 'Bien choisir son carrelage',
    intro: 'Le bon format et la bonne résistance selon la pièce.',
    points: [
      'Mesurez la surface à couvrir et ajoutez ~10 % pour les coupes et la casse.',
      'Pièces humides (salle de bain, extérieur, terrasse) : choisissez un carrelage antidérapant adapté.',
      'Grands formats = pose plus rapide et moins de joints ; petits formats = plus faciles dans les petites pièces.',
      'Prévoyez la colle (environ 5 kg/m²) et les croisillons pour des joints réguliers.',
    ],
  },
  {
    id: 'solaire', emoji: '☀️', titre: 'Dimensionner son installation solaire',
    intro: 'Les bases pour estimer panneaux, batterie et onduleur.',
    points: [
      'Listez vos appareils et leur consommation : puissance (W) × heures d\'utilisation par jour = besoin en Wh/jour.',
      'Estimez la production : au Cameroun, comptez ~4 à 5 heures d\'ensoleillement utile par jour pour vos panneaux.',
      'La batterie se choisit selon l\'autonomie souhaitée (combien de temps sans soleil).',
      'L\'onduleur doit supporter la puissance maximale appelée par vos appareils en même temps.',
      'Pour une installation fiable, faites valider le dimensionnement par un professionnel.',
    ],
  },
  {
    id: 'fer', emoji: '🏗️', titre: 'Choisir son fer à béton',
    intro: 'Le bon diamètre selon l\'usage.',
    points: [
      'Petits ouvrages (linteaux, chaînages légers) : souvent des fers de 8 à 10 mm.',
      'Poteaux et poutres : généralement 12 mm et plus, selon les charges.',
      'Respectez l\'enrobage (béton autour des fers) pour éviter la corrosion.',
      'En cas de doute sur une structure porteuse, demandez l\'avis d\'un ingénieur ou d\'un maçon expérimenté.',
    ],
  },
]

export default function ConseilsPage() {
  return (
    <div className="min-h-screen bg-beton">
      <div className="bg-acier text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-condensed font-bold text-3xl md:text-4xl">Conseils & idées</h1>
          <p className="text-white/70 mt-2">Des guides simples pour bien préparer vos travaux et acheter la bonne quantité.</p>
        </div>
      </div>

      {/* Sommaire */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex flex-wrap gap-2">
          {GUIDES.map(g => (
            <a key={g.id} href={`#${g.id}`} className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium text-acier hover:border-brique hover:text-brique">
              {g.emoji} {g.titre}
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {GUIDES.map(g => (
          <article key={g.id} id={g.id} className="bg-white rounded-2xl border border-gray-100 p-6 scroll-mt-20">
            <h2 className="font-condensed font-bold text-xl text-acier flex items-center gap-2 mb-1">
              <span className="text-2xl">{g.emoji}</span> {g.titre}
            </h2>
            <p className="text-gray-500 text-sm mb-4">{g.intro}</p>
            <ul className="space-y-2">
              {g.points.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-brique font-bold">•</span><span>{p}</span></li>
              ))}
            </ul>
          </article>
        ))}

        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-gray-600 mb-1 font-semibold">Un doute sur les quantités ?</p>
          <p className="text-sm text-gray-500 mb-4">Ces guides sont donnés à titre indicatif. Pour un chiffrage précis, demandez-nous un devis gratuit.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/devis" className="bg-brique hover:bg-brique-dark text-white font-semibold px-6 py-3 rounded-lg">Demander un devis</Link>
            <Link href="/produits" className="border border-gray-200 text-gray-600 hover:border-brique hover:text-brique font-semibold px-6 py-3 rounded-lg">Voir les produits</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
