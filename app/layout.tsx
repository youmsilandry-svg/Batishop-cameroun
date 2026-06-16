import type { Metadata } from 'next'
import '../styles/globals.css'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

export const metadata: Metadata = {
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
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
