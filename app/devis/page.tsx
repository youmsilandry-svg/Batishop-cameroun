'use client'
import { useState, useRef, useCallback } from 'react'
import { Plus, Trash2, Send, Package, MapPin, Calendar, Phone, User, Mail, Upload, X, FileText, Image, File, AlertCircle, Check } from 'lucide-react'
import { supabase, CATEGORIES, VILLES } from '../../lib/supabase'

const PRODUITS_CATEGORIE: Record<string, string[]> = {
  maconnerie: ['Ciment Portland CPA 42.5', 'Ciment CPJ 35', 'Parpaing creux 15x20x40', 'Parpaing creux 20x20x40', 'Fer à béton ø8mm', 'Fer à béton ø10mm', 'Fer à béton ø12mm', 'Fer à béton ø16mm', 'Sable de rivière', 'Gravier 15/25mm', 'Treillis soudé', 'Hourdis béton', 'Poutrelle treillis', 'Autre maçonnerie'],
  plomberie: ['Tuyau PVC 32mm', 'Tuyau PVC 63mm', 'Tuyau PVC 110mm', 'Robinet mitigeur lavabo', 'WC à poser', 'WC suspendu', 'Lavabo 60cm', 'Pompe immergée', 'Citerne 1000L', 'Chauffe-eau électrique', 'Autre plomberie'],
  electricite: ['Câble 1.5mm² 100m', 'Câble 2.5mm² 100m', 'Câble 6mm² 100m', 'Disjoncteur 16A', 'Disjoncteur différentiel 40A', 'Tableau électrique', 'Prise de courant', 'Interrupteur', 'Ampoule LED', 'Gaine ICTA 20mm', 'Autre électricité'],
  carrelage: ['Carrelage 30x30 gris', 'Carrelage 40x40 beige', 'Carrelage 60x60 beige', 'Carrelage 60x60 gris', 'Carrelage extérieur R11', 'Faïence murale 25x40', 'Parquet stratifié', 'Colle carrelage C1', 'Joint carrelage', 'Autre carrelage'],
  photovoltaique: ['Panneau solaire 200W', 'Panneau solaire 300W', 'Panneau solaire 400W', 'Batterie AGM 100Ah', 'Batterie GEL 200Ah', 'Batterie lithium 100Ah', 'Onduleur 1000W', 'Onduleur hybride 3000W', 'Régulateur MPPT 40A', 'Kit solaire complet', 'Autre solaire'],
  menuiserie: ['Porte intérieure bois', 'Porte extérieure aluminium', 'Porte blindée', 'Fenêtre PVC', 'Fenêtre aluminium', 'Volet roulant', 'Contreplaqué 15mm', 'Parquet massif', 'Serrure 3 points', 'Autre menuiserie'],
  couverture: ['Tôle ondulée', 'Bois de charpente', 'Tôle bac acier', 'Autre toiture'],
  outillage: ['Perceuse visseuse 18V', 'Meuleuse 125mm', 'Bétonnière 140L', 'Niveau laser', 'Autre outillage'],
  peinture: ['Peinture intérieure blanche 25L', 'Peinture façade 25L', 'Sous-couche universelle', 'Vernis bois', 'Enduit de lissage', 'Autre peinture'],
  assainissement: ['Fosse septique 3000L', 'Regard de visite', 'Tuyau drainage', 'Autre assainissement'],
}

const UNITES = ['sac', 'barre', 'pièce', 'm²', 'rouleau', 'bidon', 'kit', 'lot', 'm', 'boîte', 'palette']
const MAX_FICHIERS = 5
const MAX_TAILLE_MB = 10

type Ligne = { id: number; categorie: string; produit: string; quantite: string; unite: string }
type FichierLocal = { file: File; id: number; preview?: string; uploading?: boolean; url?: string }

function iconeType(type: string) {
  if (type.startsWith('image/')) return <Image size={16} className="text-blue-500"/>
  if (type === 'application/pdf') return <FileText size={16} className="text-red-500"/>
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) return <FileText size={16} className="text-green-500"/>
  return <File size={16} className="text-gray-500"/>
}

function formatTaille(bytes: number) {
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

export default function PageDevis() {
  const [lignes, setLignes] = useState<Ligne[]>([{ id: 1, categorie: '', produit: '', quantite: '', unite: 'sac' }])
  const [fichiers, setFichiers] = useState<FichierLocal[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [contact, setContact] = useState({ nom: '', telephone: '', email: '', ville: 'Douala', adresse: '', datelivraison: '', notes: '' })
  const [numeroDevis, setNumeroDevis] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [sending, setSending] = useState(false)
  const [etapeEnvoi, setEtapeEnvoi] = useState('')
  const [erreur, setErreur] = useState('')
  const [erreurFichier, setErreurFichier] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const ajouterLigne = () => setLignes(l => [...l, { id: Date.now(), categorie: '', produit: '', quantite: '', unite: 'sac' }])
  const supprimerLigne = (id: number) => { if (lignes.length > 1) setLignes(l => l.filter(x => x.id !== id)) }
  const updateLigne = (id: number, champ: keyof Ligne, val: string) =>
    setLignes(l => l.map(x => x.id === id ? { ...x, [champ]: val, ...(champ === 'categorie' ? { produit: '' } : {}) } : x))
  const handleContact = (e: React.ChangeEvent<any>) => setContact(f => ({ ...f, [e.target.name]: e.target.value }))

  const ajouterFichiers = useCallback((files: FileList | null) => {
    if (!files) return
    setErreurFichier('')
    const nouveaux: FichierLocal[] = []
    Array.from(files).forEach(file => {
      if (fichiers.length + nouveaux.length >= MAX_FICHIERS) { setErreurFichier(`Maximum ${MAX_FICHIERS} fichiers.`); return }
      if (file.size > MAX_TAILLE_MB * 1024 * 1024) { setErreurFichier(`"${file.name}" dépasse ${MAX_TAILLE_MB}Mo.`); return }
      const f: FichierLocal = { file, id: Date.now() + Math.random() }
      if (file.type.startsWith('image/')) f.preview = URL.createObjectURL(file)
      nouveaux.push(f)
    })
    setFichiers(prev => [...prev, ...nouveaux])
  }, [fichiers.length])

  const supprimerFichier = (id: number) => {
    setFichiers(prev => { const f = prev.find(x => x.id === id); if (f?.preview) URL.revokeObjectURL(f.preview); return prev.filter(x => x.id !== id) })
    setErreurFichier('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const lignesValides = lignes.filter(l => l.produit && l.quantite)
    if (lignesValides.length === 0) { setErreur('Ajoutez au moins un produit avec une quantité.'); return }
    if (!contact.nom || !contact.telephone) { setErreur('Nom et téléphone sont obligatoires.'); return }
    setErreur('')
    setSending(true)

    const numero = `DEV-${Date.now().toString(36).toUpperCase()}`

    // 1. Uploader les fichiers vers Supabase Storage
    const fichiersInfo: { nom: string; url: string; taille: number; type: string }[] = []
    if (fichiers.length > 0) {
      setEtapeEnvoi('Envoi des fichiers...')
      for (const f of fichiers) {
        try {
          const ext = f.file.name.split('.').pop()
          const chemin = `${numero}/${Date.now()}-${f.file.name}`
          const { data, error } = await supabase.storage
            .from('devis-fichiers')
            .upload(chemin, f.file, { contentType: f.file.type })
          if (!error && data) {
            const { data: urlData } = supabase.storage.from('devis-fichiers').getPublicUrl(chemin)
            fichiersInfo.push({ nom: f.file.name, url: urlData.publicUrl, taille: f.file.size, type: f.file.type })
          }
        } catch {}
      }
    }

    // 2. Sauvegarder le devis dans Supabase
    setEtapeEnvoi('Enregistrement du devis...')
    const { error } = await supabase.from('devis').insert({
      numero,
      client_nom: contact.nom,
      client_telephone: contact.telephone,
      client_email: contact.email || null,
      client_ville: contact.ville,
      client_adresse: contact.adresse || null,
      date_livraison: contact.datelivraison || null,
      notes: contact.notes || null,
      lignes: lignesValides,
      fichiers: fichiersInfo,
      statut: 'recu',
    })

    if (error) {
      setErreur('Erreur lors de l\'envoi. Veuillez réessayer ou nous appeler.')
      setSending(false)
      setEtapeEnvoi('')
      return
    }

    setNumeroDevis(numero)
    setSending(false)
    setEtapeEnvoi('')
    setEnvoye(true)
  }

  if (envoye) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <Check size={36} className="text-green-600"/>
      </div>
      <h1 className="font-condensed font-bold text-2xl text-acier mb-2">Demande reçue !</h1>
      <div className="bg-beton rounded-xl p-4 mb-4">
        <div className="text-xs text-gray-400 mb-1">Numéro de référence</div>
        <div className="font-mono font-bold text-lg text-acier">{numeroDevis}</div>
      </div>
      <p className="text-gray-600 mb-2 text-sm leading-relaxed">
        Votre demande de devis a bien été enregistrée. Notre équipe va préparer 
        votre devis avec les prix et vous contacter dans les <strong>72 heures</strong> au :
      </p>
      <div className="text-brique font-bold text-lg mb-2">{contact.telephone}</div>
      {contact.email && <div className="text-gray-500 text-sm mb-4">{contact.email}</div>}
      {fichiers.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 mb-4">
          ✅ {fichiers.length} fichier{fichiers.length > 1 ? 's' : ''} joint{fichiers.length > 1 ? 's' : ''} reçu{fichiers.length > 1 ? 's' : ''}
        </div>
      )}
      <p className="text-sm text-gray-400 mb-8">
        Pour toute urgence : <a href="tel:+237600000000" className="text-brique font-medium">+237 6XX XXX XXX</a>
      </p>
      <div className="flex gap-3 justify-center">
        <a href="/" className="btn-outline">Retour accueil</a>
        <button onClick={() => {
          setEnvoye(false); setNumeroDevis('')
          setLignes([{ id: 1, categorie: '', produit: '', quantite: '', unite: 'sac' }])
          setFichiers([]); setContact({ nom:'',telephone:'',email:'',ville:'Douala',adresse:'',datelivraison:'',notes:'' })
        }} className="btn-primary">Nouveau devis</button>
      </div>
    </div>
  )

  const lignesValides = lignes.filter(l => l.produit && l.quantite).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="inline-block bg-brique text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest">Devis Quantitatif</div>
        <h1 className="font-condensed font-bold text-3xl text-acier mb-2">Demande de devis</h1>
        <p className="text-gray-500 text-sm">Listez vos matériaux avec les quantités. Joignez vos plans ou fichiers si besoin. Réponse sous <strong>72h</strong> avec les prix.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Matériaux */}
            <div className="card p-5">
              <h2 className="font-condensed font-bold text-lg text-acier mb-4 flex items-center gap-2">
                <Package size={18} className="text-brique"/> Liste des matériaux
              </h2>
              <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-1">
                <div className="col-span-4 text-xs font-semibold text-gray-400 uppercase">Catégorie</div>
                <div className="col-span-4 text-xs font-semibold text-gray-400 uppercase">Produit</div>
                <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase">Quantité</div>
                <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase">Unité</div>
                <div className="col-span-1"/>
              </div>
              <div className="space-y-2">
                {lignes.map((ligne, idx) => (
                  <div key={ligne.id} className="bg-beton rounded-lg p-3 space-y-2">
                    <div className="text-xs text-gray-400 font-medium">Ligne {idx + 1}</div>
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 md:col-span-4">
                        <select value={ligne.categorie} onChange={e => updateLigne(ligne.id, 'categorie', e.target.value)} className="input-field text-sm bg-white">
                          <option value="">Catégorie...</option>
                          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                        </select>
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        {ligne.categorie ? (
                          <select value={ligne.produit} onChange={e => updateLigne(ligne.id, 'produit', e.target.value)} className="input-field text-sm bg-white">
                            <option value="">Choisir...</option>
                            {(PRODUITS_CATEGORIE[ligne.categorie] || []).map(p => <option key={p}>{p}</option>)}
                          </select>
                        ) : (
                          <input value={ligne.produit} onChange={e => updateLigne(ligne.id, 'produit', e.target.value)} placeholder="Nom du produit..." className="input-field text-sm bg-white"/>
                        )}
                      </div>
                      <div className="col-span-5 md:col-span-2">
                        <input type="number" min="1" value={ligne.quantite} onChange={e => updateLigne(ligne.id, 'quantite', e.target.value)} placeholder="Qté" className="input-field text-sm bg-white text-center"/>
                      </div>
                      <div className="col-span-6 md:col-span-1">
                        <select value={ligne.unite} onChange={e => updateLigne(ligne.id, 'unite', e.target.value)} className="input-field text-sm bg-white px-1">
                          {UNITES.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button type="button" onClick={() => supprimerLigne(ligne.id)} disabled={lignes.length === 1}
                          className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={ajouterLigne}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-brique hover:text-brique transition-colors">
                <Plus size={16}/> Ajouter un matériau
              </button>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>{lignesValides} produit{lignesValides !== 1 ? 's' : ''} renseigné{lignesValides !== 1 ? 's' : ''}</span>
                <span>Les prix seront indiqués dans le devis</span>
              </div>
            </div>

            {/* Upload fichiers */}
            <div className="card p-5">
              <h2 className="font-condensed font-bold text-lg text-acier mb-1 flex items-center gap-2">
                <Upload size={18} className="text-brique"/> Joindre des fichiers
                <span className="text-xs font-normal text-gray-400">(optionnel)</span>
              </h2>
              <p className="text-xs text-gray-500 mb-4">Plans, photos du chantier, liste Excel, métrés, devis existants... Max {MAX_FICHIERS} fichiers · {MAX_TAILLE_MB}Mo chacun</p>

              <div onClick={() => fichiers.length < MAX_FICHIERS && inputRef.current?.click()}
                onDrop={e => { e.preventDefault(); setDragOver(false); ajouterFichiers(e.dataTransfer.files) }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragOver ? 'border-brique bg-red-50 scale-[1.01]' :
                  fichiers.length >= MAX_FICHIERS ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' :
                  'border-gray-200 hover:border-brique hover:bg-beton cursor-pointer'}`}>
                <input ref={inputRef} type="file" multiple
                  accept="image/*,.pdf,.xls,.xlsx,.csv,.doc,.docx"
                  className="hidden" disabled={fichiers.length >= MAX_FICHIERS}
                  onChange={e => ajouterFichiers(e.target.files)}/>
                <Upload size={28} className={`mx-auto mb-2 ${dragOver ? 'text-brique' : 'text-gray-300'}`}/>
                <p className="text-sm font-medium text-acier mb-1">
                  {dragOver ? 'Déposez vos fichiers ici' : 'Cliquez ou glissez vos fichiers ici'}
                </p>
                <p className="text-xs text-gray-400">Photos (JPG, PNG) · PDF · Excel · Word</p>
                {fichiers.length >= MAX_FICHIERS && <p className="text-xs text-amber-600 mt-1 font-medium">Maximum {MAX_FICHIERS} fichiers atteint</p>}
              </div>

              {erreurFichier && (
                <div className="mt-2 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertCircle size={14} className="shrink-0"/> {erreurFichier}
                </div>
              )}

              {fichiers.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{fichiers.length} fichier{fichiers.length > 1 ? 's' : ''} joint{fichiers.length > 1 ? 's' : ''}</p>
                  {fichiers.map(f => (
                    <div key={f.id} className="flex items-center gap-3 bg-beton rounded-lg px-3 py-2.5 group">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {f.preview ? <img src={f.preview} alt="" className="w-full h-full object-cover rounded-lg"/> : iconeType(f.file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-acier truncate">{f.file.name}</div>
                        <div className="text-xs text-gray-400">{formatTaille(f.file.size)}</div>
                      </div>
                      <button type="button" onClick={() => supprimerFichier(f.id)}
                        className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                        <X size={14}/>
                      </button>
                    </div>
                  ))}
                  {fichiers.length < MAX_FICHIERS && (
                    <button type="button" onClick={() => inputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-1 py-2 text-xs text-brique hover:underline">
                      <Plus size={12}/> Ajouter d'autres ({MAX_FICHIERS - fichiers.length} restant{MAX_FICHIERS - fichiers.length > 1 ? 's' : ''})
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4 grid grid-cols-4 gap-2">
                {[['🖼️','Photos','JPG, PNG'],['📄','PDF','Plans, devis'],['📊','Excel','XLS, XLSX, CSV'],['📝','Word','DOC, DOCX']].map(([ico,l,d]) => (
                  <div key={l} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg">{ico}</div>
                    <div className="text-xs font-medium text-acier">{l}</div>
                    <div className="text-xs text-gray-400">{d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="font-medium text-sm text-blue-700 mb-1">💡 Comment ça marche ?</p>
              <ol className="space-y-1 text-xs text-blue-600 list-decimal list-inside">
                <li>Vous listez vos matériaux et quantités</li>
                <li>Nous préparons votre devis avec les prix unitaires et le total</li>
                <li>Vous recevez le devis sous <strong>72h</strong> par téléphone ou email</li>
                <li>Vous confirmez et nous livrons à la date souhaitée</li>
              </ol>
            </div>
          </div>

          {/* Contact + Livraison */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-condensed font-bold text-lg text-acier mb-4 flex items-center gap-2">
                <User size={18} className="text-brique"/> Vos coordonnées
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Nom complet *</label>
                  <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input required name="nom" value={contact.nom} onChange={handleContact} placeholder="Jean Dupont" className="input-field pl-8 text-sm"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Téléphone *</label>
                  <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input required name="telephone" value={contact.telephone} onChange={handleContact} placeholder="+237 6XX XXX XXX" className="input-field pl-8 text-sm"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
                  <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input name="email" type="email" value={contact.email} onChange={handleContact} placeholder="votre@email.com" className="input-field pl-8 text-sm"/>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-condensed font-bold text-lg text-acier mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-brique"/> Livraison
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Ville *</label>
                  <div className="relative"><MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <select required name="ville" value={contact.ville} onChange={handleContact} className="input-field pl-8 text-sm">
                      {VILLES.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Adresse / Quartier</label>
                  <input name="adresse" value={contact.adresse} onChange={handleContact} placeholder="Quartier, point repère..." className="input-field text-sm"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1 flex items-center gap-1">
                    <Calendar size={12}/> Date souhaitée
                  </label>
                  <input name="datelivraison" type="date" value={contact.datelivraison} onChange={handleContact}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} className="input-field text-sm"/>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Notes complémentaires</label>
              <textarea name="notes" value={contact.notes} onChange={handleContact} rows={3}
                className="input-field text-sm resize-none" placeholder="Accès au chantier, précisions..."/>
            </div>

            {erreur && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={15}/> {erreur}
              </div>
            )}

            <button type="submit" disabled={sending}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-base transition-colors ${sending ? 'bg-gray-400' : 'bg-brique hover:bg-brique-dark'}`}>
              {sending ? (
                <><span className="animate-spin">⏳</span> {etapeEnvoi || 'Envoi...'}</>
              ) : (
                <><Send size={18}/> Envoyer ma demande</>
              )}
            </button>

            {fichiers.length > 0 && !sending && (
              <p className="text-xs text-green-600 text-center">📎 {fichiers.length} fichier{fichiers.length > 1 ? 's' : ''} sera{fichiers.length > 1 ? 'ont' : ''} joint{fichiers.length > 1 ? 's' : ''}</p>
            )}
            <p className="text-xs text-gray-400 text-center">Réponse sous <strong>72h</strong> · Devis gratuit et sans engagement</p>
          </div>
        </div>
      </form>
    </div>
  )
}
