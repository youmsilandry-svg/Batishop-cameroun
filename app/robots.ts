import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://batishop-cameroun.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/compte', '/api'] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
