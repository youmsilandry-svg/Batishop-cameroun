'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { CarteProduit } from '../../../components/produits/CarteProduit'

export default function PageFavoris() {
  const router = useRouter()
  const [produits, setProduits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/compte'); return }
      const { data } = await supabase.from('favoris')
        .select('produit_id, produits(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setProduits((data || []).map((r: any) => r.produits).filter(Boolean))
      setLoading(false)
    })()
  }, [router])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/compte/dashboard" className="p-2 hover:bg-beton rounded-lg">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="font-condensed font-bold text-2xl text-acier flex items-center gap-2">
            <Heart size={20} className="text-brique fill-brique" /> Mes favoris
          </h1>
          <p className="text-sm text-gray-500">{produits.length} produit{produits.length > 1 ? 's' : ''} enregistré{produits.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : produits.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-condensed font-bold text-lg text-acier mb-2">Aucun favori pour l'instant</h3>
          <p className="text-gray-500 text-sm mb-4">Cliquez sur le cœur ❤️ d'un produit pour le retrouver ici.</p>
          <Link href="/produits" className="inline-block bg-brique hover:bg-brique-dark text-white font-semibold px-6 py-3 rounded-lg">Découvrir nos produits</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {produits.map(p => <CarteProduit key={p.id} produit={p} />)}
        </div>
      )}
    </div>
  )
}
