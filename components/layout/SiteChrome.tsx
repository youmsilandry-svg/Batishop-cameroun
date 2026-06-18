'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const isAdmin = pathname.startsWith('/admin')

  // Quitter l'espace admin (arriver sur une page publique) → déconnexion de la session admin.
  useEffect(() => {
    if (isAdmin || typeof window === 'undefined') return
    if (localStorage.getItem('batishop_admin_auth') === '1') {
      localStorage.removeItem('batishop_admin_auth')
      localStorage.removeItem('admin_last_activity')
      localStorage.removeItem('admin_session_start')
      supabase.auth.signOut()
    }
  }, [isAdmin, pathname])

  // L'admin est un espace séparé : aucune Navbar / Footer du site public.
  if (isAdmin) return <>{children}</>

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
