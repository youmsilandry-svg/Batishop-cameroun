import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types TypeScript pour la base de données
export type Produit = {
  id: string
  nom: string
  description: string
  prix: number
  prix_ancien?: number
  categorie: string
  sous_categorie?: string
  reference: string
  stock: number
  unite: string        // ex: "sac", "m²", "pièce", "rouleau"
  image_url?: string
  badge?: 'nouveau' | 'promo' | 'solaire' | null
  actif: boolean
  created_at: string
}

export type Commande = {
  id: string
  numero: string
  client_nom: string
  client_telephone: string
  client_ville: string
  client_adresse: string
  articles: ArticleCommande[]
  total: number
  statut: 'en_attente' | 'confirmee' | 'en_livraison' | 'livree' | 'annulee'
  paiement_methode: string
  paiement_statut: 'en_attente' | 'paye' | 'echec'
  created_at: string
}

export type ArticleCommande = {
  produit_id: string
  nom: string
  prix: number
  quantite: number
  unite: string
}

export const CATEGORIES = [
  { id: 'maconnerie',      label: 'Maçonnerie',      emoji: '🧱' },
  { id: 'plomberie',       label: 'Plomberie',       emoji: '🔧' },
  { id: 'electricite',     label: 'Électricité',     emoji: '⚡' },
  { id: 'carrelage',       label: 'Carrelage',       emoji: '🪟' },
  { id: 'photovoltaique',  label: 'Photovoltaïque',  emoji: '☀️' },
  { id: 'menuiserie',      label: 'Menuiserie',      emoji: '🚪' },
  { id: 'outillage',       label: 'Outillage',       emoji: '🔨' },
  { id: 'peinture',        label: 'Peinture',        emoji: '🎨' },
  { id: 'couverture',      label: 'Couverture',      emoji: '🏠' },
  { id: 'assainissement',  label: 'Assainissement',  emoji: '💧' },
]

export const VILLES = [
  'Douala', 'Yaoundé', 'Bafoussam', 'Garoua',
  'Bamenda', 'Maroua', 'Ngaoundéré', 'Bertoua',
  'Ebolowa', 'Kumba', 'Limbe', 'Kribi',
]

export function formatPrix(montant: number): string {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(montant)
}
