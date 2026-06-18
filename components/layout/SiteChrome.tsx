'use client'
import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  // L'admin est un espace séparé : aucune Navbar / Footer du site public.
  if (pathname.startsWith('/admin')) {
    return <>{children}</>
  }
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
