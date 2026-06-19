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
  { id: 'maconnerie',      label: 'Maçonnerie',      emoji: '🧱', sous: ['Ciment & Mortier', 'Parpaings & Briques', 'Fer à béton', 'Sable & Gravier', 'Coffrages', 'Enduits & Crépis', 'Colle à carrelage', 'Hourdis & Poutrelles'] },
  { id: 'plomberie',       label: 'Plomberie',       emoji: '🔧', sous: ['Tuyaux & Raccords PVC', 'Robinets & Mitigeurs', 'WC & Lavabos', 'Douches & Baignoires', 'Pompes à eau', 'Chauffe-eau', 'Réservoirs & Citernes', 'Accessoires sanitaires'] },
  { id: 'electricite',     label: 'Électricité',     emoji: '⚡', sous: ['Câbles & Fils', 'Disjoncteurs & Tableaux', 'Prises & Interrupteurs', 'Éclairage LED', 'Gaines & Conduits', 'Onduleurs & Groupes', 'Compteurs & Accessoires', 'Alarmes & Sécurité'] },
  { id: 'carrelage',       label: 'Carrelage',       emoji: '🪟', sous: ['Carrelage Sol', 'Carrelage Mural', 'Carrelage Extérieur', 'Mosaïque & Décor', 'Parquet & Stratifié', 'Colle & Joint', 'Plinthes & Profils', 'Pierre Naturelle'] },
  { id: 'photovoltaique',  label: 'Photovoltaïque',  emoji: '☀️', sous: ['Panneaux Solaires', 'Batteries & Stockage', 'Onduleurs Solaires', 'Régulateurs de charge', 'Kits Solaires Complets', 'Câbles & Connecteurs', 'Structures & Fixations', 'Éclairage Solaire'] },
  { id: 'menuiserie',      label: 'Menuiserie',      emoji: '🚪', sous: ['Portes Intérieures', 'Portes Extérieures', 'Fenêtres & Volets', 'Bois de Construction', 'Contreplaqué & OSB', 'Quincaillerie', 'Parquet Bois massif', 'Escaliers & Rampes'] },
  { id: 'outillage',       label: 'Outillage',       emoji: '🔨', sous: ['Perceuses & Visseuses', 'Meuleuses & Scies', 'Bétonnières', 'Niveaux & Mesure', 'Outils Manuels', 'Compresseurs', 'Échafaudages', 'EPI & Sécurité'] },
  { id: 'peinture',        label: 'Peinture',        emoji: '🎨', sous: ['Peinture Intérieure', 'Peinture Extérieure', 'Sous-couches & Primaires', 'Vernis & Lasures', 'Enduits Décoratifs', 'Pinceaux & Rouleaux', 'Bâches & Protection', 'Papier Peint'] },
  { id: 'couverture',      label: 'Couverture & Toiture', emoji: '🏠', sous: ['Tôles & Bacs acier', 'Tuiles', 'Charpente métallique', 'Faîtières & Accessoires', 'Gouttières & Descentes', 'Étanchéité toiture', 'Isolation toiture', 'Plafonds & Faux-plafonds'] },
  { id: 'assainissement',  label: 'Assainissement',  emoji: '💧', sous: ['Tuyaux PVC évacuation', 'Regards & Caniveaux', 'Fosses septiques', 'Pompes de relevage', 'Bouches & Grilles', 'Drainage', 'Stations de traitement', 'Accessoires évacuation'] },
]

// Lit les catégories depuis la table Supabase (gérable dans Table Editor).
// Repli automatique sur la liste statique CATEGORIES si la table est vide/indisponible.
export async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('slug,label,emoji,sous,ordre')
      .eq('actif', true)
      .order('ordre', { ascending: true })
    if (error || !data || data.length === 0) return CATEGORIES
    return data.map((c: any) => ({
      id: c.slug,
      label: c.label,
      emoji: c.emoji || '📦',
      sous: Array.isArray(c.sous) ? c.sous : [],
    }))
  } catch {
    return CATEGORIES
  }
}

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
