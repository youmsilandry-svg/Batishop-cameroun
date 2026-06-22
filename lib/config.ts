// =====================================================================
//  Configuration multi-pays BatiShop (mono-repo)
//
//  Le pays actif est choisi par la variable d'environnement :
//      NEXT_PUBLIC_PAYS_CODE = 'CM'  (Cameroun, défaut)
//      NEXT_PUBLIC_PAYS_CODE = 'CI'  (Côte d'Ivoire)
//
//  -> Sur Vercel : un projet par pays, chacun avec sa propre valeur de
//     NEXT_PUBLIC_PAYS_CODE + ses propres clés Supabase.
//  -> Le MÊME code alimente les deux. Tu ne modifies plus ce fichier
//     pour changer de pays : tu changes juste la variable d'env.
//
//  Tout le reste du code continue d'importer SITE, PAYS, LIVRAISON,
//  MAINTENANCE, APERCU_CODE exactement comme avant.
// =====================================================================

type PaysCode = 'CM' | 'CI'

// Lit le code pays depuis l'env, défaut CM si absent/invalide.
const RAW_CODE = (process.env.NEXT_PUBLIC_PAYS_CODE || 'CM').toUpperCase()
const CODE: PaysCode = RAW_CODE === 'CI' ? 'CI' : 'CM'

// ---------------------------------------------------------------------
//  Définition de chaque pays : SITE + PAYS + LIVRAISON regroupés.
// ---------------------------------------------------------------------
const CONFIGS = {
  // =================================================================
  //  CAMEROUN
  // =================================================================
  CM: {
    site: {
      nom: 'BatiShop Cameroun',
      tel: '+237 673644892',
      telLien: '+237673644892',
      whatsapp: '237673644892',
      email: 'contact@batishop-cameroun.com',
      emailPartenaires: 'partenaires@batishop-cameroun.com',
      adresse: 'Carrefour-Tsinga, Yaounde, Cameroun',
      momoNom: 'BatiShop Cameroun',
      momoMtn: '+237 6XX XXX XXX',
      momoOrange: '+237 6XX XXX XXX',
    },
    pays: {
      code: 'CM',
      nom: 'Cameroun',
      devise: 'XAF',        // XAF = Cameroun (CEMAC)
      locale: 'fr-CM',
      indicatif: '237',
      fraisMomoPourcent: 2,
      villes: [
        'Douala', 'Yaoundé', 'Bafoussam', 'Garoua',
        'Bamenda', 'Maroua', 'Ngaoundéré', 'Bertoua',
        'Ebolowa', 'Kumba', 'Limbe', 'Kribi',
      ],
    },
    livraison: {
      base: 1000,
      parKm: 150,
      facteurRoute: 1.3,
      gratuiteAuDessusDe: 0,
      batishopLat: 0,   // ex: 3.8480
      batishopLng: 0,   // ex: 11.5021
    },
  },

  // =================================================================
  //  CÔTE D'IVOIRE
  // =================================================================
  CI: {
    site: {
      nom: "BatiShop Côte d'Ivoire",
      // TODO CI : remplace par les vrais numéros/adresse ivoiriens
      tel: '+225 0X XX XX XX XX',
      telLien: '+2250XXXXXXXXX',
      whatsapp: '2250XXXXXXXXX',
      email: 'contact@batishop-ci.com',          // TODO : domaine CI
      emailPartenaires: 'partenaires@batishop-ci.com',
      adresse: 'Abidjan, Côte d\'Ivoire',         // TODO : adresse exacte
      momoNom: "BatiShop Côte d'Ivoire",
      momoMtn: '+225 0X XX XX XX XX',             // MTN MoMo CI
      momoOrange: '+225 0X XX XX XX XX',          // Orange Money CI
    },
    pays: {
      code: 'CI',
      nom: "Côte d'Ivoire",
      devise: 'XOF',        // XOF = UEMOA (Afrique de l'Ouest)
      locale: 'fr-CI',
      indicatif: '225',
      fraisMomoPourcent: 2,
      villes: [
        'Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro',
        'Daloa', 'Korhogo', 'Man', 'Gagnoa',
        'Abengourou', 'Divo', 'Grand-Bassam', 'Soubré',
      ],
    },
    livraison: {
      base: 1000,
      parKm: 150,
      facteurRoute: 1.3,
      gratuiteAuDessusDe: 0,
      batishopLat: 0,   // ex: 5.3600 (Abidjan)
      batishopLng: 0,   // ex: -4.0083
    },
  },
} as const

// ---------------------------------------------------------------------
//  Exports — mêmes noms qu'avant, alimentés par le pays actif.
// ---------------------------------------------------------------------
const ACTIVE = CONFIGS[CODE]

export const SITE = ACTIVE.site
export const PAYS = ACTIVE.pays
export const LIVRAISON = ACTIVE.livraison

// =====================================================================
//  MAINTENANCE — rendre le site inaccessible au public
//  Pilotable par pays via l'env si besoin (NEXT_PUBLIC_MAINTENANCE),
//  sinon valeur par défaut ci-dessous.
//    https://<domaine>/?apercu=LE_CODE  pour garder l'accès (~30 jours)
// =====================================================================
export const MAINTENANCE =
  (process.env.NEXT_PUBLIC_MAINTENANCE ?? 'true') === 'true'
export const APERCU_CODE = process.env.NEXT_PUBLIC_APERCU_CODE || 'batishop2025'
