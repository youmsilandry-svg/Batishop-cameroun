import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import SiteChrome from '../components/layout/SiteChrome'
import { PAYS, SITE } from '../lib/config'
import PWA from '../components/PWA'

// URL publique du site, propre à chaque déploiement (CM / CI).
// Définir NEXT_PUBLIC_SITE_URL sur Vercel :
//   CM -> https://batishop-cameroun.com
//   CI -> https://batishop-ci.com   (ou l'URL .vercel.app en attendant le domaine)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://batishop-cameroun.com'

// Clé de vérification Google Search Console (propre au domaine).
// Définir NEXT_PUBLIC_GOOGLE_VERIFICATION par pays ; vide sinon.
const GOOGLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || ''

// openGraph attend la locale au format "fr_CM" (underscore), config = "fr-CM".
const OG_LOCALE = PAYS.locale.replace('-', '_')

export const viewport: Viewport = {
  themeColor: '#1A2332',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...(GOOGLE_VERIFICATION ? { verification: { google: GOOGLE_VERIFICATION } } : {}),
  title: `${SITE.nom} — Matériaux de Construction`,
  description: `Achetez vos matériaux de construction en ligne ${PAYS.prefixe} ${PAYS.nom}. Maçonnerie, plomberie, électricité, carrelage, panneaux solaires livrés partout ${PAYS.prefixe} ${PAYS.nom}.`,
  keywords: `matériaux construction ${PAYS.nom}, ciment, plomberie, carrelage, panneaux solaires, ${PAYS.villes[0]}, ${PAYS.villes[1]}`,
  appleWebApp: { capable: true, title: `BatiShop ${PAYS.code}`, statusBarStyle: 'default' },
  openGraph: {
    title: SITE.nom,
    description: `N°1 des matériaux de construction en ligne ${PAYS.prefixe} ${PAYS.nom}`,
    locale: OG_LOCALE,
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: SITE.nom,
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
        description: `Matériaux de construction en ligne ${PAYS.prefixe} ${PAYS.nom} : maçonnerie, plomberie, électricité, carrelage, énergie solaire.`,
        areaServed: PAYS.code,
      },
      {
        '@type': 'WebSite',
        name: SITE.nom,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/produits?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
  return (
    <html lang="fr">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <PWA />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
