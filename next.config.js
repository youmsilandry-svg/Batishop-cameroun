/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Force HTTPS pendant 2 ans (et sous-domaines)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Empêche d'afficher le site dans une iframe (anti-clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Empêche le navigateur de "deviner" le type de fichier
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limite les infos de provenance envoyées aux autres sites
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // N'autorise la géolocalisation que pour ton propre site ; bloque caméra/micro
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

module.exports = nextConfig
