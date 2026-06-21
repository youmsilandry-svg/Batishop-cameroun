// Ville sélectionnée par le client, mémorisée dans le navigateur et partagée
// entre le catalogue et la fiche produit (« Où trouver »).
const KEY = 'batishop_ville'

export function getVilleMemo(): string {
  if (typeof window === 'undefined') return ''
  try { return localStorage.getItem(KEY) || '' } catch { return '' }
}

export function setVilleMemo(v: string) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, v || '') } catch { /* ignore */ }
}

// Distance à vol d'oiseau entre deux points GPS (km)
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}
