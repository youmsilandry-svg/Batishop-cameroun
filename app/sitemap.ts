import type { MetadataRoute } from 'next'
import { supabase } from '../lib/supabase'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://batishop-cameroun.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pagesFixes = ['', '/produits', '/devis', '/partenaires', '/conseils', '/contact', '/aide/faq', '/aide/livraison', '/aide/retours']
    .map(p => ({
      url: `${BASE}${p}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.7,
    }))

  let produits: any[] = []
  try {
    const { data } = await supabase.from('produits').select('id, created_at').eq('actif', true).limit(1000)
    produits = data || []
  } catch { /* sitemap des pages fixes au minimum */ }

  const pagesProduits = produits.map(p => ({
    url: `${BASE}/produits/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...pagesFixes, ...pagesProduits]
}
