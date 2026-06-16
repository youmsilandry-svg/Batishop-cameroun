'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, LogOut, ShoppingBag, Settings } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function NavbarCompte() {
  const [user, setUser] = useState<any>(null)
  const [profil, setProfil] = useState<any>(null)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('profils').select('nom').eq('id', user.id).single()
          .then(({ data }) => setProfil(data))
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const seDeconnecter = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfil(null); setMenuOuvert(false)
    router.push('/')
  }

  if (!user) {
    return (
      <Link href="/compte" className="hidden md:flex flex-col items-center text-xs text-acier hover:text-brique">
        <User size={20}/> Compte
      </Link>
    )
  }

  return (
    <div className="relative hidden md:block">
      <button onClick={() => setMenuOuvert(!menuOuvert)}
        className="flex items-center gap-2 hover:text-brique text-acier">
        <div className="w-7 h-7 rounded-full bg-brique text-white flex items-center justify-center text-xs font-bold">
          {profil?.nom?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
        </div>
        <span className="text-xs font-medium hidden lg:block">{profil?.nom?.split(' ')[0] || 'Compte'}</span>
      </button>

      {menuOuvert && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl border border-gray-100 rounded-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-medium text-sm text-acier">{profil?.nom || 'Mon compte'}</div>
            <div className="text-xs text-gray-400 truncate">{user.email}</div>
          </div>
          {[
            { href: '/compte/dashboard', icon: User, label: 'Mon tableau de bord' },
            { href: '/compte/commandes', icon: ShoppingBag, label: 'Mes commandes' },
            { href: '/compte/profil', icon: Settings, label: 'Mon profil' },
          ].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOuvert(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-acier hover:bg-beton">
              <item.icon size={15} className="text-gray-400"/>
              {item.label}
            </Link>
          ))}
          <div className="border-t border-gray-100">
            <button onClick={seDeconnecter}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
              <LogOut size={15}/> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
