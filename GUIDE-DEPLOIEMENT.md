# 🚀 Guide de déploiement BatiShop Cameroun
## Mise en ligne complète — pas à pas, sans développeur

---

## ÉTAPE 1 — Créer la base de données (Supabase)
**Durée : 15 minutes | Gratuit**

1. Va sur https://supabase.com et clique "Start your project"
2. Crée un compte avec ton email
3. Clique "New Project" → donne un nom : `batishop`
4. Choisis un mot de passe fort pour la base → copie-le quelque part
5. Choisis la région : **EU West** (la plus proche du Cameroun)
6. Attends 2 minutes que le projet se crée

### Créer les tables :
7. Dans le menu gauche → clique "SQL Editor"
8. Ouvre le fichier `supabase-setup.sql` de ce projet
9. Copie tout le contenu → colle dans l'éditeur SQL → clique "Run"
10. Tu verras : "Success. No rows returned" → c'est bon !

### Récupérer tes clés API :
11. Dans le menu gauche → "Settings" → "API"
12. Copie :
    - **Project URL** → ressemble à `https://xxxxx.supabase.co`
    - **anon public key** → longue chaîne de lettres
    (Garde ces 2 valeurs, tu en auras besoin à l'étape 3)

---

## ÉTAPE 2 — Préparer le code (GitHub)
**Durée : 10 minutes | Gratuit**

1. Va sur https://github.com → crée un compte si tu n'en as pas
2. Clique le "+" en haut à droite → "New repository"
3. Nom : `batishop-cameroun` → clique "Create repository"
4. Sur ton ordinateur, installe Git : https://git-scm.com/downloads
5. Installe Node.js (version 18+) : https://nodejs.org
6. Ouvre un terminal (invite de commandes) dans le dossier `batishop`
7. Tape ces commandes une par une :

```bash
git init
git add .
git commit -m "Premier commit BatiShop"
git branch -M main
git remote add origin https://github.com/TON_NOM/batishop-cameroun.git
git push -u origin main
```

---

## ÉTAPE 3 — Déployer sur Vercel (hébergement gratuit)
**Durée : 5 minutes | Gratuit**

1. Va sur https://vercel.com → "Sign up" avec ton compte GitHub
2. Clique "New Project"
3. Sélectionne ton dépôt `batishop-cameroun`
4. Clique "Import"
5. Dans "Environment Variables", ajoute ces 3 variables :

| Nom | Valeur |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ton URL Supabase de l'étape 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ta clé anon Supabase |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | un mot de passe de ton choix |

6. Clique "Deploy"
7. Attends 2-3 minutes → Vercel te donne une URL du type `batishop.vercel.app`
8. **Ton site est en ligne !** 🎉

---

## ÉTAPE 4 — Acheter un nom de domaine (optionnel)
**Durée : 10 minutes | ~15 000 FCFA/an**

### Option A — Domaine international (.com) :
1. Va sur https://namecheap.com
2. Recherche `batishop.com` ou `batishopcameroun.com`
3. Achète (~8 000 FCFA/an)
4. Dans Vercel : Settings → Domains → Add Domain → entre ton domaine
5. Chez Namecheap : copie les DNS que Vercel te donne → configure-les

### Option B — Domaine camerounais (.cm) :
1. Contacte Camtel directement : https://www.camtel.cm
2. Ou passe par un revendeur local

---

## ÉTAPE 5 — Accéder à l'administration
**Ton back-office est à : https://ton-site.vercel.app/admin**

1. Entre le mot de passe admin que tu as défini à l'étape 3
2. Tu peux :
   - Voir le tableau de bord (commandes, chiffre d'affaires)
   - Ajouter / modifier / supprimer des produits
   - Gérer les commandes (confirmer, mettre en livraison, etc.)

---

## ÉTAPE 6 — Intégrer Orange Money / MTN MoMo (paiement automatique)
**Pour commencer, le paiement à la livraison suffit !**
Quand tu veux automatiser :

1. Crée un compte sur https://campay.net (solution camerounaise)
2. Récupère ton `CAMPAY_USERNAME` et `CAMPAY_PASSWORD`
3. Dans Vercel → Settings → Environment Variables → ajoute ces 2 variables
4. L'intégration est déjà préparée dans le code

---

## Résumé des coûts

| Poste | Coût |
|-------|------|
| Supabase (base de données) | **Gratuit** jusqu'à 500MB |
| Vercel (hébergement) | **Gratuit** jusqu'à 100GB/mois |
| Domaine .com | ~8 000 FCFA/an |
| Domaine .cm | ~15 000 FCFA/an |
| **Total pour démarrer** | **0 FCFA** (domaine optionnel) |

---

## Besoin d'aide ?

- Documentation Next.js : https://nextjs.org/docs
- Documentation Supabase : https://supabase.com/docs
- Documentation Vercel : https://vercel.com/docs
- Campay (paiement CM) : https://campay.net/documentation

---
*BatiShop Cameroun — Code généré par Claude*
