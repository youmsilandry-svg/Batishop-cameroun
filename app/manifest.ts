import { MetadataRoute } from 'next'
import { PAYS } from '../lib/config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `BatiShop ${PAYS.nom}`,
    short_name: `BatiShop ${PAYS.code}`,
    description: `Matériaux de construction en ${PAYS.nom} — comparez les prix et achetez près de chez vous.`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F2EDE8',
    theme_color: '#1A2332',
    lang: 'fr',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
