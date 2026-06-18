'use client'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'

let cacheSet: Set<string> | null = null
let cacheUser: string | null = null
let authSub = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(l => l())

async function charger() {
  const { data: { user } } = await supabase.auth.getUser()
  cacheUser = user?.id || null
  if (!user) { cacheSet = new Set(); notify(); return }
  const { data } = await supabase.from('favoris').select('produit_id').eq('user_id', user.id)
  cacheSet = new Set((data || []).map((r: any) => r.produit_id))
  notify()
}

function ensureAuthSub() {
  if (authSub) return
  authSub = true
  supabase.auth.onAuthStateChange(() => { cacheSet = null; charger() })
}

export function useFavoris() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force(x => x + 1)
    listeners.add(l)
    ensureAuthSub()
    if (cacheSet === null) charger()
    return () => { listeners.delete(l) }
  }, [])

  const estFavori = (id: string) => !!cacheSet?.has(id)
  const connecte = () => !!cacheUser
  const count = cacheSet?.size || 0

  const toggle = async (produitId: string): Promise<'ajoute' | 'retire' | 'non_connecte'> => {
    if (!cacheUser) return 'non_connecte'
    if (cacheSet?.has(produitId)) {
      cacheSet.delete(produitId); notify()
      await supabase.from('favoris').delete().eq('user_id', cacheUser).eq('produit_id', produitId)
      return 'retire'
    } else {
      cacheSet?.add(produitId); notify()
      await supabase.from('favoris').insert({ user_id: cacheUser, produit_id: produitId })
      return 'ajoute'
    }
  }

  return { estFavori, toggle, connecte, count }
}
