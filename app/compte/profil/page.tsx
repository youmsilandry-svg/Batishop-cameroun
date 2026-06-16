'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, MapPin, Lock, Save, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase, VILLES } from '../../../lib/supabase'

export default function PageProfil() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState<'infos' | 'securite'>('infos')
  const [voirMdp, setVoirMdp] = useState(false)

  const [form, setForm] = useState({
    nom: '', telephone: '', ville: 'Douala', adresse: ''
  })
  const [mdpForm, setMdpForm] = useState({
    nouveauMdp: '', confirmerMdp: ''
  })

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/compte'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profils').select('*').eq('id', user.id).single()
      if (prof) {
        setForm({
          nom: prof.nom || '',
          telephone: prof.telephone || '',
          ville: prof.ville || 'Douala',
          adresse: prof.adresse || '',
        })
      }
      setLoading(false)
    }
    charger()
  }, [router])

  const sauvegarderProfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setErreur(''); setSucces('')
    const { error } = await supabase.from('profils').upsert({
      id: user.id,
      nom: form.nom,
      telephone: form.telephone,
      ville: form.ville,
      adresse: form.adresse,
      updated_at: new Date().toISOString(),
    })
    if (error) setErreur('Erreur lors de la sauvegarde')
    else setSucces('Profil mis à jour avec succès !')
    setSaving(false)
    setTimeout(() => setSucces(''), 3000)
  }

  const changerMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mdpForm.nouveauMdp.length < 6) { setErreur('Minimum 6 caractères'); return }
    if (mdpForm.nouveauMdp !== mdpForm.confirmerMdp) { setErreur('Les mots de passe ne correspondent pas'); return }
    setSaving(true); setErreur(''); setSucces('')
    const { error } = await supabase.auth.updateUser({ password: mdpForm.nouveauMdp })
    if (error) setErreur('Erreur lors du changement de mot de passe')
    else { setSucces('Mot de passe modifié !'); setMdpForm({ nouveauMdp: '', confirmerMdp: '' }) }
    setSaving(false)
    setTimeout(() => setSucces(''), 3000)
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"/>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse"/>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/compte/dashboard" className="p-2 hover:bg-beton rounded-lg">
          <ArrowLeft size={18} className="text-gray-500"/>
        </Link>
        <div>
          <h1 className="font-condensed font-bold text-2xl text-acier">Mon profil</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6 card p-4">
        <div className="w-16 h-16 rounded-full bg-brique flex items-center justify-center font-condensed font-bold text-2xl text-white">
          {form.nom?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <div className="font-bold text-acier">{form.nom || 'Mon compte'}</div>
          <div className="text-sm text-gray-500">{user?.email}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            Membre depuis {new Date(user?.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Messages */}
      {succes && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <CheckCircle size={16}/> {succes}
        </div>
      )}
      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          ⚠️ {erreur}
        </div>
      )}

      {/* Onglets */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
        <button onClick={() => { setOnglet('infos'); setErreur('') }}
          className={`flex-1 py-2.5 text-sm font-semibold ${onglet === 'infos' ? 'bg-brique text-white' : 'text-gray-500 hover:bg-beton'}`}>
          Mes informations
        </button>
        <button onClick={() => { setOnglet('securite'); setErreur('') }}
          className={`flex-1 py-2.5 text-sm font-semibold ${onglet === 'securite' ? 'bg-brique text-white' : 'text-gray-500 hover:bg-beton'}`}>
          Sécurité
        </button>
      </div>

      {/* Infos personnelles */}
      {onglet === 'infos' && (
        <form onSubmit={sauvegarderProfil} className="card p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Nom complet *</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Votre nom complet" className="input-field pl-9"/>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Email (non modifiable)</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={user?.email} disabled className="input-field pl-9 bg-gray-50 text-gray-400 cursor-not-allowed"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Téléphone *</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                  placeholder="+237 6XX XXX XXX" className="input-field pl-9"/>
              </div>
              <p className="text-xs text-gray-400 mt-1">Utilisé pour le suivi commandes</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Ville *</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <select value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                  className="input-field pl-9">
                  {VILLES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Adresse de livraison</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-gray-400"/>
              <textarea value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                placeholder="Quartier, rue, point de repère..." rows={3}
                className="input-field pl-9 resize-none"/>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-colors ${saving ? 'bg-gray-400' : 'bg-brique hover:bg-brique-dark'}`}>
            <Save size={16}/> {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </button>
        </form>
      )}

      {/* Sécurité */}
      {onglet === 'securite' && (
        <form onSubmit={changerMotDePasse} className="card p-6 space-y-5">
          <div>
            <h3 className="font-condensed font-bold text-lg text-acier mb-1">Changer le mot de passe</h3>
            <p className="text-sm text-gray-500">Choisissez un mot de passe sécurisé d'au moins 6 caractères.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input type={voirMdp ? 'text' : 'password'} value={mdpForm.nouveauMdp}
                onChange={e => setMdpForm(f => ({ ...f, nouveauMdp: e.target.value }))}
                placeholder="Minimum 6 caractères" className="input-field pl-9 pr-10"/>
              <button type="button" onClick={() => setVoirMdp(!voirMdp)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {voirMdp ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {mdpForm.nouveauMdp && (
              <div className="mt-1.5 flex gap-1">
                {[6,8,12].map(len => (
                  <div key={len} className={`flex-1 h-1 rounded-full transition-colors ${mdpForm.nouveauMdp.length >= len ? 'bg-green-500' : 'bg-gray-200'}`}/>
                ))}
                <span className="text-xs text-gray-400 ml-2">
                  {mdpForm.nouveauMdp.length < 6 ? 'Faible' : mdpForm.nouveauMdp.length < 8 ? 'Moyen' : 'Fort'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input type={voirMdp ? 'text' : 'password'} value={mdpForm.confirmerMdp}
                onChange={e => setMdpForm(f => ({ ...f, confirmerMdp: e.target.value }))}
                placeholder="Répétez le mot de passe" className="input-field pl-9"/>
              {mdpForm.confirmerMdp && mdpForm.nouveauMdp === mdpForm.confirmerMdp && (
                <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"/>
              )}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-colors ${saving ? 'bg-gray-400' : 'bg-brique hover:bg-brique-dark'}`}>
            <Lock size={16}/> {saving ? 'Modification...' : 'Changer le mot de passe'}
          </button>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-medium text-sm text-acier mb-2">Compte connecté</h4>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail size={14}/> {user?.email}
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
