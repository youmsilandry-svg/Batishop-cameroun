'use client'
import { useState } from 'react'
import { Store, CheckCircle2, Loader2 } from 'lucide-react'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const VILLES = ['Douala','Yaoundé','Bafoussam','Garoua','Bamenda','Maroua','Ngaoundéré','Bertoua','Ebolowa','Kumba','Limbe','Kribi']

const post = (table:string, body:any, repr=false) => fetch(`${URL}/rest/v1/${table}`, {
  method:'POST',
  headers:{ 'apikey':KEY, 'Authorization':`Bearer ${KEY}`, 'Content-Type':'application/json', 'Prefer': repr?'return=representation':'return=minimal' },
  body: JSON.stringify(body),
})

type FormState = { nom:string; ville:string; quartier:string; adresse:string; telephone:string; email:string; horaires:string; description:string }
const VIDE: FormState = { nom:'',ville:'',quartier:'',adresse:'',telephone:'',email:'',horaires:'',description:'' }

export default function FormulaireCandidature() {
  const [form, setForm] = useState<FormState>(VIDE)
  const [envoi, setEnvoi] = useState(false)
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')

  const maj = (c: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [c]: e.target.value }))

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault(); setErreur('')
    if (!form.nom || !form.ville || !form.quartier || !form.telephone || !form.email) {
      setErreur('Merci de remplir les champs marqués d’un *.'); return
    }
    setEnvoi(true)
    try {
      // 1) Créer l'entreprise (candidature en attente)
      const resEnt = await post('entreprises', {
        nom: form.nom.trim(), email: form.email.trim(), telephone: form.telephone.trim(), statut: 'en_attente',
      }, true)
      if (!resEnt.ok) throw new Error(await resEnt.text().catch(()=>`Erreur ${resEnt.status}`))
      const ent = await resEnt.json()
      const entreprise_id = Array.isArray(ent) ? ent[0]?.id : ent?.id
      if (!entreprise_id) throw new Error('Création entreprise sans id')

      // 2) Créer la première boutique rattachée
      const resB = await post('partenaires_magasins', {
        entreprise_id,
        nom: form.nom.trim(),
        ville: form.ville, quartier: form.quartier.trim(),
        adresse: form.adresse.trim() || null,
        telephone: form.telephone.trim(),
        telephones: [form.telephone.trim()],
        horaires: form.horaires.trim() || null,
        description: form.description.trim() || null,
        statut: 'en_attente', actif: false,
      })
      if (!resB.ok) throw new Error(await resB.text().catch(()=>`Erreur ${resB.status}`))

      setSucces(true); setForm(VIDE)
    } catch (err:any) {
      setErreur('Impossible d’envoyer votre candidature pour le moment. Réessayez dans un instant.')
      console.error('Candidature:', err)
    } finally { setEnvoi(false) }
  }

  if (succes) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center max-w-xl mx-auto">
      <CheckCircle2 size={44} className="text-green-600 mx-auto mb-4" />
      <h3 className="font-condensed font-bold text-2xl text-acier mb-2">Candidature envoyée !</h3>
      <p className="text-gray-500 mb-6">Merci. Notre équipe vérifie votre quincaillerie et vous recontacte rapidement pour créer votre compte partenaire.</p>
      <button onClick={()=>setSucces(false)} className="text-brique font-semibold hover:underline">Envoyer une autre candidature</button>
    </div>
  )

  const champClass = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brique focus:ring-1 focus:ring-brique transition-colors'
  const labelClass = 'block text-xs font-semibold text-gray-500 mb-1.5'

  return (
    <form onSubmit={envoyer} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-brique/10 flex items-center justify-center shrink-0"><Store size={20} className="text-brique" /></div>
        <div>
          <h3 className="font-condensed font-bold text-xl text-acier leading-tight">Formulaire d’inscription</h3>
          <p className="text-xs text-gray-400">Gratuit · sans engagement · réponse sous 48 h</p>
        </div>
      </div>

      {erreur && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3.5 py-2.5 mb-4">⚠️ {erreur}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Nom du magasin *</label>
          <input className={champClass} value={form.nom} onChange={maj('nom')} placeholder="Ex : Quincaillerie du Wouri" />
        </div>
        <div>
          <label className={labelClass}>Ville *</label>
          <select className={champClass} value={form.ville} onChange={maj('ville')}>
            <option value="">Choisir…</option>{VILLES.map(v=><option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Quartier *</label>
          <input className={champClass} value={form.quartier} onChange={maj('quartier')} placeholder="Ex : Akwa, Bonabéri…" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Adresse / repère</label>
          <input className={champClass} value={form.adresse} onChange={maj('adresse')} placeholder="Ex : face station Total" />
        </div>
        <div>
          <label className={labelClass}>Téléphone *</label>
          <input className={champClass} value={form.telephone} onChange={maj('telephone')} placeholder="6XX XXX XXX" inputMode="tel" />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input className={champClass} type="email" value={form.email} onChange={maj('email')} placeholder="votre@email.com" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Horaires d’ouverture</label>
          <input className={champClass} value={form.horaires} onChange={maj('horaires')} placeholder="Ex : Lun–Sam 7h30–18h" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Quels produits vendez-vous ?</label>
          <textarea className={champClass} rows={3} value={form.description} onChange={maj('description')} placeholder="Ex : ciment, fer, plomberie…" />
        </div>
      </div>

      <button type="submit" disabled={envoi}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-brique hover:bg-brique-dark disabled:bg-gray-300 text-white font-bold px-6 py-3 rounded-lg transition-colors">
        {envoi ? (<><Loader2 size={18} className="animate-spin" /> Envoi en cours…</>) : 'Envoyer ma candidature'}
      </button>
      <p className="text-xs text-gray-400 text-center mt-3">En envoyant ce formulaire, vous acceptez d’être recontacté par BatiShop.</p>
    </form>
  )
}
