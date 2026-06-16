import { supabase } from './supabase'

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfil() {
  const user = await getUser()
  if (!user) return null
  const { data } = await supabase.from('profils').select('*').eq('id', user.id).single()
  return data
}

export async function seConnecter(email: string, motDePasse: string) {
  return supabase.auth.signInWithPassword({ email, password: motDePasse })
}

export async function sInscrire(email: string, motDePasse: string, nom: string, telephone: string) {
  return supabase.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { nom, telephone } }
  })
}

export async function seDeconnecter() {
  return supabase.auth.signOut()
}
