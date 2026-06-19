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
