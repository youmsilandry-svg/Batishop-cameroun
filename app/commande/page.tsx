'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrix, supabase, VILLES } from '../../lib/supabase'
import { usePanier } from '../../lib/panier'

export default function PageCommande() {
  const { articles, total, viderPanier } = usePanier()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [form, setForm] = useState({
    nom: '', telephone: '', ville: 'Douala', adresse: '', notes: '',
    paiement: 'orange_money',
  })

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  if (articles.length === 0) { router.push('/panier'); return null }

  const livraison = total > 100000 ? 0 : 5000

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnvoi(true)
    try {
      const numero = `BS-${Date.now().toString(36).toUpperCase()}`
      const { error } = await supabase.from('commandes').insert({
        numero,
        client_nom: form.nom,
        client_telephone: form.telephone,
        client_ville: form.ville,
        client_adresse: form.adresse,
        notes: form.notes,
        articles: articles.map(a => ({
          produit_id: a.produit.id,
          nom: a.produit.nom,
          prix: a.produit.prix,
          quantite: a.quantite,
          unite: a.produit.unite,
        })),
        total: total + livraison,
        statut: 'en_attente',
        paiement_methode: form.paiement,
        paiement_statut: 'en_attente',
      })
      if (error) throw error
      viderPanier()
      router.push(`/commande/confirmation?num=${numero}`)
    } catch (err) {
      alert('Une erreur est survenue. Veuillez réessayer ou nous appeler.')
      setEnvoi(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-condensed font-bold text-2xl text-acier mb-6">Finaliser la commande</h1>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        {/* Formulaire */}
        <div className="flex-1 space-y-5">
          {/* Infos livraison */}
          <div className="card p-5">
            <h2 className="font-condensed font-bold text-lg text-acier mb-4">📍 Informations de livraison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Nom complet *</label>
                <input required name="nom" value={form.nom} onChange={handleChange}
                  placeholder="Jean Dupont" className="input-field"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Téléphone *</label>
                <input required name="telephone" value={form.telephone} onChange={handleChange}
                  placeholder="+237 6XX XXX XXX" className="input-field" type="tel"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Ville *</label>
                <select required name="ville" value={form.ville} onChange={handleChange} className="input-field">
                  {VILLES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Adresse / Quartier *</label>
                <input required name="adresse" value={form.adresse} onChange={handleChange}
                  placeholder="Quartier, rue, point de repère..." className="input-field"/>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Notes (facultatif)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                  placeholder="Instructions de livraison..." className="input-field resize-none"/>
              </div>
            </div>
          </div>

          {/* Paiement */}
          <div className="card p-5">
            <h2 className="font-condensed font-bold text-lg text-acier mb-4">💳 Mode de paiement</h2>
            <div className="space-y-2">
              {[
                { id: 'orange_money', label: '📱 Orange Money', desc: 'Paiement instantané par Orange Money' },
                { id: 'mtn_momo', label: '📱 MTN Mobile Money', desc: 'Paiement instantané par MTN MoMo' },
                { id: 'carte', label: '💳 Carte bancaire', desc: 'Visa / Mastercard — paiement sécurisé' },
                { id: 'livraison', label: '💵 Paiement à la livraison', desc: 'Payez en cash à la réception' },
              ].map(p => (
                <label key={p.id}
                  className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
                    form.paiement === p.id ? 'border-brique bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="paiement" value={p.id}
                    checked={form.paiement === p.id} onChange={handleChange} className="mt-0.5 accent-brique"/>
                  <div>
                    <div className="font-medium text-sm">{p.label}</div>
                    <div className="text-xs text-gray-500">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="lg:w-80 shrink-0">
          <div className="card p-5 sticky top-24">
            <h2 className="font-condensed font-bold text-lg text-acier mb-3">Votre commande</h2>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {articles.map(({ produit, quantite }) => (
                <div key={produit.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate mr-2">{produit.nom} <span className="text-gray-400">×{quantite}</span></span>
                  <span className="font-medium shrink-0">{formatPrix(produit.prix * quantite)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span><span>{formatPrix(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span className={livraison === 0 ? 'text-green-600' : ''}>{livraison === 0 ? 'Gratuite' : formatPrix(livraison)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>TOTAL</span>
                <span className="text-brique">{formatPrix(total + livraison)}</span>
              </div>
            </div>
            <button type="submit" disabled={envoi}
              className={`w-full mt-4 py-3 rounded font-bold text-white transition-colors ${envoi ? 'bg-gray-400' : 'bg-brique hover:bg-brique-dark'}`}>
              {envoi ? '⏳ Envoi en cours...' : '✓ Confirmer la commande'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              En commandant, vous acceptez nos <a href="/aide/cgv" className="underline">CGV</a>
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
