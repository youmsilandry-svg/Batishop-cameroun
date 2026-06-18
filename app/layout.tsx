import type { Metadata } from 'next'
import '../styles/globals.css'
import SiteChrome from '../components/layout/SiteChrome'

export const metadata: Metadata = {
  metadataBase: new URL('https://batishop-cameroun.com'),
  verification: { google: '3avAGOjh9Z4pzQOTdUukVhLtqw6QGgVmaOJsopNZVog' },
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'BatiShop Cameroun',
        url: 'https://batishop-cameroun.com',
        logo: 'https://batishop-cameroun.com/icon.svg',
        description: 'Matériaux de construction en ligne au Cameroun : maçonnerie, plomberie, électricité, carrelage, énergie solaire.',
        areaServed: 'CM',
      },
      {
        '@type': 'WebSite',
        name: 'BatiShop Cameroun',
        url: 'https://batishop-cameroun.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://batishop-cameroun.com/produits?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
  return (
    <html lang="fr">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
