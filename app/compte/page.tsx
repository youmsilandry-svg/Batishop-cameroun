'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, User, Mail, Phone, Lock, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { VILLES } from '../../lib/supabase'

export default function PageCompte() {
  const [mode, setMode] = useState<'connexion' | 'inscription'>('connexion')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [voirMdp, setVoirMdp] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState({
    email: '', motDePasse: '', nom: '', telephone: '', ville: 'Douala'
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/compte/dashboard')
    })
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const connexionGoogle = async () => {
    setErreur('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/compte/dashboard` : undefined },
    })
    if (error) setErreur("La connexion Google n'est pas disponible pour le moment.")
  }

  const handleConnexion = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErreur('')
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.motDePasse
    })
    if (error) {
      setErreur(error.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : 'Une erreur est survenue. Réessayez.')
    } else {
      router.push('/compte/dashboard')
    }
    setLoading(false)
  }

  const handleInscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom.trim()) { setErreur('Veuillez saisir votre nom'); return }
    if (!form.telephone.trim()) { setErreur('Veuillez saisir votre téléphone'); return }
    if (form.motDePasse.length < 6) { setErreur('Le mot de passe doit avoir au moins 6 caractères'); return }
    setLoading(true); setErreur('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.motDePasse,
      options: { data: { nom: form.nom, telephone: form.telephone, ville: form.ville } }
    })
    if (error) {
      setErreur(error.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email. Connectez-vous.'
        : 'Erreur lors de la création du compte.')
    } else {
      setSucces('Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.')
      setMode('connexion')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-beton flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-condensed font-bold text-3xl text-acier mb-1">
            Bati<span className="text-brique">Shop</span> CM
          </div>
          <p className="text-gray-500 text-sm">Votre espace personnel</p>
        </div>

        <div className="card p-6">
          {/* Onglets */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
            <button onClick={() => { setMode('connexion'); setErreur('') }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mode === 'connexion' ? 'bg-brique text-white' : 'text-gray-500 hover:bg-beton'}`}>
              Se connecter
            </button>
            <button onClick={() => { setMode('inscription'); setErreur('') }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mode === 'inscription' ? 'bg-brique text-white' : 'text-gray-500 hover:bg-beton'}`}>
              Créer un compte
            </button>
          </div>

          {erreur && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              ⚠️ {erreur}
            </div>
          )}
          {succes && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
              ✅ {succes}
            </div>
          )}

          {/* Connexion sociale */}
          <button onClick={connexionGoogle} type="button"
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-acier hover:bg-beton transition-colors mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continuer avec Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200"/>
            <span className="text-xs text-gray-400">ou par email</span>
            <div className="flex-1 h-px bg-gray-200"/>
          </div>

          {/* CONNEXION */}
          {mode === 'connexion' && (
            <form onSubmit={handleConnexion} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input required name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="votre@email.com" className="input-field pl-9"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input required name="motDePasse" type={voirMdp ? 'text' : 'password'} value={form.motDePasse} onChange={handleChange}
                    placeholder="••••••••" className="input-field pl-9 pr-10"/>
                  <button type="button" onClick={() => setVoirMdp(!voirMdp)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {voirMdp ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${loading ? 'bg-gray-400' : 'bg-brique hover:bg-brique-dark'}`}>
                {loading ? 'Connexion...' : 'Se connecter →'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                <button type="button" onClick={() => setMode('inscription')} className="text-brique hover:underline">
                  Pas encore de compte ? Inscrivez-vous
                </button>
              </p>
            </form>
          )}

          {/* INSCRIPTION */}
          {mode === 'inscription' && (
            <form onSubmit={handleInscription} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Nom complet *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input required name="nom" value={form.nom} onChange={handleChange}
                      placeholder="Jean Dupont" className="input-field pl-9"/>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input required name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="votre@email.com" className="input-field pl-9"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Téléphone *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input required name="telephone" value={form.telephone} onChange={handleChange}
                      placeholder="+237 6XX XXX XXX" className="input-field pl-9"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Ville *</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <select name="ville" value={form.ville} onChange={handleChange} className="input-field pl-9">
                      {VILLES.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Mot de passe *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input required name="motDePasse" type={voirMdp ? 'text' : 'password'} value={form.motDePasse} onChange={handleChange}
                      placeholder="Minimum 6 caractères" className="input-field pl-9 pr-10"/>
                    <button type="button" onClick={() => setVoirMdp(!voirMdp)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {voirMdp ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${loading ? 'bg-gray-400' : 'bg-brique hover:bg-brique-dark'}`}>
                {loading ? 'Création...' : 'Créer mon compte →'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                En créant un compte, vous acceptez nos <a href="/aide/cgv" className="text-brique hover:underline">CGV</a>
              </p>
            </form>
          )}
        </div>

        {/* Avantages */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[['🛒', 'Suivi commandes'], ['❤️', 'Mes favoris'], ['📍', 'Adresses sauvegardées']].map(([ico, label]) => (
            <div key={label} className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="text-xl mb-1">{ico}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
