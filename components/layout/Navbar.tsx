'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, User, Heart, Search, Menu, X, Phone, ChevronRight, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const MENU_CATEGORIES = [
  {
    id: 'maconnerie', label: 'Maçonnerie & Gros oeuvre',
    sous: ['Ciment & Mortier', 'Parpaings & Briques', 'Fer à béton', 'Sable & Gravier', 'Coffrages', 'Enduits & Crépis', 'Colle à carrelage', 'Hourdis & Poutrelles']
  },
  {
    id: 'plomberie', label: 'Plomberie & Sanitaire',
    sous: ['Tuyaux & Raccords PVC', 'Robinets & Mitigeurs', 'WC & Lavabos', 'Douches & Baignoires', 'Pompes à eau', 'Chauffe-eau', 'Réservoirs & Citernes', 'Accessoires sanitaires']
  },
  {
    id: 'electricite', label: 'Électricité & Éclairage',
    sous: ['Câbles & Fils électriques', 'Disjoncteurs & Tableaux', 'Prises & Interrupteurs', 'Éclairage LED', 'Gaines & Conduits', 'Onduleurs & Groupes', 'Compteurs & Accessoires', 'Alarmes & Sécurité']
  },
  {
    id: 'photovoltaique', label: 'Énergie Solaire',
    sous: ['Panneaux Solaires', 'Batteries & Stockage', 'Onduleurs Solaires', 'Régulateurs de charge', 'Kits Solaires Complets', 'Câbles & Connecteurs', 'Structures & Fixations', 'Éclairage Solaire']
  },
  {
    id: 'carrelage', label: 'Carrelage & Revêtement',
    sous: ['Carrelage Sol intérieur', 'Carrelage Mural', 'Carrelage Extérieur', 'Mosaïque & Décor', 'Parquet & Stratifié', 'Colle & Joint carrelage', 'Plinthes & Profils', 'Pierre Naturelle']
  },
  {
    id: 'menuiserie', label: 'Menuiserie & Bois',
    sous: ['Portes Intérieures', 'Portes Extérieures', 'Fenêtres & Volets', 'Bois de Construction', 'Contreplaqué & OSB', 'Quincaillerie', 'Parquet Bois massif', 'Escaliers & Rampes']
  },
  {
    id: 'outillage', label: 'Outillage & Machines',
    sous: ['Perceuses & Visseuses', 'Meuleuses & Scies', 'Bétonnières', 'Niveaux & Mesure', 'Outils Manuels', 'Compresseurs', 'Échafaudages', 'EPI & Sécurité']
  },
  {
    id: 'peinture', label: 'Peinture & Décoration',
    sous: ['Peinture Intérieure', 'Peinture Extérieure', 'Sous-couches & Primaires', 'Vernis & Lasures', 'Enduits Décoratifs', 'Pinceaux & Rouleaux', 'Bâches & Protection', 'Papier Peint']
  },
]

export function Navbar() {
  const [recherche, setRecherche] = useState('')
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [dropdownOuvert, setDropdownOuvert] = useState(false)
  const [categorieActive, setCategorieActive] = useState(MENU_CATEGORIES[0])
  const [nbArticles, setNbArticles] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [compteOuvert, setCompteOuvert] = useState(false)
  const compteRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const dropdownRef = useRef(null)

  useEffect(() => {
    let actif = true
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!actif) return
      setUser(user)
      if (user) {
        const { data: prof } = await supabase.from('profils').select('nom').eq('id', user.id).maybeSingle()
        setDisplayName(prof?.nom || user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'Mon compte'))
      } else {
        setDisplayName('')
      }
    }
    charger()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
      if (session?.user) charger(); else setDisplayName('')
    })
    return () => { actif = false; sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (compteRef.current && !compteRef.current.contains(e.target as Node)) setCompteOuvert(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const deconnexion = async () => {
    await supabase.auth.signOut()
    setCompteOuvert(false)
    router.push('/')
  }

  useEffect(() => {
    const update = () => {
      const data = localStorage.getItem('batishop_panier')
      if (data) {
        const items = JSON.parse(data)
        setNbArticles(items.reduce((s, a) => s + a.quantite, 0))
      } else {
        setNbArticles(0)
      }
    }
    update()
    window.addEventListener('storage', update)
    window.addEventListener('panier-updated', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('panier-updated', update)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOuvert(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRecherche = (e) => {
    e.preventDefault()
    if (recherche.trim()) {
      router.push(`/produits?q=${encodeURIComponent(recherche.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-acier text-white text-xs py-1.5 px-4 flex justify-between items-center">
        <span>📍 Livraison dans tout le Cameroun sous 48h</span>
        <a href="tel:+237600000000" className="flex items-center gap-1 text-or hover:underline">
          <Phone size={12}/> +237 6XX XXX XXX
        </a>
      </div>

      <nav className="bg-white border-b-4 border-brique px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/" className="font-condensed font-bold text-xl text-acier shrink-0">
            Bati<span className="text-brique">Shop</span> CM
          </Link>

          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOuvert(!dropdownOuvert)}
              className="flex items-center gap-2 bg-brique text-white px-4 py-2 rounded font-bold text-sm hover:bg-brique-dark transition-colors">
              <Menu size={16}/>
              Produits
              <ChevronDown size={14} className={`transition-transform ${dropdownOuvert ? 'rotate-180' : ''}`}/>
            </button>

            {dropdownOuvert && (
              <div className="absolute top-full left-0 mt-1 flex shadow-2xl border border-gray-200 rounded-lg z-50 overflow-hidden bg-white" style={{width: '680px'}}>
                {/* Colonne gauche */}
                <div className="w-64 border-r border-gray-100 overflow-y-auto" style={{maxHeight: '500px'}}>
                  {MENU_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onMouseEnter={() => setCategorieActive(cat)}
                      onClick={() => { router.push(`/produits?categorie=${cat.id}`); setDropdownOuvert(false) }}
                      className={`w-full flex items-center justify-between px-5 py-3.5 text-left border-b border-gray-50 transition-colors ${
                        categorieActive.id === cat.id
                          ? 'border-l-2 border-l-brique text-brique bg-gray-50 font-semibold'
                          : 'text-acier hover:bg-gray-50 border-l-2 border-l-transparent'
                      }`}>
                      <span className="text-sm">{cat.label}</span>
                      <ChevronRight size={14} className={categorieActive.id === cat.id ? 'text-brique' : 'text-gray-300'}/>
                    </button>
                  ))}
                </div>

                {/* Colonne droite */}
                <div className="flex-1 p-5 bg-white">
                  <h3 className="font-condensed font-bold text-acier text-base mb-4 pb-2 border-b border-gray-100">
                    {categorieActive.label}
                  </h3>
                  <div className="grid grid-cols-2 gap-1">
                    {categorieActive.sous.map((sous) => (
                      <Link
                        key={sous}
                        href={`/produits?categorie=${categorieActive.id}`}
                        onClick={() => setDropdownOuvert(false)}
                        className="flex items-center gap-2 py-2 px-2 text-sm text-gray-600 hover:text-brique rounded hover:bg-gray-50 transition-colors">
                        <ChevronRight size={12} className="text-gray-300 shrink-0"/>
                        {sous}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Link
                      href={`/produits?categorie=${categorieActive.id}`}
                      onClick={() => setDropdownOuvert(false)}
                      className="inline-flex items-center gap-1 text-sm font-bold text-brique hover:underline">
                      Voir tous les produits — {categorieActive.label} →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleRecherche} className="hidden md:flex flex-1 max-w-xl">
            <input
              type="text"
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Chercher ciment, tuyaux, panneaux solaires..."
              className="flex-1 border-2 border-r-0 border-gray-200 rounded-l px-4 py-2 text-sm focus:outline-none focus:border-brique"
            />
            <button type="submit" className="bg-brique text-white px-4 rounded-r hover:bg-brique-dark">
              <Search size={18}/>
            </button>
          </form>

          <div className="flex items-center gap-3 ml-auto">
            {user ? (
              <div ref={compteRef} className="hidden md:block relative">
                <button onClick={() => setCompteOuvert(o => !o)} className="flex flex-col items-center text-xs text-acier hover:text-brique">
                  <User size={20}/>
                  <span className="max-w-[90px] truncate">{displayName || 'Mon compte'}</span>
                </button>
                {compteOuvert && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <div className="text-xs text-gray-400">Connecté en tant que</div>
                      <div className="text-sm font-semibold text-acier truncate">{displayName}</div>
                    </div>
                    <Link href="/compte/dashboard" onClick={() => setCompteOuvert(false)} className="block px-4 py-2.5 text-sm text-acier hover:bg-beton">Mon compte</Link>
                    <Link href="/compte/commandes" onClick={() => setCompteOuvert(false)} className="block px-4 py-2.5 text-sm text-acier hover:bg-beton">Mes commandes</Link>
                    <Link href="/compte/favoris" onClick={() => setCompteOuvert(false)} className="block px-4 py-2.5 text-sm text-acier hover:bg-beton">Mes favoris</Link>
                    <Link href="/compte/profil" onClick={() => setCompteOuvert(false)} className="block px-4 py-2.5 text-sm text-acier hover:bg-beton">Mon profil</Link>
                    <button onClick={deconnexion} className="block w-full text-left px-4 py-2.5 text-sm text-brique hover:bg-beton border-t border-gray-50">Déconnexion</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/compte" className="hidden md:flex flex-col items-center text-xs text-acier hover:text-brique">
                <User size={20}/> Compte
              </Link>
            )}
            <Link href="/panier" className="flex flex-col items-center text-xs text-brique relative">
              <ShoppingCart size={22}/>
              {nbArticles > 0 && (
                <span className="absolute -top-1 -right-1 bg-brique text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {nbArticles > 9 ? '9+' : nbArticles}
                </span>
              )}
              <span>Panier</span>
            </Link>
            <button onClick={() => setMenuOuvert(!menuOuvert)} className="md:hidden p-1">
              {menuOuvert ? <X size={24}/> : <Menu size={24}/>}
            </button>
          </div>
        </div>

        <form onSubmit={handleRecherche} className="md:hidden mt-2 flex">
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Chercher un produit..."
            className="flex-1 border-2 border-r-0 border-gray-200 rounded-l px-3 py-2 text-sm focus:outline-none focus:border-brique"
          />
          <button type="submit" className="bg-brique text-white px-3 rounded-r">
            <Search size={16}/>
          </button>
        </form>
      </nav>

      {menuOuvert && (
        <div className="md:hidden bg-white border-t shadow-lg overflow-y-auto" style={{maxHeight: '70vh'}}>
          {MENU_CATEGORIES.map(c => (
            <div key={c.id}>
              <Link href={`/produits?categorie=${c.id}`}
                onClick={() => setMenuOuvert(false)}
                className="flex items-center justify-between px-4 py-3 text-sm font-bold text-acier hover:bg-beton border-b border-gray-200">
                {c.label}
                <ChevronRight size={14} className="text-gray-400"/>
              </Link>
              {c.sous.map(s => (
                <Link key={s}
                  href={`/produits?categorie=${c.id}`}
                  onClick={() => setMenuOuvert(false)}
                  className="flex items-center gap-2 pl-8 pr-4 py-2 text-xs text-gray-500 hover:text-brique border-b border-gray-50">
                  <ChevronRight size={10} className="shrink-0"/> {s}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
