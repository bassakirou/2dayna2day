# Export statique o2switch

Frontend public : https://2dayna2day.goldenbackapparel.com
WordPress public : https://admin2dayna2day.goldenbackapparel.com

## Origine du problème

L'ancien `.env` définissait l'API locale `https://2dayna2day.test/wp-json/wp/v2`. `next build` utilisait ce fichier partagé en production ; `NODE_ENV=production` active les optimisations et l'export, mais ne transforme pas les URLs. Les anciens bundles de `dist` contenaient ce domaine local.

`lib/wp-client.ts` privilégie NEXT_PUBLIC_WP_ORIGIN et déduit sinon l'origine depuis NEXT_PUBLIC_WP_API_URL. Les appels REST utilisent cette origine ; `lib/wp-graphql.ts` ajoute `/graphql`. `lib/product-builder.ts` utilise directement NEXT_PUBLIC_WP_API_URL pour les métadonnées produits. Les deux variables doivent donc désigner le même backend.

## Commandes et séparation

Utiliser Node.js 22 ou supérieur (le script utilise le lecteur de fichiers d'environnement natif).

- `npm run dev` : `.env.development`, WordPress local, port 3045.
- `npm run build:local` : export optimisé du backend local, résultat `dist-local` ; `npm run start:local` le prévisualise.
- `npm run config:production` : vérifie la configuration sans construire.
- `npm run build:production` (ou `npm run build`) : WordPress public, résultat `dist` après réussite ; `npm start` le prévisualise.

Le script d'export charge uniquement les deux variables WordPress du profil choisi. Priorité : environnement du processus, `.env.production.local`, `.env.production` (ou les équivalents development pour l'export local). Les valeurs sont fixées avant que Next charge ses fichiers : un ancien `.env.local` ne peut donc pas remplacer ces URLs dans le script. Un appel direct à `next build` reste soumis à la validation de configuration et refuse une origine locale en production.

La production exige le domaine WordPress public configuré, HTTPS, des URLs cohérentes sans identifiants ni paramètres, et une validation TLS active. Les variables du processus fournies par la CI sont respectées ; une incohérence arrête le build avant compilation. `out` est le répertoire intermédiaire du dernier export, quel que soit son profil : utiliser exclusivement `dist` pour la production et `dist-local` pour le local.

## Secrets et hébergement

La tentative de build du 11 octobre 2026 a compilé et passé les contrôles de types, mais la collecte des produits a reçu HTTP 503 avec le challenge navigateur Tiger Protect d'o2switch. Le backend doit autoriser les appels API nécessaires depuis la machine de build sans challenge JavaScript. Relancer ensuite `npm run build:production`. L'ancien `dist` reste un export local et ne doit pas être publié. Le script refuse aussi les URLs locales détectées dans les fichiers textuels d'un nouvel export avant de le copier vers `dist`.

Les variables NEXT_PUBLIC_* sont publiques et intégrées au JavaScript au build. Ne jamais y mettre de clé WooCommerce, secret JWT, mot de passe ou token serveur. Les fichiers de profils contiennent uniquement des URLs publiques ; les fichiers `.local` sont ignorés par Git. Aucun objet `process.env` complet n'est injecté dans la configuration Next.

WordPress doit être disponible pendant la génération des pages et des slugs. Une fois le build réussi, seuls les fichiers de `dist` sont destinés à la racine web du sous-domaine frontend, pas les sources, `.env`, `.next` ou le backend. Une modification d'URL nécessite un nouveau build, même si des variables sont définies chez o2switch.

Avant une future mise en ligne, WordPress devra fournir des URLs de médias publiques et autoriser les requêtes CORS depuis https://2dayna2day.goldenbackapparel.com pour les endpoints REST/GraphQL utilisés. Les routes statiques utilisent des répertoires avec `index.html` (`trailingSlash: true`). Aucun serveur Node n'est nécessaire pour servir l'export. Aucun déploiement n'est réalisé par les scripts.
