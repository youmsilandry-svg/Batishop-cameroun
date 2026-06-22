// =====================================================================
//  Coordonnées BatiShop — MODIFIE TOUT ICI (un seul endroit)
//  Téléphone, email, adresse, WhatsApp utilisés partout sur le site.
// =====================================================================

export const SITE = {
  nom: 'BatiShop Cameroun',

  // Téléphone
  tel: '+237 673644892',        // tel affiché à l'écran
  telLien: '+237673644892',        // tel pour les liens cliquables (format international, sans espaces)

  // WhatsApp (numéro sans + ni espaces, ex: 237600000000)
  whatsapp: '237673644892',

  // Emails
  email: 'contact@batishop-cameroun.com',
  emailPartenaires: 'partenaires@batishop-cameroun.com',

  // Adresse
  adresse: 'Carrefour-Tsinga, Yaounde, Cameroun',

  // Paiement mobile money — numéros où les CLIENTS envoient leur paiement
  momoNom: 'BatiShop Cameroun',     // nom du compte qui reçoit l'argent
  momoMtn: '+237 6XX XXX XXX',      // MTN Mobile Money
  momoOrange: '+237 6XX XXX XXX',   // Orange Money
}

// =====================================================================
//  PAYS — tout ce qui dépend du pays est ici.
//  Pour lancer un autre pays (ex. Côte d'Ivoire) : clone le projet et
//  remplace le bloc ci-dessous par celui en commentaire plus bas.
// =====================================================================
export const PAYS = {
  code: 'CM',
  nom: 'Cameroun',
  devise: 'XAF',        // XAF = Cameroun (CEMAC) · XOF = Côte d'Ivoire / Afrique de l'Ouest
  locale: 'fr-CM',      // utilisé pour le format des prix
  indicatif: '237',     // indicatif téléphonique
  fraisMomoPourcent: 2, // frais ajoutés au client s'il paie par mobile money (en %)
  villes: [
    'Douala', 'Yaoundé', 'Bafoussam', 'Garoua',
    'Bamenda', 'Maroua', 'Ngaoundéré', 'Bertoua',
    'Ebolowa', 'Kumba', 'Limbe', 'Kribi',
  ],
}

// ---------------------------------------------------------------------
//  CÔTE D'IVOIRE — pour le clone ivoirien, remplace le bloc PAYS ci-dessus
//  par celui-ci (et adapte SITE : nom, téléphone, momo, adresse) :
//
//  export const PAYS = {
//    code: 'CI',
//    nom: "Côte d'Ivoire",
//    devise: 'XOF',
//    locale: 'fr-CI',
//    indicatif: '225',
//    fraisMomoPourcent: 2,
//    villes: [
//      'Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro',
//      'Daloa', 'Korhogo', 'Man', 'Gagnoa',
//      'Abengourou', 'Divo', 'Grand-Bassam', 'Soubré',
//    ],
//  }
// ---------------------------------------------------------------------

// =====================================================================
//  LIVRAISON — calcul des frais à la distance
//  frais = base + (distance magasin→client en km) × parKm
// =====================================================================
export const LIVRAISON = {
  base: 1000,             // frais de base en FCFA (prise en charge minimale)
  parKm: 150,             // tarif au kilomètre en FCFA
  facteurRoute: 1.3,      // correction distance à vol d'oiseau -> route réelle
  gratuiteAuDessusDe: 0,  // seuil de livraison gratuite en FCFA (0 = désactivé)
  // Coordonnées du dépôt BatiShop (pour les livraisons "BatiShop")
  batishopLat: 0,         // ex: 3.8480
  batishopLng: 0,         // ex: 11.5021
}

// =====================================================================
//  MAINTENANCE — rendre le site inaccessible au public
//  Mettre MAINTENANCE à true puis pousser (git push) pour activer.
//  Toi et tes testeurs gardez l'accès en visitant une fois :
//    https://batishop-cameroun.com/?apercu=LE_CODE
//  (un cookie est posé, l'accès reste ouvert ~30 jours sur cet appareil)
// =====================================================================
export const MAINTENANCE = true          // true = site en maintenance pour le public
export const APERCU_CODE = 'batishop2025'  // code secret pour continuer à voir le site
