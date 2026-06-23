import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { SITE } from '../../lib/config'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: `Conseils & idées travaux — ${SITE.nom}`,
  description: 'Guides pratiques pour vos travaux : calculer le béton d\'une dalle, choisir son carrelage, dimensionner une installation solaire.',
}

export default async function ConseilsPage() {
  const { data } = await supabase
    .from('conseils')
    .select('*')
    .eq('visible', true)
    .order('ordre', { ascending: true })

  const guides = (data || []).map((g: any) => ({
    ...g,
    ancre: g.ancre || g.id,
    points: Array.isArray(g.points) ? g.points : [],
  }))

  return (
    <div className="min-h-screen bg-beton">
      <div className="bg-acier text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-condensed font-bold text-3xl md:text-4xl">Conseils & idées</h1>
          <p className="text-white/70 mt-2">Des guides simples pour bien préparer vos travaux et acheter la bonne quantité.</p>
        </div>
      </div>

      {/* Sommaire */}
      {guides.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <div className="flex flex-wrap gap-2">
            {guides.map(g => (
              <a key={g.id} href={`#${g.ancre}`} className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium text-acier hover:border-brique hover:text-brique">
                {g.emoji} {g.titre}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {guides.map(g => (
          <article key={g.id} id={g.ancre} className="bg-white rounded-2xl border border-gray-100 p-6 scroll-mt-20">
            <h2 className="font-condensed font-bold text-xl text-acier flex items-center gap-2 mb-1">
              <span className="text-2xl">{g.emoji}</span> {g.titre}
            </h2>
            {g.intro && <p className="text-gray-500 text-sm mb-4">{g.intro}</p>}
            <ul className="space-y-2">
              {g.points.map((p: string, i: number) => (
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
