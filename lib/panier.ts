'use client'
import { useState, useEffect, useCallback } from 'react'
import { Produit } from './supabase'

// Une ligne = un produit ACHETÉ CHEZ UNE BOUTIQUE précise, à son prix.
export type ArticlePanier = {
  produit: Produit
  point_vente_id: string
  partenaire_nom: string
  ville: string
  prix_unitaire: number          // prix_local du partenaire au moment de l'ajout
  quantite: number
  livre?: boolean                // la boutique propose-t-elle la livraison ?
  frais_livraison_base?: number  // frais de livraison par défaut de la boutique
  mode?: 'retrait' | 'livraison' // choisi au moment du checkout
}

export const cleLigne = (produitId: string, pointVenteId: string) => `${produitId}__${pointVenteId}`

const lire = (): ArticlePanier[] => {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('batishop_panier') || '[]') } catch { return [] }
}
const ecrire = (items: ArticlePanier[]) => {
  localStorage.setItem('batishop_panier', JSON.stringify(items))
  window.dispatchEvent(new Event('panier-updated'))
}

// Ajout autonome (utilisable hors hook, ex: dans OuTrouver)
export function ajouterLignePanier(
  produit: Produit,
  pv: { id: string; nom: string; ville: string; prix_local: number; livre?: boolean; frais_livraison_base?: number },
  quantite = 1,
) {
  const items = lire()
  const cle = cleLigne(produit.id, pv.id)
  const existe = items.find(a => cleLigne(a.produit.id, a.point_vente_id) === cle)
  const nouveau = existe
    ? items.map(a => cleLigne(a.produit.id, a.point_vente_id) === cle ? { ...a, quantite: a.quantite + quantite } : a)
    : [...items, {
        produit, point_vente_id: pv.id, partenaire_nom: pv.nom, ville: pv.ville,
        prix_unitaire: pv.prix_local, quantite,
        livre: pv.livre ?? true, frais_livraison_base: pv.frais_livraison_base ?? 0,
      }]
  ecrire(nouveau)
}

export type GroupePartenaire = {
  point_vente_id: string
  partenaire_nom: string
  ville: string
  livre: boolean
  frais_livraison_base: number
  lignes: ArticlePanier[]
  sousTotal: number
}

export function usePanier() {
  const [articles, setArticles] = useState<ArticlePanier[]>([])

  const recharger = useCallback(() => setArticles(lire()), [])
  useEffect(() => {
    recharger()
    window.addEventListener('panier-updated', recharger)
    return () => window.removeEventListener('panier-updated', recharger)
  }, [recharger])

  const changerQuantite = useCallback((cle: string, quantite: number) => {
    const items = lire()
    const nouveau = quantite <= 0
      ? items.filter(a => cleLigne(a.produit.id, a.point_vente_id) !== cle)
      : items.map(a => cleLigne(a.produit.id, a.point_vente_id) === cle ? { ...a, quantite } : a)
    ecrire(nouveau); setArticles(nouveau)
  }, [])

  const retirerDuPanier = useCallback((cle: string) => {
    const nouveau = lire().filter(a => cleLigne(a.produit.id, a.point_vente_id) !== cle)
    ecrire(nouveau); setArticles(nouveau)
  }, [])

  const viderPanier = useCallback(() => {
    localStorage.removeItem('batishop_panier')
    window.dispatchEvent(new Event('panier-updated'))
    setArticles([])
  }, [])

  // Regroupement par partenaire (= future sous-commande)
  const parPartenaire: GroupePartenaire[] = Object.values(
    articles.reduce((acc: Record<string, GroupePartenaire>, a) => {
      const g = acc[a.point_vente_id] ||= {
        point_vente_id: a.point_vente_id, partenaire_nom: a.partenaire_nom, ville: a.ville,
        livre: a.livre ?? true, frais_livraison_base: a.frais_livraison_base ?? 0, lignes: [], sousTotal: 0,
      }
      g.lignes.push(a); g.sousTotal += a.prix_unitaire * a.quantite
      return acc
    }, {})
  )

  const total = articles.reduce((s, a) => s + a.prix_unitaire * a.quantite, 0)
  const nbArticles = articles.reduce((s, a) => s + a.quantite, 0)

  return { articles, parPartenaire, changerQuantite, retirerDuPanier, viderPanier, total, nbArticles }
}
