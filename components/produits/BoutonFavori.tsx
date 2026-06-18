'use client'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFavoris } from '../../lib/favoris'

export default function BoutonFavori({ produitId, variant = 'card' }: { produitId: string; variant?: 'card' | 'page' }) {
  const { estFavori, toggle } = useFavoris()
  const router = useRouter()
  const actif = estFavori(produitId)

  const clic = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const r = await toggle(produitId)
    if (r === 'non_connecte') router.push('/compte')
  }

  if (variant === 'page') {
    return (
      <button onClick={clic}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-semibold text-sm transition-colors ${actif ? 'border-brique bg-brique/5 text-brique' : 'border-gray-200 text-gray-500 hover:border-brique hover:text-brique'}`}>
        <Heart size={18} className={actif ? 'fill-brique' : ''} />
        {actif ? 'Dans mes favoris' : 'Ajouter aux favoris'}
      </button>
    )
  }

  return (
    <button onClick={clic} aria-label="Ajouter aux favoris"
      className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${actif ? 'bg-white text-brique shadow' : 'bg-white/80 hover:bg-white text-brique opacity-0 group-hover:opacity-100'}`}>
      <Heart size={14} className={actif ? 'fill-brique' : ''} />
    </button>
  )
}
