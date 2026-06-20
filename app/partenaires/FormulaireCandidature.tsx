'use client'
import { useState } from 'react'
import { Check, Send, Store, HardHat } from 'lucide-react'
import { supabase, VILLES } from '../../lib/supabase'

export default function FormulaireCandidature() {
  const [type, setType] = useState<'quincaillerie' | 'professionnel'>('quincaillerie')
  const [f, setF] = useState({ nom: '', ville: 'Douala', quartier: '', adresse: '', telephone: '', email: '', metier: '', message: '' })
  const [envoi, setEnvoi] = useState(false)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')

  const champ = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(s => ({ ...s, [e.target.name]: e.target.value }))

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    if (!f.nom || !f.telephone || !f.ville) { setErr('Nom, ville et téléphone sont obligatoires.'); return }
    setEnvoi(true)
    try {
      const description = [
        `Type: ${type === 'quincaillerie' ? 'Quincaillerie' : 'Professionnel'}`,
        type === 'professionnel' && f.metier ? `Métier: ${f.metier}` : '',
        f.message ? `Message: ${f.message}` : '',
      ].filter(Boolean).join(' | ')

      const { data: ent, error: e1 } = await supabase.from('entreprises').insert({
        nom: f.nom, email: f.email || null, telephone: f.telephone, statut: 'en_attente',
      }).select('id').single()
      if (e1 || !ent) throw e1 || new Error('entreprise')

      const { error: e2 } = await supabase.from('partenaires_magasins').insert({
        entreprise_id: ent.id, nom: f.nom, ville: f.ville,
        quartier: f.quartier || null, adresse: f.adresse || null,
        telephone: f.telephone, telephones: [f.telephone],
        description, statut: 'en_attente', actif: false,
      })
      if (e2) throw e2

      // Emails : notification à BatiShop + confirmation au candidat (best-effort)
      try {
        await fetch('/api/candidature-partenaire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: f.nom, email: f.email, telephone: f.telephone, ville: f.ville, quartier: f.quartier, type, metier: f.metier, message: f.message }),
        })
      } catch { /* l'email ne doit pas bloquer la candidature */ }

      setOk(true)
    } catch (er) {
      console.error(er)
      setErr("Une erreur est survenue. Réessayez, ou appelez-nous.")
      setEnvoi(false)
    }
  }

  if (ok) return (
    <div className="bg-white rounded-2xl border border-green-200 p-8 text-center max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <Check className="text-green-600" size={28} />
      </div>
      <h3 className="font-condensed font-bold text-xl text-acier mb-2">Candidature envoyée !</h3>
      <p className="text-gray-500 text-sm">Merci. Notre équipe étudie votre demande et vous recontacte au numéro indiqué pour activer votre espace partenaire.</p>
    </div>
  )

  const champStyle = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brique"
  const labelStyle = "text-xs font-semibold text-gray-500 block mb-1"

  return (
    <form onSubmit={soumettre} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button type="button" onClick={() => setType('quincaillerie')}
          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${type === 'quincaillerie' ? 'border-brique bg-brique/5' : 'border-gray-200'}`}>
          <Store size={20} className={type === 'quincaillerie' ? 'text-brique' : 'text-gray-400'} />
          <div>
            <div className="font-semibold text-sm text-acier">Quincaillerie</div>
            <div className="text-xs text-gray-400">Je vends des matériaux</div>
          </div>
        </button>
        <button type="button" onClick={() => setType('professionnel')}
          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${type === 'professionnel' ? 'border-brique bg-brique/5' : 'border-gray-200'}`}>
          <HardHat size={20} className={type === 'professionnel' ? 'text-brique' : 'text-gray-400'} />
          <div>
            <div className="font-semibold text-sm text-acier">Professionnel</div>
            <div className="text-xs text-gray-400">Maçon, plombier, électricien…</div>
          </div>
        </button>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">⚠️ {err}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelStyle}>{type === 'quincaillerie' ? 'Nom du magasin *' : 'Nom / Entreprise *'}</label>
          <input name="nom" value={f.nom} onChange={champ} className={champStyle} placeholder={type === 'quincaillerie' ? 'Quincaillerie du Wouri' : 'Votre nom ou raison sociale'} />
        </div>
        {type === 'professionnel' && (
          <div className="sm:col-span-2">
            <label className={labelStyle}>Métier</label>
            <input name="metier" value={f.metier} onChange={champ} className={champStyle} placeholder="Maçon, plombier, électricien, carreleur…" />
          </div>
        )}
        <div>
          <label className={labelStyle}>Ville *</label>
          <select name="ville" value={f.ville} onChange={champ} className={champStyle}>{VILLES.map(v => <option key={v}>{v}</option>)}</select>
        </div>
        <div>
          <label className={labelStyle}>Quartier</label>
          <input name="quartier" value={f.quartier} onChange={champ} className={champStyle} placeholder="Akwa, Bonamoussadi…" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelStyle}>Adresse (facultatif)</label>
          <input name="adresse" value={f.adresse} onChange={champ} className={champStyle} placeholder="Rue, point de repère" />
        </div>
        <div>
          <label className={labelStyle}>Téléphone *</label>
          <input name="telephone" value={f.telephone} onChange={champ} className={champStyle} placeholder="6XX XXX XXX" type="tel" />
        </div>
        <div>
          <label className={labelStyle}>Email (facultatif)</label>
          <input name="email" value={f.email} onChange={champ} className={champStyle} placeholder="vous@email.com" type="email" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelStyle}>Message (facultatif)</label>
          <textarea name="message" value={f.message} onChange={champ} rows={3} className={`${champStyle} resize-none`} placeholder="Parlez-nous de votre activité, vos produits…" />
        </div>
      </div>

      <button type="submit" disabled={envoi}
        className={`w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-colors ${envoi ? 'bg-gray-400' : 'bg-brique hover:bg-brique-dark'}`}>
        {envoi ? 'Envoi…' : <>Envoyer ma candidature <Send size={17} /></>}
      </button>
      <p className="text-xs text-gray-400 text-center mt-3">C'est gratuit et sans engagement. Nous vous recontactons pour activer votre espace.</p>
    </form>
  )
}
