import type { Metadata } from 'next'
import '../styles/globals.css'
import SiteChrome from '../components/layout/SiteChrome'

export const metadata: Metadata = {
  metadataBase: new URL('https://batishop-cameroun.com'),
  title: 'BatiShop Cameroun — Matériaux de Construction',
  description: 'Achetez vos matériaux de construction en ligne au Cameroun. Maçonnerie, plomberie, électricité, carrelage, panneaux solaires livrés partout au Cameroun.',
  keywords: 'matériaux construction cameroun, ciment, plomberie, carrelage, panneaux solaires, douala, yaoundé',
  openGraph: {
    title: 'BatiShop Cameroun',
    description: 'N°1 des matériaux de construction en ligne au Cameroun',
    locale: 'fr_CM',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
