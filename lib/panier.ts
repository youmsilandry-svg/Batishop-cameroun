'use client'
import { useState, useEffect, useCallback } from 'react'
import { Produit } from './supabase'

export type ArticlePanier = {
  produit: Produit
  quantite: number
}

export function usePanier() {
  const [articles, setArticles] = useState<ArticlePanier[]>([])

  useEffect(() => {
    const data = localStorage.getItem('batishop_panier')
    if (data) setArticles(JSON.parse(data))
  }, [])

  const sauvegarder = useCallback((items: ArticlePanier[]) => {
    setArticles(items)
    localStorage.setItem('batishop_panier', JSON.stringify(items))
  }, [])

  const ajouterAuPanier = useCallback((produit: Produit, quantite = 1) => {
    setArticles(prev => {
      const existe = prev.find(a => a.produit.id === produit.id)
      const nouveau = existe
        ? prev.map(a => a.produit.id === produit.id
            ? { ...a, quantite: a.quantite + quantite }
            : a)
        : [...prev, { produit, quantite }]
      localStorage.setItem('batishop_panier', JSON.stringify(nouveau))
      return nouveau
    })
  }, [])

  const retirerDuPanier = useCallback((produitId: string) => {
    setArticles(prev => {
      const nouveau = prev.filter(a => a.produit.id !== produitId)
      localStorage.setItem('batishop_panier', JSON.stringify(nouveau))
      return nouveau
    })
  }, [])

  const changerQuantite = useCallback((produitId: string, quantite: number) => {
    if (quantite <= 0) { retirerDuPanier(produitId); return }
    setArticles(prev => {
      const nouveau = prev.map(a =>
        a.produit.id === produitId ? { ...a, quantite } : a)
      localStorage.setItem('batishop_panier', JSON.stringify(nouveau))
      return nouveau
    })
  }, [retirerDuPanier])

  const viderPanier = useCallback(() => {
    setArticles([])
    localStorage.removeItem('batishop_panier')
  }, [])

  const total = articles.reduce((s, a) => s + a.produit.prix * a.quantite, 0)
  const nbArticles = articles.reduce((s, a) => s + a.quantite, 0)

  return { articles, ajouterAuPanier, retirerDuPanier, changerQuantite, viderPanier, total, nbArticles }
}
