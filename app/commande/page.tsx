'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Store, MapPin, Truck, Package, Crosshair, Navigation } from 'lucide-react'
import { formatPrix, supabase, VILLES } from '../../lib/supabase'
import { usePanier } from '../../lib/panier'

export default function PageCommande() {
  const { parPartenaire, total, viderPanier } = usePanier()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [modes, setModes] = useState<Record<string, 'retrait' | 'livraison'>>({})
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', ville: 'Douala', adresse: '', notes: '', paiement: 'reception' as 'reception' | 'en_ligne', latitude: '', longitude: '' })
  const [geo, setGeo] = useState<'idle' | 'asking' | 'ok' | 'refused'>('idle')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: prof } = await supabase.from('profils').select('*').eq('id', user.id).maybeSingle()
      setForm(f => ({
        ...f,
        nom: f.nom || prof?.nom || '',
        telephone: f.telephone || prof?.telephone || '',
        email: f.email || user.email || '',
        ville: prof?.ville || f.ville,
        adresse: f.adresse || prof?.adresse || '',
      }))
    })()
  }, [])

  const maPosition = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setGeo('refused'); return }
    setGeo('asking')
    navigator.geolocation.getCurrentPosition(
      p => { setForm(f => ({ ...f, latitude: p.coords.latitude.toFixed(6), longitude: p.coords.longitude.toFixed(6) })); setGeo('ok') },
      () => setGeo('refused'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  if (!mounted) return null
  if (parPartenaire.length === 0) { router.push('/panier'); return null }

  const modeDe = (g: any) => modes[g.point_vente_id] || 'retrait'
  const fraisDe = (g: any) => modeDe(g) === 'livraison' ? (g.frais_livraison_base || 0) : 0
  const totalLivraison = parPartenaire.reduce((s, g) => s + fraisDe(g), 0)
  const grandTotal = total + totalLivraison
  const ilYaLivraison = parPartenaire.some(g => modeDe(g) === 'livraison')

  const setMode = (id: string, m: 'retrait' | 'livraison') => setModes(s => ({ ...s, [id]: m }))
  const champ = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault(); setErreur('')
    if (!form.nom || !form.telephone) { setErreur('Nom et téléphone obligatoires.'); return }
    if (ilYaLivraison && !form.adresse) { setErreur('Adresse de livraison obligatoire (vous avez choisi la livraison).'); return }

    setEnvoi(true)
    try {
      const numero = `BS-${Date.now().toString(36).toUpperCase()}`
      const articlesSnapshot = parPartenaire.flatMap(g => g.lignes.map(a => ({
        produit_id: a.produit.id, nom: a.produit.nom, prix: a.prix_unitaire,
        quantite: a.quantite, unite: a.produit.unite,
        partenaire_nom: g.partenaire_nom, point_vente_id: g.point_vente_id,
      })))

      const lat = parseFloat(form.latitude), lng = parseFloat(form.longitude)
      const gpsOk = !isNaN(lat) && !isNaN(lng)
      // 1) Commande globale — id généré côté client (pas de relecture nécessaire)
      const cmdId = crypto.randomUUID()
      const { error: e1 } = await supabase.from('commandes').insert({
        id: cmdId,
        numero, user_id: userId, client_nom: form.nom, client_telephone: form.telephone, client_email: form.email || null,
        client_ville: form.ville, client_adresse: form.adresse || '—', notes: form.notes || null,
        client_latitude: gpsOk ? lat : null, client_longitude: gpsOk ? lng : null,
        articles: articlesSnapshot,
        total_produits: total, total_livraison: totalLivraison, total: grandTotal,
        statut: 'en_attente', paiement_methode: form.paiement, paiement_statut: 'en_attente',
      })
      if (e1) throw e1

      // 2) Sous-commandes + lignes (1 par partenaire)
      for (let i = 0; i < parPartenaire.length; i++) {
        const g = parPartenaire[i]
        const mode = modeDe(g)
        const frais = fraisDe(g)
        const scId = crypto.randomUUID()
        const { error: e2 } = await supabase.from('sous_commandes').insert({
          id: scId,
          commande_id: cmdId, point_vente_id: g.point_vente_id === 'batishop' ? null : g.point_vente_id,
          numero: `${numero}-${String.fromCharCode(65 + i)}`,
          mode, adresse_livraison: mode === 'livraison' ? (form.adresse + (gpsOk ? ` — 📍 https://maps.google.com/?q=${lat},${lng}` : '')) : null,
          frais_livraison: frais, sous_total: g.sousTotal, total: g.sousTotal + frais,
          statut: 'en_attente', paiement_statut: 'en_attente',
        })
        if (e2) throw e2

        const lignes = g.lignes.map(a => ({
          sous_commande_id: scId, produit_id: a.produit.id, nom: a.produit.nom,
          prix_unitaire: a.prix_unitaire, quantite: a.quantite, unite: a.produit.unite,
          sous_total: a.prix_unitaire * a.quantite,
        }))
        const { error: e3 } = await supabase.from('commande_lignes').insert(lignes)
        if (e3) throw e3
      }

      // Sauvegarde locale pour l'impression sur la page de confirmation
      try {
        localStorage.setItem('batishop_last_order', JSON.stringify({
          numero, nom: form.nom, total: grandTotal, totalLivraison,
          articles: articlesSnapshot, paiement: form.paiement,
          ville: form.ville, adresse: form.adresse, date: new Date().toISOString(),
        }))
      } catch {}

      // Email de confirmation au client (si email fourni) — sans bloquer la suite
      if (form.email) {
        fetch('/api/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email, nom: form.nom, numero,
            total: grandTotal, totalLivraison,
            articles: articlesSnapshot, paiement: form.paiement,
            ville: form.ville, adresse: form.adresse,
          }),
        }).catch(() => {})
      }

      viderPanier()
      router.push(`/commande/confirmation?num=${numero}`)
    } catch (err) {
      console.error(err)
      setErreur('Une erreur est survenue. Réessayez ou appelez-nous.')
      setEnvoi(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-condensed font-bold text-2xl text-acier mb-6">Finaliser la commande</h1>
      {erreur && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">⚠️ {erreur}</div>}

      <form onSubmit={soumettre} className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-5">
          {/* Coordonnées client */}
          <div className="card p-5">
            <h2 className="font-condensed font-bold text-lg text-acier mb-4">📇 Vos coordonnées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Nom complet *</label>
                <input required name="nom" value={form.nom} onChange={champ} placeholder="Jean Dupont" className="input-field"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Téléphone *</label>
                <input required name="telephone" value={form.telephone} onChange={champ} placeholder="6XX XXX XXX" className="input-field" type="tel"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Email (facultatif)</label>
                <input name="email" value={form.email} onChange={champ} placeholder="vous@email.com" className="input-field" type="email"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Ville</label>
                <select name="ville" value={form.ville} onChange={champ} className="input-field">{VILLES.map(v => <option key={v}>{v}</option>)}</select>
              </div>
              {ilYaLivraison && (
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Adresse de livraison *</label>
                  <input name="adresse" value={form.adresse} onChange={champ} placeholder="Quartier, rue, point de repère…" className="input-field"/>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <button type="button" onClick={maPosition}
                      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${form.latitude ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-brique hover:text-brique'}`}>
                      <Crosshair size={15}/> {geo === 'asking' ? 'Localisation…' : form.latitude ? 'Position captée ✓' : 'Utiliser ma position actuelle'}
                    </button>
                    {form.latitude && (
                      <a href={`https://maps.google.com/?q=${form.latitude},${form.longitude}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-brique font-medium"><Navigation size={12}/> Vérifier sur la carte</a>
                    )}
                  </div>
                  {geo === 'refused' && <p className="text-xs text-amber-600 mt-1">Position indisponible — indiquez bien l'adresse et un point de repère ci-dessus.</p>}
                  <p className="text-xs text-gray-400 mt-1">Votre position GPS aide le livreur à vous trouver précisément (en plus de l'adresse).</p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Notes (facultatif)</label>
                <textarea name="notes" value={form.notes} onChange={champ} rows={2} className="input-field resize-none"/>
              </div>
            </div>
          </div>

          {/* Par boutique : retrait ou livraison */}
          {parPartenaire.map(g => (
            <div key={g.point_vente_id} className="card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-beton border-b border-gray-100">
                <Store size={16} className="text-acier"/>
                <span className="font-bold text-sm text-acier">{g.partenaire_nom}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11}/> {g.ville}</span>
                <span className="ml-auto font-bold text-sm text-acier">{formatPrix(g.sousTotal)}</span>
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-500 mb-2">{g.lignes.map(l => `${l.produit.nom} ×${l.quantite}`).join(' · ')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${modeDe(g) === 'retrait' ? 'border-brique bg-red-50' : 'border-gray-200'}`}>
                    <input type="radio" name={`mode-${g.point_vente_id}`} checked={modeDe(g) === 'retrait'} onChange={() => setMode(g.point_vente_id, 'retrait')} className="mt-0.5 accent-brique"/>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-1"><Package size={14}/> Retrait en magasin</div>
                      <div className="text-xs text-gray-500">À {g.ville} · gratuit</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-2 p-3 border rounded-lg transition-colors ${!g.livre ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${modeDe(g) === 'livraison' ? 'border-brique bg-red-50' : 'border-gray-200'}`}>
                    <input type="radio" name={`mode-${g.point_vente_id}`} disabled={!g.livre} checked={modeDe(g) === 'livraison'} onChange={() => setMode(g.point_vente_id, 'livraison')} className="mt-0.5 accent-brique"/>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-1"><Truck size={14}/> Livraison</div>
                      <div className="text-xs text-gray-500">{g.livre ? (g.frais_livraison_base ? formatPrix(g.frais_livraison_base) : 'gratuite') : 'non disponible'}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ))}

          {/* Paiement */}
          <div className="card p-5">
            <h2 className="font-condensed font-bold text-lg text-acier mb-4">💳 Mode de paiement</h2>
            <div className="space-y-2">
              {[
                { id: 'en_ligne', label: '📱 Paiement en ligne', desc: 'Orange Money / MTN MoMo à la commande' },
                { id: 'reception', label: '🏪 Paiement en magasin / à la réception', desc: 'En espèces au retrait en magasin ou à la livraison' },
              ].map(p => (
                <label key={p.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.paiement === p.id ? 'border-brique bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="paiement" value={p.id} checked={form.paiement === p.id} onChange={champ} className="mt-0.5 accent-brique"/>
                  <div><div className="font-medium text-sm">{p.label}</div><div className="text-xs text-gray-500">{p.desc}</div></div>
                </label>
              ))}
            </div>
            {form.paiement === 'en_ligne' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                Le paiement en ligne (Campay) arrive bientôt. Pour l'instant, votre commande est enregistrée et nous vous contactons pour le règlement.
              </p>
            )}
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="lg:w-80 shrink-0">
          <div className="card p-5 sticky top-24">
            <h2 className="font-condensed font-bold text-lg text-acier mb-3">Récapitulatif</h2>
            <div className="space-y-2 mb-3 text-sm">
              {parPartenaire.map(g => (
                <div key={g.point_vente_id} className="flex justify-between">
                  <span className="text-gray-600 truncate mr-2">{g.partenaire_nom} <span className="text-gray-400">({modeDe(g) === 'retrait' ? 'retrait' : 'livraison'})</span></span>
                  <span className="font-medium shrink-0">{formatPrix(g.sousTotal + fraisDe(g))}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>Produits</span><span>{formatPrix(total)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Livraison</span><span>{totalLivraison === 0 ? 'gratuite' : formatPrix(totalLivraison)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t"><span>TOTAL</span><span className="text-brique">{formatPrix(grandTotal)}</span></div>
            </div>
            <button type="submit" disabled={envoi}
              className={`w-full mt-4 py-3 rounded font-bold text-white transition-colors ${envoi ? 'bg-gray-400' : 'bg-brique hover:bg-brique-dark'}`}>
              {envoi ? '⏳ Envoi…' : '✓ Confirmer la commande'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
