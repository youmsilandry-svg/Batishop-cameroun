'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Heart, User, LogOut, Package, ChevronRight, MapPin, Phone, Bell } from 'lucide-react'
import { supabase, formatPrix, VILLES } from '../../../lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profil, setProfil] = useState<any>(null)
  const [commandes, setCommandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [nbFavoris, setNbFavoris] = useState(0)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/compte'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profils').select('*').eq('id', user.id).single()
      setProfil(prof)
      const { data: cmds } = await supabase.from('commandes')
        .select('*')
        .eq('client_telephone', prof?.telephone || '')
        .order('created_at', { ascending: false })
        .limit(5)
      setCommandes(cmds || [])
      const favs = JSON.parse(localStorage.getItem('batishop_favoris') || '[]')
      setNbFavoris(favs.length)
      setLoading(false)
    }
    charger()
  }, [router])

  const seDeconnecter = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const statutStyle = (s: string) => ({
    en_attente:   'bg-amber-100 text-amber-800',
    confirmee:    'bg-blue-100 text-blue-800',
    en_livraison: 'bg-purple-100 text-purple-800',
    livree:       'bg-green-100 text-green-800',
    annulee:      'bg-red-100 text-red-800',
  }[s] || 'bg-gray-100 text-gray-600')

  const statutLabel = (s: string) => ({
    en_attente: '⏳ En attente', confirmee: '✓ Confirmée',
    en_livraison: '🚚 En livraison', livree: '✅ Livrée', annulee: '❌ Annulée',
  }[s] || s)

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"/>
        <div className="h-32 bg-gray-200 rounded"/>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="bg-acier rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brique flex items-center justify-center font-condensed font-bold text-2xl">
              {profil?.nom?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="font-condensed font-bold text-xl">{profil?.nom || 'Mon compte'}</h1>
              <p className="text-white/60 text-sm">{user?.email}</p>
              {profil?.telephone && (
                <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                  <Phone size={11}/> {profil.telephone}
                </p>
              )}
            </div>
          </div>
          <button onClick={seDeconnecter}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm border border-white/20 rounded-lg px-3 py-2 transition-colors">
            <LogOut size={15}/> Déconnexion
          </button>
        </div>
        <div className="flex gap-6 mt-5 pt-4 border-t border-white/10">
          <div>
            <div className="font-condensed font-bold text-2xl text-or">{commandes.length}</div>
            <div className="text-xs text-white/50">Commandes</div>
          </div>
          <div>
            <div className="font-condensed font-bold text-2xl text-or">{nbFavoris}</div>
            <div className="text-xs text-white/50">Favoris</div>
          </div>
          <div>
            <div className="font-condensed font-bold text-2xl text-or">
              {commandes.filter(c => c.statut === 'livree').length}
            </div>
            <div className="text-xs text-white/50">Livrées</div>
          </div>
        </div>
      </div>

      {/* Navigation rapide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { href: '/compte/commandes', icon: ShoppingBag, label: 'Mes commandes', color: 'bg-blue-50 text-blue-700' },
          { href: '/favoris', icon: Heart, label: 'Mes favoris', color: 'bg-red-50 text-red-700' },
          { href: '/compte/profil', icon: User, label: 'Mon profil', color: 'bg-green-50 text-green-700' },
          { href: '/produits', icon: Package, label: 'Nos produits', color: 'bg-amber-50 text-amber-700' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
              <item.icon size={18}/>
            </div>
            <span className="text-xs font-medium text-acier">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Dernières commandes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-condensed font-bold text-lg text-acier">Mes dernières commandes</h2>
            <Link href="/compte/commandes" className="text-xs text-brique hover:underline">Voir tout →</Link>
          </div>
          {commandes.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag size={36} className="mx-auto text-gray-300 mb-3"/>
              <p className="text-sm text-gray-500 mb-3">Aucune commande pour l'instant</p>
              <Link href="/produits" className="btn-primary text-sm">Commencer mes achats</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {commandes.map(c => (
                <div key={c.id} className="border border-gray-100 rounded-lg p-3 hover:bg-beton transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-gray-400">{c.numero}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statutStyle(c.statut)}`}>
                      {statutLabel(c.statut)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {c.articles?.length} article{c.articles?.length > 1 ? 's' : ''} ·{' '}
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="font-condensed font-bold text-sm text-brique">{formatPrix(c.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profil & Adresse */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-condensed font-bold text-lg text-acier">Mon profil</h2>
              <Link href="/compte/profil" className="text-xs text-brique hover:underline flex items-center gap-1">
                Modifier <ChevronRight size={12}/>
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { icon: User, label: 'Nom', val: profil?.nom || 'Non renseigné' },
                { icon: Phone, label: 'Téléphone', val: profil?.telephone || 'Non renseigné' },
                { icon: MapPin, label: 'Ville', val: profil?.ville || 'Non renseignée' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-beton flex items-center justify-center shrink-0">
                    <item.icon size={14} className="text-gray-500"/>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{item.label}</div>
                    <div className="text-sm font-medium text-acier">{item.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification commande en cours */}
          {commandes.some(c => c.statut === 'en_livraison') && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
              <Bell size={18} className="text-purple-600 shrink-0 mt-0.5"/>
              <div>
                <div className="font-medium text-sm text-purple-800">Commande en livraison</div>
                <div className="text-xs text-purple-600 mt-0.5">
                  Votre commande est en route ! Restez disponible par téléphone.
                </div>
              </div>
            </div>
          )}

          {/* Aide */}
          <div className="card p-4">
            <h3 className="font-medium text-sm text-acier mb-3">Besoin d'aide ?</h3>
            <div className="space-y-2">
              <a href="tel:+237600000000" className="flex items-center gap-2 text-sm text-gray-600 hover:text-brique">
                <Phone size={14}/> +237 6XX XXX XXX
              </a>
              <Link href="/aide/faq" className="flex items-center gap-2 text-sm text-gray-600 hover:text-brique">
                <ChevronRight size={14}/> FAQ & Aide
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
